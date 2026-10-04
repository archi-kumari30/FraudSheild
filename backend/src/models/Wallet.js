const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    availableBalance: {
      type: Number,
      required: true,
      default: 10000,
      min: [0, 'Available balance cannot be negative']
    },
    heldBalance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Held balance cannot be negative']
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      enum: ['INR']
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

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
