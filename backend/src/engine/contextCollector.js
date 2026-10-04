const Beneficiary = require('../models/Beneficiary');
const deviceService = require('../services/deviceService');

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
    // 1. Check device recognition
    if (deviceContext.deviceId) {
      context.isKnownDevice = await deviceService.isKnownDevice(userId, deviceContext.deviceId);
    }

    // 2. Check beneficiary creation age
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

    // 3. Historical transaction metrics will be queried from Transaction model when Module 6 is mounted
    // If Transaction model exists in mongoose models:
    const mongoose = require('mongoose');
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

      // Calculate 30-day average amount
      const stats = await Transaction.aggregate([
        {
          $match: {
            senderId: new mongoose.Types.ObjectId(userId.toString()),
            status: 'COMPLETED',
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: null,
            avgAmount: { $avg: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      if (stats.length > 0 && stats[0].count > 0) {
        context.historyAvg = stats[0].avgAmount || 0;
      }

      // Check dormancy: find most recent completed transaction
      const lastTx = await Transaction.findOne({ senderId: userId, status: 'COMPLETED' })
        .sort({ createdAt: -1 });

      if (lastTx) {
        const diffDays = (now.getTime() - new Date(lastTx.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        context.daysSinceLastActivity = Math.max(0, Math.floor(diffDays));
        context.isDormant = context.daysSinceLastActivity > 30;
      } else {
        // If no prior transactions, check user account age
        const User = mongoose.model('User');
        const user = await User.findById(userId);
        if (user && user.createdAt) {
          const accountAgeDays = (now.getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          if (accountAgeDays > 30) {
            context.daysSinceLastActivity = Math.floor(accountAgeDays);
            context.isDormant = true;
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
