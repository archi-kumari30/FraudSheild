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

module.exports = {
  getAuditLogs
};
