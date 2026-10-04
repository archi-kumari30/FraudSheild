const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Transaction amount must be at least ₹1']
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      enum: ['INR']
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'FLAGGED_FOR_REVIEW', 'BLOCKED', 'REJECTED'],
      default: 'PENDING',
      required: true,
      index: true
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      required: true
    },
    triggeredRules: [
      {
        ruleCode: { type: String, required: true },
        weight: { type: Number, required: true },
        reason: { type: String, required: true }
      }
    ],
    deviceContext: {
      deviceId: { type: String, default: 'unknown' },
      ipAddress: { type: String, default: 'unknown' },
      userAgent: { type: String, default: 'unknown' }
    },
    note: {
      type: String,
      maxlength: [200, 'Note cannot exceed 200 characters'],
      trim: true
    },
    resolutionStatus: {
      type: String,
      enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED'],
      default: 'PENDING_REVIEW'
    },
    resolutionNotes: {
      type: String,
      trim: true
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: {
      type: Date
    },
    aiInvestigation: {
      caseSummary: { type: String },
      riskPatterns: [{ type: String }],
      investigationChecklist: [{ type: String }],
      isFallback: { type: Boolean, default: false },
      analyzedAt: { type: Date }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound indexes for performant historical timeline queries
transactionSchema.index({ senderId: 1, createdAt: -1 });
transactionSchema.index({ recipientId: 1, createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
