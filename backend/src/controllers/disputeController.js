const disputeService = require('../services/disputeService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Raise a payment dispute
 * POST /api/disputes
 */
const createDispute = async (req, res, next) => {
  try {
    const { transactionId, reason } = req.body;

    if (!transactionId) {
      return errorResponse(res, 400, 'Transaction ID is required', 'MISSING_TRANSACTION_ID');
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return errorResponse(res, 400, 'Dispute reason must be at least 5 characters long', 'INVALID_REASON');
    }

    const dispute = await disputeService.createDispute(req.user._id, transactionId, reason);

    return successResponse(res, 201, 'Payment dispute raised successfully', {
      dispute
    });
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

/**
 * Get disputes for current customer
 * GET /api/disputes
 */
const getUserDisputes = async (req, res, next) => {
  try {
    const { role } = req.query;
    const disputes = await disputeService.getDisputesForUser(req.user._id, role);

    return successResponse(res, 200, 'Disputes retrieved successfully', {
      disputes
    });
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

/**
 * Get dispute details by ID
 * GET /api/disputes/:id
 */
const getDisputeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dispute = await disputeService.getDisputeById(id, req.user._id, req.user.role);

    return successResponse(res, 200, 'Dispute details retrieved', {
      dispute
    });
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

/**
 * Submit recipient response to a dispute
 * POST /api/disputes/:id/recipient-response
 */
const submitRecipientResponse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { recognized, agreesToReturn, responseNote } = req.body;

    if (recognized === undefined || agreesToReturn === undefined) {
      return errorResponse(
        res,
        400,
        'Both recognized and agreesToReturn flags are required',
        'MISSING_RESPONSE_FIELDS'
      );
    }

    const dispute = await disputeService.submitRecipientResponse(req.user._id, id, {
      recognized,
      agreesToReturn,
      responseNote
    });

    return successResponse(res, 200, 'Recipient response recorded successfully', {
      dispute
    });
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

/**
 * Get disputes for admin queue
 * GET /api/admin/disputes
 */
const getAdminDisputes = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const disputes = await disputeService.getAdminDisputes(filter);

    return successResponse(res, 200, 'Admin disputes retrieved successfully', {
      disputes
    });
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

/**
 * Resolve dispute (admin decision)
 * POST /api/admin/disputes/:id/resolve
 */
const resolveDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, resolutionNotes } = req.body;

    if (!decision) {
      return errorResponse(res, 400, 'Decision is required (REFUND or REJECT)', 'MISSING_DECISION');
    }

    if (!resolutionNotes || typeof resolutionNotes !== 'string' || resolutionNotes.trim().length < 10) {
      return errorResponse(res, 400, 'Resolution notes must be at least 10 characters long', 'INVALID_RESOLUTION_NOTES');
    }

    const dispute = await disputeService.resolveDispute(
      req.user._id,
      id,
      decision,
      resolutionNotes
    );

    return successResponse(
      res,
      200,
      `Dispute successfully ${decision === 'REFUND' ? 'refunded' : 'rejected'}`,
      {
        dispute
      }
    );
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

module.exports = {
  createDispute,
  getUserDisputes,
  getDisputeById,
  submitRecipientResponse,
  getAdminDisputes,
  resolveDispute
};
