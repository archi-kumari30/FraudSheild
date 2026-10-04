const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const walletService = require('./walletService');
const deviceService = require('./deviceService');
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
const initiateTransfer = async (senderId, recipientId, amount, note = '', deviceContext = {}) => {
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

  // 2. Self-transfer block
  if (senderId.toString() === recipientId.toString()) {
    const error = new Error('Cannot transfer funds to yourself');
    error.status = 400;
    error.code = 'SELF_TRANSFER_PROHIBITED';
    throw error;
  }

  // 3. Verify recipient existence
  const recipientUser = await User.findById(recipientId);
  if (!recipientUser) {
    const error = new Error('Recipient user not found');
    error.status = 404;
    error.code = 'RECIPIENT_NOT_FOUND';
    throw error;
  }

  // 4. Pre-check sender liquid balance before engine invocation
  const senderWallet = await Wallet.findOne({ userId: senderId });
  if (!senderWallet || senderWallet.availableBalance < numericAmount) {
    const error = new Error('Insufficient available balance');
    error.status = 400;
    error.code = 'INSUFFICIENT_BALANCE';
    throw error;
  }

  // 5. Gather contextual telemetry & evaluate fraud heuristics
  const context = await collectContext(senderId, recipientId, deviceContext);
  const fraudResult = evaluateTransaction({ amount: numericAmount, senderId, recipientId }, context);

  let transactionStatus = 'PENDING';
  let httpStatus = 200;

  // 6. Execute lifecycle according to deterministic risk tier
  if (fraudResult.riskLevel === 'LOW') {
    // Approved: Deduct sender available balance and credit recipient available balance
    await walletService.executeApprovedTransfer(senderId, recipientId, numericAmount);
    transactionStatus = 'APPROVED';
    httpStatus = 200;

    // Register device if verified
    if (deviceContext.isVerified) {
      await deviceService.registerDevice(senderId, deviceContext);
    }
  } else if (fraudResult.riskLevel === 'MEDIUM') {
    // Review: Reserve funds in sender heldBalance escrow
    await walletService.executeEscrowHold(senderId, numericAmount);
    transactionStatus = 'FLAGGED_FOR_REVIEW';
    httpStatus = 202; // Accepted / Held for Review
  } else if (fraudResult.riskLevel === 'HIGH') {
    // Blocked: Zero balance deduction
    transactionStatus = 'BLOCKED';
    httpStatus = 400; // Blocked
  }

  // 7. Persist immutable transaction record
  const transaction = new Transaction({
    senderId,
    recipientId,
    amount: numericAmount,
    currency: 'INR',
    status: transactionStatus,
    riskScore: fraudResult.riskScore,
    riskLevel: fraudResult.riskLevel,
    triggeredRules: fraudResult.triggeredRules,
    deviceContext: {
      deviceId: deviceContext.deviceId || 'unknown',
      ipAddress: deviceContext.ipAddress || 'unknown',
      userAgent: deviceContext.userAgent || 'unknown'
    },
    note: (note || '').trim()
  });

  await transaction.save();
  await transaction.populate('senderId', 'name email');
  await transaction.populate('recipientId', 'name email');

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
const getUserTransactions = async (userId) => {
  return Transaction.find({
    $or: [{ senderId: userId }, { recipientId: userId }]
  })
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

module.exports = {
  initiateTransfer,
  getUserTransactions,
  getTransactionById
};
