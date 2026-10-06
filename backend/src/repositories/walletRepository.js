const Wallet = require('../models/Wallet');

class WalletRepository {
  async findByUserId(userId) {
    return Wallet.findOne({ userId });
  }

  async create(walletData) {
    const wallet = new Wallet(walletData);
    return wallet.save();
  }

  async deposit(userId, amount) {
    const rounded = Math.round(Number(amount) * 100) / 100;
    return Wallet.findOneAndUpdate(
      { userId },
      { $inc: { availableBalance: rounded } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  async debitAvailable(userId, amount) {
    const rounded = Math.round(Number(amount) * 100) / 100;
    return Wallet.findOneAndUpdate(
      { userId, availableBalance: { $gte: rounded } },
      { $inc: { availableBalance: -rounded } },
      { new: true }
    );
  }

  async creditAvailable(userId, amount) {
    const rounded = Math.round(Number(amount) * 100) / 100;
    return Wallet.findOneAndUpdate(
      { userId },
      { $inc: { availableBalance: rounded } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  async holdAvailableInEscrow(userId, amount) {
    const rounded = Math.round(Number(amount) * 100) / 100;
    return Wallet.findOneAndUpdate(
      { userId, availableBalance: { $gte: rounded } },
      { $inc: { availableBalance: -rounded, heldBalance: rounded } },
      { new: true }
    );
  }

  async releaseEscrowToRecipient(senderId, recipientId, amount) {
    const rounded = Math.round(Number(amount) * 100) / 100;
    const senderWallet = await Wallet.findOneAndUpdate(
      { userId: senderId, heldBalance: { $gte: rounded } },
      { $inc: { heldBalance: -rounded } },
      { new: true }
    );

    if (!senderWallet) {
      return null;
    }

    const recipientWallet = await Wallet.findOneAndUpdate(
      { userId: recipientId },
      { $inc: { availableBalance: rounded } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return { senderWallet, recipientWallet };
  }

  async refundEscrowToAvailable(userId, amount) {
    const rounded = Math.round(Number(amount) * 100) / 100;
    return Wallet.findOneAndUpdate(
      { userId, heldBalance: { $gte: rounded } },
      { $inc: { heldBalance: -rounded, availableBalance: rounded } },
      { new: true }
    );
  }
}

module.exports = new WalletRepository();
