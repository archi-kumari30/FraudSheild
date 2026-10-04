const Alert = require('../models/Alert');

/**
 * Create a new fraud security alert for a user
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} transactionId
 * @param {string} severity - 'MEDIUM' | 'HIGH'
 * @param {string} title
 * @param {string} message
 * @returns {Promise<Alert>}
 */
const createAlert = async (userId, transactionId, severity, title, message) => {
  const alert = new Alert({
    userId,
    transactionId,
    severity,
    title,
    message,
    isRead: false,
    createdAt: new Date()
  });

  await alert.save();
  return alert;
};

/**
 * Retrieve alerts for a specific user
 * @param {string|ObjectId} userId
 * @returns {Promise<Array<Alert>>}
 */
const getUserAlerts = async (userId) => {
  return Alert.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Mark a user alert as read
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} alertId
 * @returns {Promise<Alert>}
 */
const markAsRead = async (userId, alertId) => {
  const alert = await Alert.findOneAndUpdate(
    { _id: alertId, userId },
    { $set: { isRead: true } },
    { new: true }
  );

  if (!alert) {
    const error = new Error('Alert not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return alert;
};

module.exports = {
  createAlert,
  getUserAlerts,
  markAsRead
};
