const mongoose = require('mongoose');

const idempotencyRecordSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    requestHash: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'FAILED'],
      default: 'IN_PROGRESS',
      required: true
    },
    responseStatus: {
      type: Number,
      default: null
    },
    responseBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    expiresAt: {
      type: Date,
      required: true,
      // Automatic TTL index cleanup after expiration
      index: { expires: 0 }
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring idempotency key uniqueness per user
idempotencyRecordSchema.index({ userId: 1, key: 1 }, { unique: true });

const IdempotencyRecord = mongoose.model('IdempotencyRecord', idempotencyRecordSchema);

module.exports = IdempotencyRecord;
