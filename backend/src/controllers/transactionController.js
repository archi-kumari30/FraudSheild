const transactionService = require('../services/transactionService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Initiate transfer
 * POST /api/transactions
 */
const createTransaction = async (req, res, next) => {
  try {
    const { recipientId, amount, note } = req.body;

    if (!recipientId) {
      return errorResponse(res, 400, 'Recipient ID is required', 'MISSING_RECIPIENT');
    }

    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return errorResponse(res, 400, 'Transfer amount must be a positive number', 'INVALID_AMOUNT');
    }

    const result = await transactionService.initiateTransfer(
      req.user._id,
      recipientId,
      amount,
      note,
      req.deviceContext
    );

    if (result.status === 'APPROVED') {
      return successResponse(res, 200, 'Transaction completed successfully', {
        transaction: result.transaction,
        status: result.status,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel
      });
    }

    if (result.status === 'FLAGGED_FOR_REVIEW') {
      return successResponse(res, 202, 'Transaction held in security escrow pending review', {
        transaction: result.transaction,
        status: result.status,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel
      });
    }

    if (result.status === 'BLOCKED') {
      return errorResponse(
        res,
        400,
        'Transaction blocked due to high fraud risk',
        'TRANSACTION_BLOCKED',
        {
          transaction: result.transaction,
          status: result.status,
          riskScore: result.riskScore,
          riskLevel: result.riskLevel
        }
      );
    }

    return successResponse(res, 200, 'Transaction processed', result);
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

/**
 * Get user transaction history
 * GET /api/transactions
 */
const getTransactions = async (req, res, next) => {
  try {
    const transactions = await transactionService.getUserTransactions(req.user._id);

    return successResponse(res, 200, 'Transactions retrieved successfully', {
      transactions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transaction by ID
 * GET /api/transactions/:id
 */
const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await transactionService.getTransactionById(
      req.user._id,
      id,
      req.user.role
    );

    return successResponse(res, 200, 'Transaction details retrieved', {
      transaction
    });
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById
};
