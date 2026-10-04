const UserDevice = require('../models/UserDevice');

/**
 * Check if a device identifier is known for a specific user
 * @param {string|ObjectId} userId
 * @param {string} deviceId
 * @returns {Promise<boolean>}
 */
const isKnownDevice = async (userId, deviceId) => {
  if (!deviceId || deviceId === 'unspecified-device' || deviceId === 'invalid-device-id') {
    return false;
  }

  try {
    const existing = await UserDevice.findOne({
      userId,
      deviceId
    });

    return !!existing;
  } catch (error) {
    console.error('[DEVICE SERVICE] Error checking known device status:', error.message);
    // Fail safely: treat as unknown/new device on error
    return false;
  }
};

/**
 * Register or update device activity for a user
 * @param {string|ObjectId} userId
 * @param {Object} deviceContext
 * @returns {Promise<UserDevice|null>}
 */
const registerDevice = async (userId, deviceContext) => {
  if (
    !deviceContext ||
    !deviceContext.deviceId ||
    deviceContext.deviceId === 'unspecified-device' ||
    deviceContext.deviceId === 'invalid-device-id'
  ) {
    return null;
  }

  try {
    const now = new Date();
    const device = await UserDevice.findOneAndUpdate(
      {
        userId,
        deviceId: deviceContext.deviceId
      },
      {
        $set: {
          userAgent: deviceContext.userAgent || 'unknown',
          ipAddress: deviceContext.ipAddress || 'unknown',
          lastSeenAt: now
        },
        $setOnInsert: {
          firstSeenAt: now
        }
      },
      {
        new: true,
        upsert: true
      }
    );

    return device;
  } catch (error) {
    console.error('[DEVICE SERVICE] Error registering device:', error.message);
    return null;
  }
};

/**
 * List registered devices for a user
 * @param {string|ObjectId} userId
 * @returns {Promise<Array<UserDevice>>}
 */
const getUserDevices = async (userId) => {
  return UserDevice.find({ userId }).sort({ lastSeenAt: -1 });
};

module.exports = {
  isKnownDevice,
  registerDevice,
  getUserDevices
};
