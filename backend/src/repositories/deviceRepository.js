const UserDevice = require('../models/UserDevice');

class DeviceRepository {
  async findOne(userId, deviceId) {
    return UserDevice.findOne({ userId, deviceId });
  }

  async findByUserId(userId) {
    return UserDevice.find({ userId }).sort({ lastSeenAt: -1 });
  }

  async upsertDevice(userId, deviceData) {
    const { deviceId, userAgent, ipAddress } = deviceData;
    return UserDevice.findOneAndUpdate(
      { userId, deviceId },
      {
        $set: {
          userAgent,
          ipAddress,
          isTrusted: true,
          lastSeenAt: new Date()
        },
        $setOnInsert: {
          firstSeenAt: new Date()
        }
      },
      { new: true, upsert: true }
    );
  }
}

module.exports = new DeviceRepository();
