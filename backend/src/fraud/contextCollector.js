const Beneficiary = require('../models/Beneficiary');
const deviceService = require('../services/deviceService');
const mongoose = require('mongoose');

/**
 * Collect contextual history for fraud rule evaluation
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} recipientId
 * @param {Object} deviceContext
 * @returns {Promise<Object>}
 */
const collectContext = async (userId, recipientId, deviceContext = {}) => {
  const context = {
    historyAvg: 0,
    recent10MinTxCount: 0,
    recentFailedCount: 0,
    daysSinceLastActivity: 0,
    isDormant: false,
    beneficiaryAgeHours: null,
    isKnownDevice: false,
    deviceId: deviceContext.deviceId || 'unknown'
  };

  try {
    // 1. Device recognition check
    if (deviceContext.deviceId) {
      context.isKnownDevice = await deviceService.isKnownDevice(userId, deviceContext.deviceId);
    }

    // 2. Beneficiary creation age check
    if (recipientId) {
      const beneficiary = await Beneficiary.findOne({
        userId,
        $or: [{ recipientAccountId: recipientId }, { _id: recipientId }]
      });

      if (beneficiary && beneficiary.createdAt) {
        const diffMs = Date.now() - new Date(beneficiary.createdAt).getTime();
        context.beneficiaryAgeHours = Math.max(0, diffMs / (1000 * 60 * 60));
      }
    }

    // 3. Historical transaction metrics
    if (mongoose.models.Transaction) {
      const Transaction = mongoose.model('Transaction');
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Count recent transactions in last 10 mins
      context.recent10MinTxCount = await Transaction.countDocuments({
        senderId: userId,
        createdAt: { $gte: tenMinutesAgo }
      });

      // Count failed transactions in last 15 mins
      context.recentFailedCount = await Transaction.countDocuments({
        senderId: userId,
        status: { $in: ['FAILED', 'BLOCKED'] },
        createdAt: { $gte: fifteenMinutesAgo }
      });

      // Calculate 30-day average amount from settled/approved transactions (exclude BLOCKED, REJECTED, FAILED)
      const validTxs = await Transaction.find({
        senderId: userId,
        status: { $in: ['APPROVED', 'COMPLETED'] },
        createdAt: { $gte: thirtyDaysAgo }
      }).select('amount');

      if (validTxs && validTxs.length > 0) {
        const sum = validTxs.reduce((acc, tx) => acc + (tx.amount || 0), 0);
        context.historyCount = validTxs.length;
        context.historyAvg = Number((sum / validTxs.length).toFixed(2));
      } else {
        context.historyCount = 0;
        context.historyAvg = 0;
      }

      // Check dormancy: find most recent approved/completed transaction
      const lastTx = await Transaction.findOne({
        senderId: userId,
        status: { $in: ['APPROVED', 'COMPLETED'] }
      }).sort({ createdAt: -1 });

      if (lastTx) {
        const diffDays = (now.getTime() - new Date(lastTx.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        context.daysSinceLastActivity = Math.max(0, Math.floor(diffDays));
        context.isDormant = context.daysSinceLastActivity >= 30;
      } else {
        // If no prior transactions, check account age
        if (mongoose.models.User) {
          const User = mongoose.model('User');
          const user = await User.findById(userId);
          if (user && user.createdAt) {
            const accountAgeDays = (now.getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            if (accountAgeDays >= 30) {
              context.daysSinceLastActivity = Math.floor(accountAgeDays);
              context.isDormant = true;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[CONTEXT COLLECTOR] Error collecting history context:', error.message);
  }

  return context;
};

module.exports = {
  collectContext
};
