const aiInvestigationService = require('../services/aiInvestigationService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * On-demand AI analysis of a flagged case
 * POST /api/admin/reviews/:id/ai-analyze
 */
const analyzeTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await aiInvestigationService.analyzeTransaction(id);

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
