const deviceService = require('../services/deviceService');
const { successResponse } = require('../utils/apiResponse');

/**
 * List registered devices for authenticated user
 * GET /api/devices
 */
const getDevices = async (req, res, next) => {
  try {
    const devices = await deviceService.getUserDevices(req.user._id);

    return successResponse(res, 200, 'User devices retrieved', {
      devices
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDevices
};
