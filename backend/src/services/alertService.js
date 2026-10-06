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
 * Retrieve alerts for a specific user (or all alerts if admin)
 * @param {string|ObjectId} userId
 * @param {string} userRole
 * @returns {Promise<Array<Alert>>}
 */
const getUserAlerts = async (userId, userRole = 'customer') => {
  const query = userRole === 'admin' ? {} : { userId };
  return Alert.find(query)
    .sort({ createdAt: -1 })
    .populate('userId', 'name email')
    .populate('transactionId');
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
