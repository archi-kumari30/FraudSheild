const reviewService = require('../services/reviewService');
const timelineService = require('../services/timelineService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Dispute = require('../models/Dispute');

/**
 * List pending cases in review queue
 * GET /api/admin/reviews
 */
const getPendingReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getPendingReviews();

    return successResponse(res, 200, 'Pending reviews retrieved', {
      reviews
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single case file details
 * GET /api/admin/reviews/:id
 */
const getReviewDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await reviewService.getReviewDetails(id);

    return successResponse(res, 200, 'Review case details retrieved', {
      review
    });
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

/**
 * Claim an unassigned review case for investigation
 * POST /api/admin/reviews/:id/claim
 */
const claimCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await reviewService.claimCase(id, req.user._id);

    return successResponse(res, 200, 'Case claimed successfully', {
      transaction
    });
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

/**
 * Release a claimed case back to the unassigned queue
 * POST /api/admin/reviews/:id/release
 */
const releaseCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await reviewService.releaseCase(id, req.user._id);

    return successResponse(res, 200, 'Case released successfully', {
      transaction
    });
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

/**
 * Add investigative note to case file
 * POST /api/admin/reviews/:id/notes
 */
const addCaseNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const transaction = await reviewService.addCaseNote(
      id,
      req.user._id,
      req.user.name,
      note
    );

    return successResponse(res, 200, 'Investigation note recorded', {
      transaction
    });
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

/**
 * Get unified attack-chain forensic timeline for a case
 * GET /api/admin/reviews/:id/timeline
 */
const getCaseTimeline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const timelineData = await timelineService.getTransactionTimeline(id);

    return successResponse(res, 200, 'Investigation attack-chain timeline retrieved', timelineData);
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

/**
 * Submit manual resolution decision
 * POST /api/admin/reviews/:id/resolve
 */
const resolveReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, resolutionNotes } = req.body;

    const resolvedTransaction = await reviewService.resolveReview(
      id,
      req.user._id,
      decision,
      resolutionNotes
    );

    return successResponse(
      res,
      200,
      `Transaction successfully ${resolvedTransaction.status.toLowerCase()}`,
      {
        status: resolvedTransaction.status,
        transaction: resolvedTransaction
      }
    );
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

/**
 * Get summary metrics for admin SOC dashboard
 * GET /api/admin/reviews/stats
 */
const getAdminStats = async (req, res, next) => {
  try {
    const [pendingCount, totalTxCount, approvedTxCount, blockedTxCount, totalAuditCount, totalCustomers, pendingDisputesCount] = await Promise.all([
      Transaction.countDocuments({ status: 'FLAGGED_FOR_REVIEW' }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: 'APPROVED' }),
      Transaction.countDocuments({ status: 'BLOCKED' }),
      AuditLog.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Dispute.countDocuments({ status: { $in: ['OPEN', 'RECIPIENT_RESPONDED'] } })
    ]);

    return successResponse(res, 200, 'Admin statistics retrieved', {
      pendingReviews: pendingCount,
      totalTransactions: totalTxCount,
      approvedTransactions: approvedTxCount,
      blockedTransactions: blockedTxCount,
      totalAuditLogs: totalAuditCount,
      totalCustomers,
      pendingDisputes: pendingDisputesCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingReviews,
  getReviewDetails,
  claimCase,
  releaseCase,
  addCaseNote,
  getCaseTimeline,
  resolveReview,
  getAdminStats
};
