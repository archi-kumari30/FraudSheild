const aiInvestigationService = require('../services/aiInvestigationService');
const auditService = require('../services/auditService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * On-demand AI analysis of a flagged case
 * POST /api/admin/reviews/:id/ai-analyze
 */
const analyzeTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await aiInvestigationService.analyzeTransaction(id);

    await auditService.logEvent({
      eventType: 'AI_ASSISTANT_ACCESSED',
      actorId: req.user ? req.user._id : null,
      actorRole: req.user ? req.user.role : 'admin',
      targetEntity: { entityType: 'Transaction', entityId: id },
      metadata: { isFallback: result.isFallback || false },
      ipAddress: req.ip || req.connection?.remoteAddress || 'unknown'
    });

    return successResponse(res, 200, 'AI investigation brief generated', {
      aiInvestigation: result,
      isFallback: result.isFallback || false
    });
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

module.exports = {
  analyzeTransaction
};
