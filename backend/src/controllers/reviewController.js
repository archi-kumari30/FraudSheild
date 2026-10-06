const reviewService = require('../services/reviewService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

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

const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

/**
 * Get summary metrics for admin SOC dashboard
 * GET /api/admin/reviews/stats
 */
const getAdminStats = async (req, res, next) => {
  try {
    const [pendingCount, totalTxCount, approvedTxCount, blockedTxCount, totalAuditCount, totalCustomers] = await Promise.all([
      Transaction.countDocuments({ status: 'FLAGGED_FOR_REVIEW' }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: 'APPROVED' }),
      Transaction.countDocuments({ status: 'BLOCKED' }),
      AuditLog.countDocuments(),
      User.countDocuments({ role: 'customer' })
    ]);

    return successResponse(res, 200, 'Admin statistics retrieved', {
      pendingReviews: pendingCount,
      totalTransactions: totalTxCount,
      approvedTransactions: approvedTxCount,
      blockedTransactions: blockedTxCount,
      totalAuditLogs: totalAuditCount,
      totalCustomers
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingReviews,
  getReviewDetails,
  resolveReview,
  getAdminStats
};
