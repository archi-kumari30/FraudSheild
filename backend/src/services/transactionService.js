const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const walletService = require('./walletService');
const deviceService = require('./deviceService');
const alertService = require('./alertService');
const auditService = require('./auditService');
const { runInTransaction } = require('../utils/dbTransaction');
const { collectContext } = require('../engine/contextCollector');
const { evaluateTransaction } = require('../engine/fraudEngine');

/**
 * Initiate digital payment transfer with real-time rule-based fraud detection
 * @param {string|ObjectId} senderId
 * @param {string|ObjectId} recipientId
 * @param {number} amount
 * @param {string} note
 * @param {Object} deviceContext
 * @returns {Promise<Object>}
 */
const initiateTransfer = async (senderId, recipientId, amount, note = '', deviceContext = {}, transactionPin = null) => {
  const numericAmount = Number(amount);

  // 1. Validate transfer amount
  if (isNaN(numericAmount) || numericAmount <= 0) {
    const error = new Error('Transfer amount must be a positive number');
    error.status = 400;
    error.code = 'INVALID_AMOUNT';
    throw error;
  }

  if (numericAmount > 1000000) {
    const error = new Error('Transfer amount exceeds maximum per-transaction limit of ₹1,000,000');
    error.status = 400;
    error.code = 'AMOUNT_EXCEEDS_LIMIT';
    throw error;
  }

  // 2. Resolve & verify recipient existence
  let resolvedRecipientId = recipientId;
  let recipientUser = null;

  if (mongoose.Types.ObjectId.isValid(recipientId)) {
    recipientUser = await User.findById(recipientId);
    if (!recipientUser) {
      const Beneficiary = require('../models/Beneficiary');
      const ben = await Beneficiary.findOne({ _id: recipientId, userId: senderId });
      if (ben) {
        resolvedRecipientId = ben.recipientAccountId;
        recipientUser = await User.findById(resolvedRecipientId);
      }
    }
  } else if (typeof recipientId === 'string' && recipientId.includes('@')) {
    recipientUser = await User.findOne({ email: recipientId.toLowerCase().trim() });
    if (recipientUser) {
      resolvedRecipientId = recipientUser._id;
    }
  }

  if (!recipientUser) {
    const error = new Error('Recipient user not found');
    error.status = 404;
    error.code = 'RECIPIENT_NOT_FOUND';
    throw error;
  }

  // Self-transfer block
  if (senderId.toString() === resolvedRecipientId.toString()) {
    const error = new Error('Cannot transfer funds to yourself');
    error.status = 400;
    error.code = 'SELF_TRANSFER_PROHIBITED';
    throw error;
  }

  // 3. Sender Verification & Mandatory Transaction PIN Authentication
  const senderUser = await User.findById(senderId);
  if (!senderUser) {
    const error = new Error('Sender user not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Check if sender has configured a Transaction PIN
  if (!senderUser.transactionPinHash) {
    const error = new Error('Transaction PIN not configured. Please set up your 6-digit Transaction PIN in Security Settings before sending money.');
    error.status = 400;
    error.code = 'TRANSACTION_PIN_NOT_SET';
    throw error;
  }

  // Require Transaction PIN for EVERY outgoing payment
  if (!transactionPin || !/^\d{6}$/.test(String(transactionPin))) {
    const error = new Error('A 6-digit Transaction PIN is required to authorize this payment');
    error.status = 400;
    error.code = 'PIN_REQUIRED';
    throw error;
  }

  // Brute-force lock check
  if (senderUser.pinLockedUntil && new Date(senderUser.pinLockedUntil) > new Date()) {
    const remainingMins = Math.ceil((new Date(senderUser.pinLockedUntil).getTime() - Date.now()) / (60 * 1000));
    const error = new Error(`Transaction PIN verification is locked due to multiple failed attempts. Please wait ${remainingMins} minutes before trying again.`);
    error.status = 429;
    error.code = 'PIN_LOCKED';
    throw error;
  }

  const isPinValid = await senderUser.comparePin(String(transactionPin));
  if (!isPinValid) {
    senderUser.pinFailedAttempts = (senderUser.pinFailedAttempts || 0) + 1;
    if (senderUser.pinFailedAttempts >= 3) {
      senderUser.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
    }
    await senderUser.save();

    await auditService.logEvent({
      eventType: 'TRANSACTION_PIN_FAILED',
      actorId: senderId,
      actorRole: 'customer',
      metadata: { failedAttempts: senderUser.pinFailedAttempts, isLocked: senderUser.pinFailedAttempts >= 3 },
      ipAddress: deviceContext.ipAddress || 'unknown'
    });

    if (senderUser.pinFailedAttempts >= 3) {
      await alertService.createAlert(
        senderId,
        null,
        'HIGH',
        'Security Alert: Transaction PIN Locked',
        'Multiple failed PIN attempts were detected. Your Transaction PIN has been temporarily locked for 15 minutes.'
      );
    }

    const error = new Error('Incorrect Transaction PIN. Payment authorization failed.');
    error.status = 401;
    error.code = 'INVALID_PIN';
    throw error;
  }

  // Reset failed PIN attempts on successful verification
  if (senderUser.pinFailedAttempts > 0 || senderUser.pinLockedUntil) {
    senderUser.pinFailedAttempts = 0;
    senderUser.pinLockedUntil = null;
    await senderUser.save();
  }

  await auditService.logEvent({
    eventType: 'TRANSACTION_PIN_VERIFIED',
    actorId: senderId,
    actorRole: 'customer',
    metadata: { method: 'TRANSACTION_PIN' },
    ipAddress: deviceContext.ipAddress || 'unknown'
  });

  // 4. Pre-check sender liquid balance before engine invocation
  const senderWallet = await Wallet.findOne({ userId: senderId });
  if (!senderWallet || senderWallet.availableBalance < numericAmount) {
    const error = new Error('Insufficient available balance');
    error.status = 400;
    error.code = 'INSUFFICIENT_BALANCE';
    throw error;
  }

  // 5. Gather contextual telemetry & evaluate fraud heuristics
  const context = await collectContext(senderId, resolvedRecipientId, deviceContext);
  const fraudResult = evaluateTransaction({ amount: numericAmount, senderId, recipientId: resolvedRecipientId }, context);

  let transactionStatus = 'PENDING';
  let httpStatus = 200;

  // 6. Execute lifecycle and persist under ACID transaction session
  if (fraudResult.riskLevel === 'LOW') {
    transactionStatus = 'APPROVED';
    httpStatus = 200;
  } else if (fraudResult.riskLevel === 'MEDIUM') {
    transactionStatus = 'CUSTOMER_VERIFICATION_REQUIRED';
    httpStatus = 202; // Accepted / Customer Verification Required
  } else if (fraudResult.riskLevel === 'HIGH') {
    transactionStatus = 'BLOCKED';
    httpStatus = 400; // Blocked
  }

  // 7. Persist immutable transaction record atomically with wallet mutations
  const senderObjId = mongoose.Types.ObjectId.isValid(senderId)
    ? new mongoose.Types.ObjectId(senderId.toString())
    : senderId;
  const recipientObjId = mongoose.Types.ObjectId.isValid(resolvedRecipientId)
    ? new mongoose.Types.ObjectId(resolvedRecipientId.toString())
    : resolvedRecipientId;

  const transaction = new Transaction({
    senderId: senderObjId,
    recipientId: recipientObjId,
    amount: numericAmount,
    currency: 'INR',
    status: transactionStatus,
    riskScore: fraudResult.riskScore,
    riskLevel: fraudResult.riskLevel,
    triggeredRules: fraudResult.triggeredRules,
    attributionWaterfall: fraudResult.attributionWaterfall || [],
    mitigatingSignals: fraudResult.mitigatingSignals || [],
    waterfallSummary: fraudResult.waterfallSummary || {},
    caseStatus: transactionStatus === 'FLAGGED_FOR_REVIEW' ? 'UNASSIGNED' : 'UNASSIGNED',
    casePriority: fraudResult.riskScore >= 90 ? 'P1_CRITICAL' : fraudResult.riskScore >= 70 ? 'P2_HIGH' : 'P3_MEDIUM',
    deviceContext: {
      deviceId: deviceContext.deviceId || 'unknown',
      ipAddress: deviceContext.ipAddress || 'unknown',
      userAgent: deviceContext.userAgent || 'unknown',
      isKnownDevice: context.isKnownDevice || false,
      isKnownIp: context.isKnownIp || false
    },
    behaviorContext: {
      historyAvg: context.historyAvg || 0,
      amountRatio: context.historyAvg > 0 ? Number((numericAmount / context.historyAvg).toFixed(2)) : 0,
      historyCount: context.historyCount || 0
    },
    note: (note || '').trim()
  });

  await runInTransaction(async (session) => {
    const saveOptions = session ? { session } : {};

    if (fraudResult.riskLevel === 'LOW') {
      await walletService.executeApprovedTransfer(senderId, resolvedRecipientId, numericAmount, session);
    } else if (fraudResult.riskLevel === 'MEDIUM') {
      await walletService.executeEscrowHold(senderId, numericAmount, session);
    }
    // HIGH risk requires zero wallet mutations

    await transaction.save(saveOptions);
  });

  // Register device if verified
  if (fraudResult.riskLevel === 'LOW' && deviceContext.isVerified) {
    await deviceService.registerDevice(senderId, deviceContext);
  }

  await transaction.populate('senderId', 'name email');
  await transaction.populate('recipientId', 'name email');

  // 8. Auto-generate alerts for suspicious transactions and unrecognized access
  if (transactionStatus === 'CUSTOMER_VERIFICATION_REQUIRED') {
    const alert = await alertService.createAlert(
      senderId,
      transaction._id,
      'MEDIUM',
      'Additional verification is required for this payment.',
      `FraudShield detected unusual activity. Please confirm that you initiated this payment.`
    );
    await auditService.logEvent({
      eventType: 'ALERT_GENERATED',
      actorId: senderId,
      actorRole: 'system',
      targetEntity: { entityType: 'Alert', entityId: alert._id },
      metadata: { severity: 'MEDIUM', transactionId: transaction._id }
    });
  } else if (transactionStatus === 'BLOCKED') {
    const alert = await alertService.createAlert(
      senderId,
      transaction._id,
      'HIGH',
      'High-risk payment blocked.',
      `High-risk transfer of ₹${numericAmount.toLocaleString('en-IN')} to ${recipientUser.name} blocked due to elevated security risk (Score: ${fraudResult.riskScore}/100). Zero funds deducted.`
    );
    await auditService.logEvent({
      eventType: 'ALERT_GENERATED',
      actorId: senderId,
      actorRole: 'system',
      targetEntity: { entityType: 'Alert', entityId: alert._id },
      metadata: { severity: 'HIGH', transactionId: transaction._id }
    });
  } else if (!context.isKnownDevice) {
    const alert = await alertService.createAlert(
      senderId,
      transaction._id,
      'MEDIUM',
      'Security Alert: Unrecognized Device Detected',
      `A payment of ₹${numericAmount.toLocaleString('en-IN')} was initiated from an unrecognized device (${deviceContext.deviceId || 'unrecognized'}). If this wasn't you, please secure your account immediately.`
    );
    await auditService.logEvent({
      eventType: 'ALERT_GENERATED',
      actorId: senderId,
      actorRole: 'system',
      targetEntity: { entityType: 'Alert', entityId: alert._id },
      metadata: { severity: 'MEDIUM', transactionId: transaction._id, reason: 'NEW_DEVICE' }
    });
  }

  // Log suspicious payment access telemetry
  if (!context.isKnownDevice) {
    await auditService.logEvent({
      eventType: 'NEW_DEVICE_DETECTED',
      actorId: senderId,
      actorRole: 'customer',
      targetEntity: { entityType: 'Transaction', entityId: transaction._id },
      metadata: {
        deviceId: deviceContext.deviceId || 'unknown',
        userAgent: deviceContext.userAgent || 'unknown',
        ipAddress: deviceContext.ipAddress || 'unknown',
        amount: numericAmount
      },
      ipAddress: deviceContext.ipAddress || 'unknown'
    });
  }

  if (!context.isKnownDevice || !context.isKnownIp || fraudResult.riskLevel !== 'LOW') {
    await auditService.logEvent({
      eventType: 'SUSPICIOUS_PAYMENT_ATTEMPT',
      actorId: senderId,
      actorRole: 'customer',
      targetEntity: { entityType: 'Transaction', entityId: transaction._id },
      metadata: {
        deviceId: deviceContext.deviceId || 'unknown',
        isKnownDevice: context.isKnownDevice || false,
        isKnownIp: context.isKnownIp || false,
        riskScore: fraudResult.riskScore,
        riskLevel: fraudResult.riskLevel,
        amount: numericAmount
      },
      ipAddress: deviceContext.ipAddress || 'unknown'
    });
  }

  // 9. Instrument audit logging (TC-M9-002)
  await auditService.logEvent({
    eventType: 'TRANSACTION_INITIATED',
    actorId: senderId,
    actorRole: 'customer',
    targetEntity: { entityType: 'Transaction', entityId: transaction._id },
    metadata: {
      amount: numericAmount,
      recipientId: recipientId.toString(),
      status: transactionStatus
    },
    ipAddress: deviceContext.ipAddress || 'unknown'
  });

  await auditService.logEvent({
    eventType: 'FRAUD_EVALUATION_COMPLETED',
    actorId: senderId,
    actorRole: 'customer',
    targetEntity: { entityType: 'Transaction', entityId: transaction._id },
    metadata: {
      amount: numericAmount,
      riskScore: fraudResult.riskScore,
      riskLevel: fraudResult.riskLevel,
      triggeredRules: fraudResult.triggeredRules,
      outcome: transactionStatus
    },
    ipAddress: deviceContext.ipAddress || 'unknown'
  });

  return {
    httpStatus,
    status: transactionStatus,
    transaction,
    riskScore: fraudResult.riskScore,
    riskLevel: fraudResult.riskLevel
  };
};

/**
 * Retrieve transaction history for user
 * @param {string|ObjectId} userId
 * @returns {Promise<Array<Transaction>>}
 */
const getUserTransactions = async (userId, userRole = 'customer') => {
  const userObjId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId.toString())
    : userId;

  const query = userRole === 'admin'
    ? {}
    : { $or: [{ senderId: userObjId }, { recipientId: userObjId }] };

  return Transaction.find(query)
    .sort({ createdAt: -1 })
    .populate('senderId', 'name email')
    .populate('recipientId', 'name email');
};

/**
 * Retrieve transaction by ID with ownership guard
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} transactionId
 * @param {string} userRole
 * @returns {Promise<Transaction>}
 */
const getTransactionById = async (userId, transactionId, userRole = 'customer') => {
  const transaction = await Transaction.findById(transactionId)
    .populate('senderId', 'name email')
    .populate('recipientId', 'name email');

  if (!transaction) {
    const error = new Error('Transaction not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Only sender, recipient, or admin can inspect transaction
  const isSender = transaction.senderId._id.toString() === userId.toString();
  const isRecipient = transaction.recipientId._id.toString() === userId.toString();
  const isAdmin = userRole === 'admin';

  if (!isSender && !isRecipient && !isAdmin) {
    const error = new Error('Access denied to transaction record');
    error.status = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  return transaction;
};

/**
 * Customer confirms that they personally initiated a medium-risk transaction.
 * Re-runs backend security checks before settlement.
 * @param {string|ObjectId} userId - Logged-in customer ID
 * @param {string|ObjectId} transactionId - Transaction to confirm
 * @param {Object} deviceContext - Request device context
 * @returns {Promise<Object>}
 */
const confirmTransaction = async (userId, transactionId, deviceContext = {}, verificationPayload = {}) => {
  // 1. Audit log customer verification attempt
  await auditService.logEvent({
    eventType: 'CUSTOMER_VERIFICATION_ATTEMPT',
    actorId: userId,
    actorRole: 'customer',
    targetEntity: { entityType: 'Transaction', entityId: transactionId },
    metadata: { transactionId: transactionId.toString() },
    ipAddress: deviceContext.ipAddress || 'unknown'
  });

  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    const error = new Error('Invalid transaction ID');
    error.status = 400;
    error.code = 'INVALID_ID';
    throw error;
  }

  // 2. Fetch transaction
  const transaction = await Transaction.findById(transactionId)
    .populate('senderId', 'name email')
    .populate('recipientId', 'name email');

  if (!transaction) {
    const error = new Error('Transaction not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  // 3. Ownership verification: must belong to the logged-in user
  const senderIdStr = (transaction.senderId?._id || transaction.senderId).toString();
  if (senderIdStr !== userId.toString()) {
    const error = new Error('Unauthorized: You can only confirm transactions initiated from your own account');
    error.status = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  // 3b. Mandatory Transaction PIN Verification
  const user = await User.findById(userId);
  if (!user || !user.transactionPinHash) {
    const error = new Error('Transaction PIN not configured. Please set up your 6-digit Transaction PIN in Security Settings before verifying payments.');
    error.status = 400;
    error.code = 'TRANSACTION_PIN_NOT_SET';
    throw error;
  }

  if (user.pinLockedUntil && new Date(user.pinLockedUntil) > new Date()) {
    const remainingMins = Math.ceil((new Date(user.pinLockedUntil).getTime() - Date.now()) / (60 * 1000));
    const error = new Error(`Transaction PIN verification is locked due to multiple failed attempts. Please wait ${remainingMins} minutes before trying again.`);
    error.status = 429;
    error.code = 'PIN_LOCKED';
    throw error;
  }

  const candidatePin = verificationPayload?.transactionPin;
  if (!candidatePin || !/^\d{6}$/.test(String(candidatePin))) {
    const error = new Error('A 6-digit Transaction PIN is required to authorize this payment');
    error.status = 400;
    error.code = 'PIN_REQUIRED';
    throw error;
  }

  const isPinValid = await user.comparePin(String(candidatePin));
  if (!isPinValid) {
    user.pinFailedAttempts = (user.pinFailedAttempts || 0) + 1;
    if (user.pinFailedAttempts >= 3) {
      user.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
    }
    await user.save();

    await auditService.logEvent({
      eventType: 'STEP_UP_PIN_FAILED',
      actorId: userId,
      actorRole: 'customer',
      targetEntity: { entityType: 'Transaction', entityId: transactionId },
      metadata: { failedAttempts: user.pinFailedAttempts, isLocked: user.pinFailedAttempts >= 3 },
      ipAddress: deviceContext.ipAddress || 'unknown'
    });

    const error = new Error('Incorrect transaction PIN. Please verify your 6-digit PIN and try again.');
    error.status = 401;
    error.code = 'INVALID_PIN';
    throw error;
  }

  // Reset failed counter upon successful PIN verification
  user.pinFailedAttempts = 0;
  user.pinLockedUntil = null;
  await user.save();

  await auditService.logEvent({
    eventType: 'STEP_UP_PIN_VERIFIED',
    actorId: userId,
    actorRole: 'customer',
    targetEntity: { entityType: 'Transaction', entityId: transactionId },
    metadata: { method: 'TRANSACTION_PIN' },
    ipAddress: deviceContext.ipAddress || 'unknown'
  });

  // 4. Verification state check
  if (transaction.status === 'APPROVED') {
    const error = new Error('Transaction has already been verified and completed');
    error.status = 400;
    error.code = 'ALREADY_PROCESSED';
    throw error;
  }

  if (transaction.status !== 'CUSTOMER_VERIFICATION_REQUIRED') {
    const error = new Error(`Transaction is not awaiting customer verification (current status: ${transaction.status})`);
    error.status = 400;
    error.code = 'INVALID_TRANSACTION_STATE';
    throw error;
  }

  // 5. Concurrency & idempotency guard: atomically change status from CUSTOMER_VERIFICATION_REQUIRED to PENDING
  const lockedTx = await Transaction.findOneAndUpdate(
    { _id: transactionId, senderId: userId, status: 'CUSTOMER_VERIFICATION_REQUIRED' },
    { $set: { status: 'PENDING' } },
    { new: true }
  ).populate('senderId', 'name email').populate('recipientId', 'name email');

  if (!lockedTx) {
    const error = new Error('Transaction is currently being processed or has already been verified');
    error.status = 409;
    error.code = 'CONCURRENT_CONFIRMATION';
    throw error;
  }

  try {
    // 6. Check wallet escrow balance
    const senderWallet = await Wallet.findOne({ userId });
    if (!senderWallet || senderWallet.heldBalance < transaction.amount) {
      lockedTx.status = 'CUSTOMER_VERIFICATION_REQUIRED';
      await lockedTx.save();
      const error = new Error('Insufficient held escrow balance to complete settlement');
      error.status = 400;
      error.code = 'INSUFFICIENT_HELD_BALANCE';
      throw error;
    }

    // 7. Re-run backend security checks before settlement
    const recipientId = transaction.recipientId?._id || transaction.recipientId;
    const freshContext = await collectContext(userId, recipientId, deviceContext);
    const reEvaluation = evaluateTransaction(
      { amount: transaction.amount, senderId: userId, recipientId },
      freshContext
    );

    // If fresh checks determine transaction is HIGH risk:
    if (reEvaluation.riskLevel === 'HIGH') {
      await runInTransaction(async (session) => {
        const saveOptions = session ? { session } : {};
        // Release held funds back to sender's available balance, zero funds to recipient
        await walletService.refundEscrow(userId, transaction.amount, session);
        lockedTx.status = 'BLOCKED';
        lockedTx.riskScore = reEvaluation.riskScore;
        lockedTx.riskLevel = 'HIGH';
        lockedTx.triggeredRules = reEvaluation.triggeredRules;
        lockedTx.resolutionStatus = 'REJECTED';
        lockedTx.resolvedAt = new Date();
        lockedTx.resolutionNotes = 'Blocked during post-verification security screening.';
        await lockedTx.save(saveOptions);
      });

      // Alert
      await alertService.createAlert(
        userId,
        transaction._id,
        'HIGH',
        'Payment Blocked',
        `FraudShield blocked this payment because critical security signals indicated high fraud risk during post-verification checks. Funds have been returned to your available balance.`
      );

      // Audit log
      await auditService.logEvent({
        eventType: 'CUSTOMER_VERIFICATION_BLOCKED',
        actorId: userId,
        actorRole: 'customer',
        targetEntity: { entityType: 'Transaction', entityId: transaction._id },
        metadata: {
          amount: transaction.amount,
          riskScore: reEvaluation.riskScore,
          status: 'BLOCKED'
        },
        ipAddress: deviceContext.ipAddress || 'unknown'
      });

      return {
        status: 'BLOCKED',
        transaction: lockedTx,
        message: 'Payment Blocked'
      };
    }

    // 8. Acceptable -> Release escrow and settle to recipient atomically
    await runInTransaction(async (session) => {
      const saveOptions = session ? { session } : {};
      await walletService.releaseEscrowAndSettle(userId, recipientId, transaction.amount, session);

      lockedTx.status = 'APPROVED';
      lockedTx.resolutionStatus = 'APPROVED';
      lockedTx.resolvedAt = new Date();
      lockedTx.resolutionNotes = 'Customer verified initiation of payment.';
      lockedTx.verificationDetails = {
        verifiedAt: new Date(),
        verifiedVia: 'CUSTOMER_CONFIRMATION',
        ipAddress: deviceContext.ipAddress || 'unknown'
      };
      await lockedTx.save(saveOptions);
    });

    // Register device if presented
    if (deviceContext.deviceId && deviceContext.deviceId !== 'unknown') {
      await deviceService.registerDevice(userId, deviceContext);
    }

    // 9. Audit logs for successful verification and settlement
    await auditService.logEvent({
      eventType: 'CUSTOMER_VERIFIED',
      actorId: userId,
      actorRole: 'customer',
      targetEntity: { entityType: 'Transaction', entityId: transaction._id },
      metadata: {
        amount: transaction.amount,
        status: 'APPROVED',
        method: 'CUSTOMER_CONFIRMATION'
      },
      ipAddress: deviceContext.ipAddress || 'unknown'
    });

    await auditService.logEvent({
      eventType: 'TRANSACTION_SETTLED',
      actorId: userId,
      actorRole: 'customer',
      targetEntity: { entityType: 'Transaction', entityId: transaction._id },
      metadata: {
        amount: transaction.amount,
        recipientId: recipientId.toString(),
        status: 'APPROVED'
      },
      ipAddress: deviceContext.ipAddress || 'unknown'
    });



    return {
      status: 'APPROVED',
      transaction: lockedTx,
      message: 'Payment Completed'
    };
  } catch (err) {
    // If not already resolved/refunded and still in PENDING, revert status back to CUSTOMER_VERIFICATION_REQUIRED
    if (lockedTx.status === 'PENDING') {
      lockedTx.status = 'CUSTOMER_VERIFICATION_REQUIRED';
      await lockedTx.save().catch(() => {});
    }
    throw err;
  }
};

/**
 * Customer reports they did not initiate the payment, or system escalates case to Admin Review Queue
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} transactionId
 * @param {string} reason
 * @param {Object} deviceContext
 * @returns {Promise<Object>}
 */
const escalateTransaction = async (userId, transactionId, reason = 'Customer reported unauthorized activity', deviceContext = {}) => {
  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    const error = new Error('Invalid transaction ID');
    error.status = 400;
    error.code = 'INVALID_ID';
    throw error;
  }

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    const error = new Error('Transaction not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const senderIdStr = (transaction.senderId?._id || transaction.senderId).toString();
  if (senderIdStr !== userId.toString()) {
    const error = new Error('Unauthorized: You can only report transactions from your own account');
    error.status = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  if (transaction.status !== 'CUSTOMER_VERIFICATION_REQUIRED') {
    const error = new Error(`Transaction cannot be escalated. Current status: ${transaction.status}`);
    error.status = 400;
    error.code = 'INVALID_TRANSACTION_STATE';
    throw error;
  }

  // Escalate to Admin Review Queue
  transaction.status = 'FLAGGED_FOR_REVIEW';
  transaction.resolutionNotes = `Escalated to Fraud Operations: ${reason}`;
  await transaction.save();

  // Create audit log for escalation
  await auditService.logEvent({
    eventType: 'TRANSACTION_ESCALATED_TO_ADMIN',
    actorId: userId,
    actorRole: 'customer',
    targetEntity: { entityType: 'Transaction', entityId: transaction._id },
    metadata: {
      reason,
      amount: transaction.amount,
      status: 'FLAGGED_FOR_REVIEW'
    },
    ipAddress: deviceContext.ipAddress || 'unknown'
  });

  // Alert user
  await alertService.createAlert(
    userId,
    transaction._id,
    'MEDIUM',
    'Transaction Escalated for Security Investigation',
    `Your transfer has been escalated to Fraud Operations for investigation as unauthorized/suspicious activity. Funds remain safely in escrow.`
  );

  return {
    status: 'FLAGGED_FOR_REVIEW',
    transaction,
    message: 'Transaction escalated to Fraud Operations.'
  };
};

/**
 * Customer declines a medium-risk transaction held in escrow.
 * Atomically releases escrow funds back to sender's available balance and sets status to REJECTED.
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} transactionId
 * @param {string} reason
 * @param {Object} deviceContext
 * @returns {Promise<Object>}
 */
const declineTransaction = async (userId, transactionId, reason = 'Declined by customer', deviceContext = {}) => {
  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    const error = new Error('Invalid transaction ID');
    error.status = 400;
    error.code = 'INVALID_ID';
    throw error;
  }

  // 1. Fetch transaction
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    const error = new Error('Transaction not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  // 2. Ownership verification: must belong to the logged-in user
  const senderIdStr = (transaction.senderId?._id || transaction.senderId).toString();
  if (senderIdStr !== userId.toString()) {
    const error = new Error('Unauthorized: You can only decline transactions initiated from your own account');
    error.status = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  // 3. State verification
  if (['REJECTED', 'APPROVED', 'BLOCKED', 'REFUNDED'].includes(transaction.status)) {
    const error = new Error(`Transaction has already been processed or finalized (current status: ${transaction.status})`);
    error.status = 400;
    error.code = 'ALREADY_FINALIZED';
    throw error;
  }

  if (!['CUSTOMER_VERIFICATION_REQUIRED', 'FLAGGED_FOR_REVIEW'].includes(transaction.status)) {
    const error = new Error(`Transaction cannot be declined in status: ${transaction.status}`);
    error.status = 400;
    error.code = 'INVALID_TRANSACTION_STATE';
    throw error;
  }

  // 4. Atomic CAS state transition to prevent duplicate refund / race conditions
  const lockedTx = await Transaction.findOneAndUpdate(
    {
      _id: transactionId,
      senderId: userId,
      status: { $in: ['CUSTOMER_VERIFICATION_REQUIRED', 'FLAGGED_FOR_REVIEW'] }
    },
    { $set: { status: 'DECLINING' } },
    { new: true }
  );

  if (!lockedTx) {
    const error = new Error('Transaction is already being processed or has already been declined/refunded');
    error.status = 409;
    error.code = 'CONCURRENT_DECLINE';
    throw error;
  }

  try {
    // 5. Execute atomic refund of escrow held funds back to sender's available balance
    await runInTransaction(async (session) => {
      const saveOptions = session ? { session } : {};

      // Refund heldBalance back to availableBalance
      await walletService.refundEscrow(userId, lockedTx.amount, session);

      lockedTx.status = 'REJECTED';
      lockedTx.resolutionStatus = 'REJECTED';
      lockedTx.resolvedAt = new Date();
      lockedTx.resolutionNotes = reason || 'Declined by customer';
      lockedTx.caseStatus = 'CLOSED';

      await lockedTx.save(saveOptions);
    });

    // 6. Security Alert for customer
    await alertService.createAlert(
      userId,
      lockedTx._id,
      'MEDIUM',
      'Payment Declined — Escrow Restored',
      `Payment of ₹${lockedTx.amount.toLocaleString('en-IN')} was declined. Escrow funds have been restored immediately to your available balance. Recipient received ₹0.`
    );

    // 7. Audit log event
    await auditService.logEvent({
      eventType: 'CUSTOMER_TRANSACTION_DECLINED',
      actorId: userId,
      actorRole: 'customer',
      targetEntity: { entityType: 'Transaction', entityId: lockedTx._id },
      metadata: {
        amount: lockedTx.amount,
        status: 'REJECTED',
        reason
      },
      ipAddress: deviceContext.ipAddress || 'unknown'
    });

    await lockedTx.populate('senderId', 'name email');
    await lockedTx.populate('recipientId', 'name email');

    return {
      status: 'REJECTED',
      transaction: lockedTx,
      message: 'Payment declined. Funds restored to your available balance.'
    };
  } catch (err) {
    if (lockedTx.status === 'DECLINING') {
      lockedTx.status = transaction.status; // Revert to previous status
      await lockedTx.save().catch(() => {});
    }
    throw err;
  }
};

module.exports = {
  initiateTransfer,
  getUserTransactions,
  getTransactionById,
  confirmTransaction,
  escalateTransaction,
  declineTransaction
};

