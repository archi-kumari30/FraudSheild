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
      enum: ['PENDING', 'APPROVED', 'FLAGGED_FOR_REVIEW', 'CUSTOMER_VERIFICATION_REQUIRED', 'BLOCKED', 'REJECTED', 'REFUNDED'],
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
    // Explainable Risk Attribution Waterfall
    attributionWaterfall: [
      {
        ruleCode: { type: String, required: true },
        points: { type: Number, required: true },
        reason: { type: String, required: true },
        metric: { type: String },
        observedValue: { type: String },
        baselineValue: { type: String },
        deviation: { type: String },
        severity: { type: String }
      }
    ],
    mitigatingSignals: [
      {
        ruleCode: { type: String },
        metric: { type: String },
        observedValue: { type: String },
        baselineValue: { type: String },
        status: { type: String }
      }
    ],
    waterfallSummary: {
      baseScore: { type: Number, default: 0 },
      totalPenalties: { type: Number, default: 0 },
      rawScore: { type: Number, default: 0 },
      cappedScore: { type: Number, default: 0 },
      riskTier: { type: String },
      cappedDeduction: { type: Number, default: 0 }
    },
    deviceContext: {
      deviceId: { type: String, default: 'unknown' },
      ipAddress: { type: String, default: 'unknown' },
      userAgent: { type: String, default: 'unknown' },
      isKnownDevice: { type: Boolean, default: false },
      isKnownIp: { type: Boolean, default: false }
    },
    isDisputed: {
      type: Boolean,
      default: false,
      index: true
    },
    disputeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispute',
      default: null
    },
    behaviorContext: {
      historyAvg: { type: Number, default: 0 },
      amountRatio: { type: Number, default: 0 },
      historyCount: { type: Number, default: 0 }
    },
    note: {
      type: String,
      maxlength: [200, 'Note cannot exceed 200 characters'],
      trim: true
    },
    // SOC Case Management Lifecycle
    caseStatus: {
      type: String,
      enum: ['UNASSIGNED', 'CLAIMED', 'UNDER_INVESTIGATION', 'RESOLVED_APPROVED', 'RESOLVED_REJECTED', 'CLOSED'],
      default: 'UNASSIGNED',
      index: true
    },
    assignedAnalyst: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    claimedAt: {
      type: Date,
      default: null
    },
    casePriority: {
      type: String,
      enum: ['P1_CRITICAL', 'P2_HIGH', 'P3_MEDIUM'],
      default: 'P3_MEDIUM',
      index: true
    },
    investigationNotes: [
      {
        note: { type: String, required: true },
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        authorName: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    slaDeadline: {
      type: Date,
      default: null
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
    verificationDetails: {
      verifiedAt: { type: Date },
      verifiedVia: { type: String, default: 'CUSTOMER_CONFIRMATION' },
      ipAddress: { type: String }
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
transactionSchema.index({ status: 1, caseStatus: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
