const deviceService = require('../services/deviceService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

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

/**
 * Revoke trust from a registered device
 * POST /api/devices/:deviceId/revoke
 */
const revokeDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';

    const device = await deviceService.revokeDevice(req.user._id, deviceId, ipAddress);

    return successResponse(res, 200, 'Device trust revoked successfully', {
      device
    });
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

/**
 * Update friendly label for a registered device
 * PATCH /api/devices/:deviceId
 */
const updateDeviceLabel = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const label = req.body.label || req.body.customLabel;

    const device = await deviceService.updateDeviceLabel(req.user._id, deviceId, label);

    return successResponse(res, 200, 'Device label updated successfully', {
      device
    });
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

module.exports = {
  getDevices,
  revokeDevice,
  updateDeviceLabel
};
