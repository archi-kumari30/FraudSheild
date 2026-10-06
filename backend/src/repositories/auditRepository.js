const AuditLog = require('../models/AuditLog');

class AuditRepository {
  async create(data) {
    const log = new AuditLog(data);
    return log.save();
  }

  async find(query = {}, limit = 100, skip = 0) {
    return AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'name email role');
  }

  async countDocuments(query = {}) {
    return AuditLog.countDocuments(query);
  }
}

module.exports = new AuditRepository();
