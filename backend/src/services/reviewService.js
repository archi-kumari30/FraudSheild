const Transaction = require('../models/Transaction');
const walletService = require('./walletService');
const auditService = require('./auditService');
const alertService = require('./alertService');
const { runInTransaction } = require('../utils/dbTransaction');

const SLA_MINUTES = 30;

/**
 * Get all transactions pending analyst review with case management details
 * @returns {Promise<Array<Transaction>>}
 */
const getPendingReviews = async () => {
  return Transaction.find({ status: 'FLAGGED_FOR_REVIEW' })
    .sort({ createdAt: -1 })
    .populate('senderId', 'name email')
    .populate('recipientId', 'name email')
    .populate('assignedAnalyst', 'name email');
};

/**
 * Get detailed case file for a review transaction
 * @param {string|ObjectId} transactionId
 * @returns {Promise<Transaction>}
 */
const getReviewDetails = async (transactionId) => {
  const transaction = await Transaction.findById(transactionId)
    .populate('senderId', 'name email')
    .populate('recipientId', 'name email')
    .populate('assignedAnalyst', 'name email')
    .populate('resolvedBy', 'name email');

  if (!transaction) {
    const error = new Error('Review case not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return transaction;
};

/**
 * Claim an unassigned review case for investigation with atomic compare-and-swap
 * @param {string|ObjectId} transactionId
 * @param {string|ObjectId} adminId
 * @returns {Promise<Transaction>}
 */
const claimCase = async (transactionId, adminId) => {
  const now = new Date();
  const slaDeadline = new Date(now.getTime() + SLA_MINUTES * 60 * 1000);

  const transaction = await Transaction.findOneAndUpdate(
    {
      _id: transactionId,
      status: 'FLAGGED_FOR_REVIEW',
      $or: [{ assignedAnalyst: null }, { caseStatus: 'UNASSIGNED' }]
    },
    {
      $set: {
        caseStatus: 'CLAIMED',
        assignedAnalyst: adminId,
        claimedAt: now,
        slaDeadline
      }
    },
    { new: true }
  )
    .populate('senderId', 'name email')
    .populate('recipientId', 'name email')
    .populate('assignedAnalyst', 'name email');

  if (!transaction) {
    const existing = await Transaction.findById(transactionId);
    if (!existing) {
      const error = new Error('Case not found');
      error.status = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }
    const error = new Error('Case is already claimed by another analyst or is not eligible for claim');
    error.status = 409;
    error.code = 'CASE_ALREADY_CLAIMED';
    throw error;
  }

  await auditService.logEvent({
    eventType: 'ADMIN_REVIEW_CLAIMED',
    actorId: adminId,
    actorRole: 'admin',
    targetEntity: { entityType: 'Transaction', entityId: transaction._id },
    metadata: {
      casePriority: transaction.casePriority,
      claimedAt: now,
      slaDeadline
    }
  });

  return transaction;
};

/**
 * Release a claimed case back to the unassigned queue
 * @param {string|ObjectId} transactionId
 * @param {string|ObjectId} adminId
 * @returns {Promise<Transaction>}
 */
const releaseCase = async (transactionId, adminId) => {
  const transaction = await Transaction.findOneAndUpdate(
    {
      _id: transactionId,
      status: 'FLAGGED_FOR_REVIEW',
      assignedAnalyst: adminId
    },
    {
      $set: {
        caseStatus: 'UNASSIGNED',
        assignedAnalyst: null,
        claimedAt: null,
        slaDeadline: null
      }
    },
    { new: true }
  )
    .populate('senderId', 'name email')
    .populate('recipientId', 'name email');

  if (!transaction) {
    const error = new Error('Cannot release case: you are not the assigned analyst or case is not active');
    error.status = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  return transaction;
};

/**
 * Add an investigative note to a case file
 * @param {string|ObjectId} transactionId
 * @param {string|ObjectId} adminId
 * @param {string} adminName
 * @param {string} note
 * @returns {Promise<Transaction>}
 */
const addCaseNote = async (transactionId, adminId, adminName, note) => {
  const trimmed = (note || '').trim();
  if (trimmed.length < 3) {
    const error = new Error('Investigation note must be at least 3 characters long');
    error.status = 400;
    error.code = 'INVALID_NOTE';
    throw error;
  }

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    const error = new Error('Review case not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  transaction.investigationNotes.push({
    note: trimmed,
    authorId: adminId,
    authorName: adminName || 'Analyst',
    createdAt: new Date()
  });

  if (transaction.caseStatus === 'CLAIMED') {
    transaction.caseStatus = 'UNDER_INVESTIGATION';
  }

  await transaction.save();
  await transaction.populate('senderId', 'name email');
  await transaction.populate('recipientId', 'name email');
  await transaction.populate('assignedAnalyst', 'name email');

  await auditService.logEvent({
    eventType: 'ADMIN_REVIEW_NOTE_ADDED',
    actorId: adminId,
    actorRole: 'admin',
    targetEntity: { entityType: 'Transaction', entityId: transaction._id },
    metadata: {
      notePreview: trimmed.length > 80 ? trimmed.substring(0, 80) + '...' : trimmed
    }
  });

  return transaction;
};

/**
 * Resolve an escrowed review transaction (APPROVE or REJECT)
 * @param {string|ObjectId} transactionId
 * @param {string|ObjectId} adminId
 * @param {string} decision - 'APPROVE' | 'REJECT'
 * @param {string} resolutionNotes
 * @returns {Promise<Transaction>}
 */
const resolveReview = async (transactionId, adminId, decision, resolutionNotes) => {
  const normalizedDecision = (decision || '').toUpperCase().trim();

  if (!['APPROVE', 'REJECT'].includes(normalizedDecision)) {
    const error = new Error('Decision must be either APPROVE or REJECT');
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

  // 1. Atomic compare-and-swap lock to prevent concurrent resolutions
  const transaction = await Transaction.findOneAndUpdate(
    { _id: transactionId, status: 'FLAGGED_FOR_REVIEW' },
    { $set: { status: 'RESOLVING' } },
    { new: true }
  );

  if (!transaction) {
    const existing = await Transaction.findById(transactionId);
    if (!existing) {
      const error = new Error('Transaction not found');
      error.status = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }
    const error = new Error('Transaction has already been resolved or is being processed');
    error.status = 409;
    error.code = 'ALREADY_RESOLVED';
    throw error;
  }

  try {
    // 2. Execute financial settlement/refund and persist transaction update inside ACID transaction
    await runInTransaction(async (session) => {
      const saveOptions = session ? { session } : {};

      if (normalizedDecision === 'APPROVE') {
        await walletService.releaseEscrowAndSettle(
          transaction.senderId,
          transaction.recipientId,
          transaction.amount,
          session
        );
        transaction.status = 'APPROVED';
        transaction.resolutionStatus = 'APPROVED';
        transaction.caseStatus = 'CLOSED';
      } else if (normalizedDecision === 'REJECT') {
        await walletService.refundEscrow(transaction.senderId, transaction.amount, session);
        transaction.status = 'REJECTED';
        transaction.resolutionStatus = 'REJECTED';
        transaction.caseStatus = 'CLOSED';
      }

      transaction.resolutionNotes = trimmedNotes;
      transaction.resolvedBy = adminId;
      transaction.resolvedAt = new Date();

      await transaction.save(saveOptions);
    });

    await transaction.populate('senderId', 'name email');
    await transaction.populate('recipientId', 'name email');
    await transaction.populate('resolvedBy', 'name email');
    await transaction.populate('assignedAnalyst', 'name email');

    // Instrument audit logging (TC-M9-003)
    const eventType = normalizedDecision === 'APPROVE' ? 'ADMIN_REVIEW_APPROVED' : 'ADMIN_REVIEW_REJECTED';
    await auditService.logEvent({
      eventType,
      actorId: adminId,
      actorRole: 'admin',
      targetEntity: { entityType: 'Transaction', entityId: transaction._id },
      metadata: {
        decision: normalizedDecision,
        notes: trimmedNotes,
        amount: transaction.amount,
        riskScore: transaction.riskScore
      }
    });

    // Create user alert on review determination
    if (normalizedDecision === 'APPROVE') {
      await alertService.createAlert(
        transaction.senderId._id || transaction.senderId,
        transaction._id,
        'MEDIUM',
        'Review Decision: Payment Approved',
        `Your transfer of ₹${transaction.amount.toLocaleString('en-IN')} has been approved by Fraud Operations and settled to the recipient.`
      );
    } else {
      await alertService.createAlert(
        transaction.senderId._id || transaction.senderId,
        transaction._id,
        'HIGH',
        'Review Decision: Payment Rejected',
        `Your transfer of ₹${transaction.amount.toLocaleString('en-IN')} was rejected by Fraud Operations. Held escrow funds have been refunded to your available balance.`
      );
    }

    return transaction;
  } catch (err) {
    // Revert state if transaction failed before completion
    if (transaction.status === 'RESOLVING') {
      transaction.status = 'FLAGGED_FOR_REVIEW';
      await transaction.save().catch(() => {});
    }
    throw err;
  }
};

module.exports = {
  getPendingReviews,
  getReviewDetails,
  claimCase,
  releaseCase,
  addCaseNote,
  resolveReview
};
