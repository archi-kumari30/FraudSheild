const mongoose = require('mongoose');
const UserDevice = require('../models/UserDevice');
const auditService = require('./auditService');

/**
 * Check if a device identifier is known and trusted for a specific user
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

    if (!existing) return false;

    // A revoked device is never treated as a known trusted device
    if (existing.isRevoked || existing.isTrusted === false) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('[DEVICE SERVICE] Error checking known device status:', error.message);
    return false;
  }
};

/**
 * Check if a device has been explicitly revoked
 * @param {string|ObjectId} userId
 * @param {string} deviceId
 * @returns {Promise<boolean>}
 */
const isRevokedDevice = async (userId, deviceId) => {
  if (!deviceId || deviceId === 'unspecified-device' || deviceId === 'invalid-device-id') {
    return false;
  }

  try {
    const existing = await UserDevice.findOne({
      userId,
      deviceId,
      isRevoked: true
    });
    return !!existing;
  } catch (error) {
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
    const existing = await UserDevice.findOne({ userId, deviceId: deviceContext.deviceId });

    // If device was previously revoked, do not auto-unrevoke on registration
    if (existing && existing.isRevoked) {
      return existing;
    }

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
          firstSeenAt: now,
          isTrusted: true,
          isRevoked: false,
          deviceLabel: 'Web Browser Device'
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

/**
 * Revoke trust from a device identifier
 * @param {string|ObjectId} userId
 * @param {string} deviceId
 * @param {string} [ipAddress='unknown']
 * @returns {Promise<UserDevice>}
 */
const revokeDevice = async (userId, deviceId, ipAddress = 'unknown') => {
  const query = {
    userId,
    $or: [
      { deviceId: String(deviceId) },
      ...(mongoose.Types.ObjectId.isValid(deviceId) ? [{ _id: new mongoose.Types.ObjectId(String(deviceId)) }] : [])
    ]
  };

  const device = await UserDevice.findOneAndUpdate(
    query,
    {
      $set: {
        isRevoked: true,
        isTrusted: false,
        revokedAt: new Date(),
        revokedByIp: ipAddress
      }
    },
    { new: true }
  );

  if (!device) {
    const error = new Error('Device record not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  await auditService.logEvent({
    eventType: 'DEVICE_REVOKED',
    actorId: userId,
    actorRole: 'customer',
    targetEntity: { entityType: 'UserDevice', entityId: device._id },
    metadata: {
      deviceId: device.deviceId,
      deviceLabel: device.deviceLabel
    },
    ipAddress
  });

  return device;
};

/**
 * Update friendly label for a device
 * @param {string|ObjectId} userId
 * @param {string} deviceId
 * @param {string} label
 * @returns {Promise<UserDevice>}
 */
const updateDeviceLabel = async (userId, deviceId, label) => {
  const trimmed = (label || '').trim();
  if (!trimmed || trimmed.length < 2) {
    const error = new Error('Device label must be at least 2 characters long');
    error.status = 400;
    error.code = 'INVALID_LABEL';
    throw error;
  }

  const query = {
    userId,
    $or: [
      { deviceId: String(deviceId) },
      ...(mongoose.Types.ObjectId.isValid(deviceId) ? [{ _id: new mongoose.Types.ObjectId(String(deviceId)) }] : [])
    ]
  };

  const device = await UserDevice.findOneAndUpdate(
    query,
    { $set: { deviceLabel: trimmed } },
    { new: true }
  );

  if (!device) {
    const error = new Error('Device record not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return device;
};

/**
 * Check if an IP address has previously been used by a specific user
 * @param {string|ObjectId} userId
 * @param {string} ipAddress
 * @returns {Promise<boolean>}
 */
const isKnownIp = async (userId, ipAddress) => {
  if (!ipAddress || ipAddress === 'unknown' || ipAddress === '127.0.0.1' || ipAddress === '::1') {
    return true; // Treat local / standard loopback as non-anomalous
  }

  try {
    const existingDevice = await UserDevice.findOne({
      userId,
      ipAddress,
      isRevoked: false
    });

    if (existingDevice) return true;

    const Transaction = require('../models/Transaction');
    const existingTx = await Transaction.findOne({
      senderId: userId,
      'deviceContext.ipAddress': ipAddress,
      status: { $in: ['APPROVED', 'CUSTOMER_VERIFICATION_REQUIRED'] }
    });

    return !!existingTx;
  } catch (error) {
    console.error('[DEVICE SERVICE] Error checking known IP status:', error.message);
    return false;
  }
};

module.exports = {
  isKnownDevice,
  isRevokedDevice,
  isKnownIp,
  registerDevice,
  getUserDevices,
  revokeDevice,
  updateDeviceLabel
};
