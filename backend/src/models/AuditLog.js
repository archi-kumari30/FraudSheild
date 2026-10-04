const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      index: true
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    actorRole: {
      type: String,
      enum: ['customer', 'admin', 'system'],
      required: [true, 'Actor role is required']
    },
    targetEntity: {
      entityType: {
        type: String,
        default: null
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      }
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: 'unknown'
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

// Compound indexes for optimal audit trail queries
auditLogSchema.index({ timestamp: -1, eventType: 1 });
auditLogSchema.index({ actorId: 1, timestamp: -1 });

// Immutability defense (EC-M9-002, TC-M9-006)
const immutableError = (next) => {
  const err = new Error('AuditLog records are immutable and cannot be modified or deleted');
  if (typeof next === 'function') {
    return next(err);
  }
  throw err;
};

auditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('AuditLog records are immutable and cannot be modified or deleted'));
  }
  next();
});

auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete', 'findOneAndRemove'], function (next) {
  return immutableError(next);
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
