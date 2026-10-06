const walletService = require('../services/walletService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Get authenticated user's wallet
 * GET /api/wallet
 */
const getWallet = async (req, res, next) => {
  try {
    const wallet = await walletService.getWallet(req.user._id);

    return successResponse(res, 200, 'Wallet retrieved successfully', {
      wallet: {
        _id: wallet._id,
        userId: wallet.userId,
        availableBalance: wallet.availableBalance,
        heldBalance: wallet.heldBalance,
        currency: wallet.currency
      },
      availableBalance: wallet.availableBalance,
      heldBalance: wallet.heldBalance,
      currency: wallet.currency
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deposit test funds into wallet
 * POST /api/wallet/deposit
 */
const depositFunds = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return errorResponse(
        res,
        400,
        'Deposit amount must be a positive number',
        'INVALID_AMOUNT'
      );
    }

    const wallet = await walletService.depositFunds(req.user._id, amount);

    return successResponse(res, 200, 'Deposit successful', {
      wallet: {
        _id: wallet._id,
        userId: wallet.userId,
        availableBalance: wallet.availableBalance,
        heldBalance: wallet.heldBalance,
        currency: wallet.currency
      },
      availableBalance: wallet.availableBalance,
      heldBalance: wallet.heldBalance,
      currency: wallet.currency
    });
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

module.exports = {
  getWallet,
  depositFunds
};
