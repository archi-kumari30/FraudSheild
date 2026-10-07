const auditService = require('../services/auditService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Retrieve paginated audit logs for admin review
 * GET /api/admin/audit-logs
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const data = await auditService.getAuditLogs(req.query);

    return successResponse(res, 200, 'Audit logs retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify cryptographic hash-chain integrity of the audit ledger
 * GET /api/admin/audit-logs/verify
 */
const verifyIntegrity = async (req, res, next) => {
  try {
    const report = await auditService.verifyAuditIntegrity();

    return successResponse(res, 200, 'Audit ledger integrity check completed', report);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
  verifyIntegrity
};
