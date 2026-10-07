const mongoose = require('mongoose');
const Dispute = require('../models/Dispute');
const Transaction = require('../models/Transaction');
const walletService = require('./walletService');
const alertService = require('./alertService');
const auditService = require('./auditService');

/**
 * Raise a dispute for an approved transaction
 * @param {string|ObjectId} userId - Requester ID (sender of transaction)
 * @param {string|ObjectId} transactionId
 * @param {string} reason
 * @returns {Promise<Dispute>}
 */
const createDispute = async (userId, transactionId, reason) => {
  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    const error = new Error('Invalid transaction ID');
    error.status = 400;
    error.code = 'INVALID_ID';
    throw error;
  }

  const trimmedReason = (reason || '').trim();
  if (!trimmedReason || trimmedReason.length < 5) {
    const error = new Error('Dispute reason must be at least 5 characters long');
    error.status = 400;
    error.code = 'INVALID_REASON';
    throw error;
  }

  if (trimmedReason.length > 500) {
    const error = new Error('Dispute reason cannot exceed 500 characters');
    error.status = 400;
    error.code = 'REASON_TOO_LONG';
    throw error;
  }

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    const error = new Error('Transaction not found');
    error.status = 404;
    error.code = 'TRANSACTION_NOT_FOUND';
    throw error;
  }

  // Only the sender who initiated the transaction can raise a dispute
  if (transaction.senderId.toString() !== userId.toString()) {
    const error = new Error('You can only dispute transactions initiated from your own account');
    error.status = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  // Only approved transactions can be disputed
  if (transaction.status !== 'APPROVED') {
    const error = new Error('Only completed and approved transactions can be disputed');
    error.status = 400;
    error.code = 'INVALID_TRANSACTION_STATUS';
    throw error;
  }

  // Prevent duplicate disputes
  if (transaction.isDisputed) {
    const error = new Error('This transaction already has an active or resolved dispute');
    error.status = 409;
    error.code = 'DUPLICATE_DISPUTE';
    throw error;
  }

  const existingDispute = await Dispute.findOne({ transactionId });
  if (existingDispute) {
    const error = new Error('A dispute already exists for this transaction');
    error.status = 409;
    error.code = 'DUPLICATE_DISPUTE';
    throw error;
  }

  const dispute = new Dispute({
    transactionId: transaction._id,
    requesterId: transaction.senderId,
    recipientId: transaction.recipientId,
    amount: transaction.amount,
    reason: trimmedReason,
    status: 'OPEN'
  });

  await dispute.save();

  // Flag transaction as disputed
  transaction.isDisputed = true;
  transaction.disputeId = dispute._id;
  await transaction.save();

  // Inform recipient via alert
  await alertService.createAlert(
    transaction.recipientId,
    transaction._id,
    'MEDIUM',
    'Payment Dispute Raised',
    `A dispute has been raised regarding payment of ₹${transaction.amount.toLocaleString('en-IN')}. Please review and provide your response.`
  );

  // Audit log dispute creation
  await auditService.logEvent({
    eventType: 'DISPUTE_CREATED',
    actorId: userId,
    actorRole: 'customer',
    targetEntity: { entityType: 'Dispute', entityId: dispute._id },
    metadata: {
      transactionId: transaction._id.toString(),
      amount: transaction.amount,
      reason: trimmedReason
    }
  });

  return Dispute.findById(dispute._id)
    .populate('transactionId')
    .populate('requesterId', 'name email')
    .populate('recipientId', 'name email');
};

/**
 * Get disputes relevant to a user (as requester or recipient)
 * @param {string|ObjectId} userId
 * @param {string} [roleFilter] - 'requester' | 'recipient' | null
 * @returns {Promise<Array<Dispute>>}
 */
const getDisputesForUser = async (userId, roleFilter = null) => {
  const userObjId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId.toString())
    : userId;

  let query = {};
  if (roleFilter === 'requester') {
    query = { requesterId: userObjId };
  } else if (roleFilter === 'recipient') {
    query = { recipientId: userObjId };
  } else {
    query = { $or: [{ requesterId: userObjId }, { recipientId: userObjId }] };
  }

  return Dispute.find(query)
    .sort({ createdAt: -1 })
    .populate('transactionId')
    .populate('requesterId', 'name email')
    .populate('recipientId', 'name email')
    .populate('adminDecision.decidedBy', 'name email');
};

/**
 * Get a dispute by ID with access control guard
 * @param {string|ObjectId} disputeId
 * @param {string|ObjectId} userId
 * @param {string} userRole
 * @returns {Promise<Dispute>}
 */
const getDisputeById = async (disputeId, userId, userRole = 'customer') => {
  if (!mongoose.Types.ObjectId.isValid(disputeId)) {
    const error = new Error('Invalid dispute ID');
    error.status = 400;
    error.code = 'INVALID_ID';
    throw error;
  }

  const dispute = await Dispute.findById(disputeId)
    .populate('transactionId')
    .populate('requesterId', 'name email')
    .populate('recipientId', 'name email')
    .populate('adminDecision.decidedBy', 'name email');

  if (!dispute) {
    const error = new Error('Dispute not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const isRequester = dispute.requesterId._id.toString() === userId.toString();
  const isRecipient = dispute.recipientId._id.toString() === userId.toString();
  const isAdmin = userRole === 'admin';

  if (!isRequester && !isRecipient && !isAdmin) {
    const error = new Error('Access denied to dispute record');
    error.status = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  return dispute;
};

/**
 * Submit recipient response to a dispute
 * @param {string|ObjectId} userId - Logged in recipient
 * @param {string|ObjectId} disputeId
 * @param {Object} responseData - { recognized, agreesToReturn, responseNote }
 * @returns {Promise<Dispute>}
 */
const submitRecipientResponse = async (userId, disputeId, responseData) => {
  if (!mongoose.Types.ObjectId.isValid(disputeId)) {
    const error = new Error('Invalid dispute ID');
    error.status = 400;
    error.code = 'INVALID_ID';
    throw error;
  }

  const dispute = await Dispute.findById(disputeId);
  if (!dispute) {
    const error = new Error('Dispute not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Only the recipient can respond
  if (dispute.recipientId.toString() !== userId.toString()) {
    const error = new Error('Only the recipient of this payment can submit a response');
    error.status = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  // Only open disputes can receive responses
  if (dispute.status !== 'OPEN') {
    const error = new Error('Dispute is no longer open for recipient response');
    error.status = 400;
    error.code = 'INVALID_DISPUTE_STATUS';
    throw error;
  }

  const { recognized, agreesToReturn, responseNote } = responseData;
  const note = (responseNote || '').trim();

  if (note.length > 500) {
    const error = new Error('Response note cannot exceed 500 characters');
    error.status = 400;
    error.code = 'NOTE_TOO_LONG';
    throw error;
  }

  dispute.recipientResponse = {
    recognized: typeof recognized === 'boolean' ? recognized : null,
    agreesToReturn: typeof agreesToReturn === 'boolean' ? agreesToReturn : null,
    responseNote: note,
    respondedAt: new Date()
  };
  dispute.status = 'RECIPIENT_RESPONDED';

  await dispute.save();

  // Audit log recipient response
  await auditService.logEvent({
    eventType: 'DISPUTE_RECIPIENT_RESPONSE',
    actorId: userId,
    actorRole: 'customer',
    targetEntity: { entityType: 'Dispute', entityId: dispute._id },
    metadata: {
      recognized: dispute.recipientResponse.recognized,
      agreesToReturn: dispute.recipientResponse.agreesToReturn,
      responseNote: note
    }
  });

  return Dispute.findById(dispute._id)
    .populate('transactionId')
    .populate('requesterId', 'name email')
    .populate('recipientId', 'name email');
};

/**
 * Get all disputes for admin review
 * @param {Object} [filter]
 * @returns {Promise<Array<Dispute>>}
 */
const getAdminDisputes = async (filter = {}) => {
  return Dispute.find(filter)
    .sort({ createdAt: -1 })
    .populate('transactionId')
    .populate('requesterId', 'name email')
    .populate('recipientId', 'name email')
    .populate('adminDecision.decidedBy', 'name email');
};

/**
 * Admin resolves a dispute (REFUND or REJECT)
 * @param {string|ObjectId} adminId
 * @param {string|ObjectId} disputeId
 * @param {string} decision - 'REFUND' | 'REJECT'
 * @param {string} resolutionNotes
 * @returns {Promise<Dispute>}
 */
const resolveDispute = async (adminId, disputeId, decision, resolutionNotes) => {
  const normalizedDecision = (decision || '').toUpperCase().trim();

  if (!['REFUND', 'REJECT'].includes(normalizedDecision)) {
    const error = new Error('Decision must be either REFUND or REJECT');
    error.status = 400;
    error.code = 'INVALID_DECISION';
    throw error;
  }

  const trimmedNotes = (resolutionNotes || '').trim();
  if (trimmedNotes.length < 10) {
    const error = new Error('Resolution notes must be at least 10 characters long');
    error.status = 400;
    error.code = 'INVALID_RESOLUTION_NOTES';
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(disputeId)) {
    const error = new Error('Invalid dispute ID');
    error.status = 400;
    error.code = 'INVALID_ID';
    throw error;
  }

  // 1. Atomic compare-and-swap lock to prevent duplicate dispute resolutions / race conditions
  const dispute = await Dispute.findOneAndUpdate(
    { _id: disputeId, status: { $in: ['OPEN', 'RECIPIENT_RESPONDED'] } },
    { $set: { status: 'RESOLVING' } },
    { new: true }
  );

  if (!dispute) {
    const existing = await Dispute.findById(disputeId);
    if (!existing) {
      const error = new Error('Dispute not found');
      error.status = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }
    const error = new Error('Dispute has already been resolved or is being processed');
    error.status = 409;
    error.code = 'ALREADY_RESOLVED';
    throw error;
  }

  const transaction = await Transaction.findById(dispute.transactionId);
  if (!transaction) {
    // Revert state
    dispute.status = 'OPEN';
    await dispute.save().catch(() => {});
    const error = new Error('Associated transaction not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const { runInTransaction } = require('../utils/dbTransaction');

  try {
    // 2. Execute refund/rejection inside ACID transaction
    await runInTransaction(async (session) => {
      const saveOptions = session ? { session } : {};

      if (normalizedDecision === 'REFUND') {
        // Atomically debit recipient (if sufficient balance) and credit requester
        await walletService.executeDisputeRefund(
          dispute.requesterId,
          dispute.recipientId,
          dispute.amount,
          session
        );

        transaction.status = 'REFUNDED';
        await transaction.save(saveOptions);

        dispute.status = 'RESOLVED_REFUNDED';
      } else if (normalizedDecision === 'REJECT') {
        dispute.status = 'REJECTED';
        // Transaction remains APPROVED
      }

      dispute.adminDecision = {
        decision: normalizedDecision,
        resolutionNotes: trimmedNotes,
        decidedBy: adminId,
        decidedAt: new Date()
      };

      await dispute.save(saveOptions);
    });

    // Alerts for both parties
    if (normalizedDecision === 'REFUND') {
      await alertService.createAlert(
        dispute.requesterId,
        transaction._id,
        'MEDIUM',
        'Dispute Refund Approved',
        `Your dispute for payment ₹${dispute.amount.toLocaleString('en-IN')} has been approved and refunded to your wallet.`
      );

      await alertService.createAlert(
        dispute.recipientId,
        transaction._id,
        'MEDIUM',
        'Dispute Refund Processed',
        `A refund of ₹${dispute.amount.toLocaleString('en-IN')} has been debited from your wallet following dispute resolution.`
      );

      await auditService.logEvent({
        eventType: 'DISPUTE_REFUND_PROCESSED',
        actorId: adminId,
        actorRole: 'admin',
        targetEntity: { entityType: 'Dispute', entityId: dispute._id },
        metadata: {
          transactionId: transaction._id.toString(),
          amount: dispute.amount,
          requesterId: dispute.requesterId.toString(),
          recipientId: dispute.recipientId.toString(),
          resolutionNotes: trimmedNotes
        }
      });
    } else if (normalizedDecision === 'REJECT') {
      await alertService.createAlert(
        dispute.requesterId,
        transaction._id,
        'MEDIUM',
        'Dispute Claim Rejected',
        `Your dispute claim for payment ₹${dispute.amount.toLocaleString('en-IN')} was rejected after review: ${trimmedNotes}`
      );
    }

    // Audit log admin decision
    await auditService.logEvent({
      eventType: 'DISPUTE_ADMIN_DECISION',
      actorId: adminId,
      actorRole: 'admin',
      targetEntity: { entityType: 'Dispute', entityId: dispute._id },
      metadata: {
        decision: normalizedDecision,
        resolutionNotes: trimmedNotes,
        finalStatus: dispute.status
      }
    });

    return Dispute.findById(dispute._id)
      .populate('transactionId')
      .populate('requesterId', 'name email')
      .populate('recipientId', 'name email')
      .populate('adminDecision.decidedBy', 'name email');
  } catch (err) {
    if (dispute.status === 'RESOLVING') {
      dispute.status = 'OPEN';
      await dispute.save().catch(() => {});
    }
    throw err;
  }
};

module.exports = {
  createDispute,
  getDisputesForUser,
  getDisputeById,
  submitRecipientResponse,
  getAdminDisputes,
  resolveDispute
};
