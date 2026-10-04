const alertService = require('../services/alertService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Get alerts for logged-in user
 * GET /api/alerts
 */
const getAlerts = async (req, res, next) => {
  try {
    const alerts = await alertService.getUserAlerts(req.user._id);

    return successResponse(res, 200, 'Alerts retrieved successfully', {
      alerts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark an alert as read
 * PATCH /api/alerts/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const alert = await alertService.markAsRead(req.user._id, id);

    return successResponse(res, 200, 'Alert marked as read', {
      alert
    });
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

module.exports = {
  getAlerts,
  markAsRead
};
