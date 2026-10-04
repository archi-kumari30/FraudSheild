const mongoose = require('mongoose');

const userDeviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    deviceId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    userAgent: {
      type: String,
      default: 'unknown'
    },
    ipAddress: {
      type: String,
      default: 'unknown'
    },
    firstSeenAt: {
      type: Date,
      default: Date.now
    },
    lastSeenAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound unique index ensuring unique device tracking per user
userDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

const UserDevice = mongoose.model('UserDevice', userDeviceSchema);

module.exports = UserDevice;
