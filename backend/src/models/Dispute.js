const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
      unique: true,
      index: true
    },
    requesterId: {
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
      min: [1, 'Dispute amount must be at least ₹1']
    },
    reason: {
      type: String,
      required: [true, 'Dispute reason is required'],
      trim: true,
      minlength: [5, 'Reason must be at least 5 characters'],
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: ['OPEN', 'RECIPIENT_RESPONDED', 'RESOLVED_REFUNDED', 'REJECTED'],
      default: 'OPEN',
      required: true,
      index: true
    },
    recipientResponse: {
      recognized: {
        type: Boolean,
        default: null
      },
      agreesToReturn: {
        type: Boolean,
        default: null
      },
      responseNote: {
        type: String,
        trim: true,
        maxlength: [500, 'Response note cannot exceed 500 characters'],
        default: ''
      },
      respondedAt: {
        type: Date,
        default: null
      }
    },
    adminDecision: {
      decision: {
        type: String,
        enum: ['REFUND', 'REJECT'],
        default: null
      },
      resolutionNotes: {
        type: String,
        trim: true,
        default: ''
      },
      decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      decidedAt: {
        type: Date,
        default: null
      }
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

// Compound indexes for user dispute dashboards
disputeSchema.index({ requesterId: 1, createdAt: -1 });
disputeSchema.index({ recipientId: 1, createdAt: -1 });
disputeSchema.index({ status: 1, createdAt: -1 });

const Dispute = mongoose.model('Dispute', disputeSchema);

module.exports = Dispute;
