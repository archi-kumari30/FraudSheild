const auditService = require('../services/auditService');

module.exports = {
  logEvent: auditService.logEvent,
  getAuditLogs: auditService.getAuditLogs,
  sanitizeMetadata: auditService.sanitizeMetadata
};
