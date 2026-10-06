const Alert = require('../models/Alert');

class AlertRepository {
  async create(data) {
    const alert = new Alert(data);
    return alert.save();
  }

  async findByUserId(userId, limit = 50) {
    return Alert.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('transactionId');
  }

  async findAll(limit = 100) {
    return Alert.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .populate('transactionId');
  }

  async markAsRead(alertId, userId) {
    const query = { _id: alertId };
    if (userId) query.userId = userId;
    return Alert.findOneAndUpdate(query, { isRead: true }, { new: true });
  }
}

module.exports = new AlertRepository();
