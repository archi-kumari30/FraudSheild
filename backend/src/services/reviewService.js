const Transaction = require('../models/Transaction');
const walletService = require('./walletService');

/**
 * Get all transactions pending analyst review
 * @returns {Promise<Array<Transaction>>}
 */
const getPendingReviews = async () => {
  return Transaction.find({ status: 'FLAGGED_FOR_REVIEW' })
    .sort({ createdAt: -1 })
    .populate('senderId', 'name email')
    .populate('recipientId', 'name email');
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

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    const error = new Error('Transaction not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (transaction.status !== 'FLAGGED_FOR_REVIEW') {
    const error = new Error('Transaction has already been resolved');
    error.status = 409;
    error.code = 'ALREADY_RESOLVED';
    throw error;
  }

  // Settle or refund escrow funds
  if (normalizedDecision === 'APPROVE') {
    await walletService.releaseEscrowAndSettle(
      transaction.senderId,
      transaction.recipientId,
      transaction.amount
    );
    transaction.status = 'APPROVED';
    transaction.resolutionStatus = 'APPROVED';
  } else if (normalizedDecision === 'REJECT') {
    await walletService.refundEscrow(transaction.senderId, transaction.amount);
    transaction.status = 'REJECTED';
    transaction.resolutionStatus = 'REJECTED';
  }

  transaction.resolutionNotes = trimmedNotes;
  transaction.resolvedBy = adminId;
  transaction.resolvedAt = new Date();

  await transaction.save();
  await transaction.populate('senderId', 'name email');
  await transaction.populate('recipientId', 'name email');
  await transaction.populate('resolvedBy', 'name email');

  return transaction;
};

module.exports = {
  getPendingReviews,
  getReviewDetails,
  resolveReview
};
