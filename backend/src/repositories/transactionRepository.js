const Transaction = require('../models/Transaction');

class TransactionRepository {
  async create(data) {
    const tx = new Transaction(data);
    return tx.save();
  }

  async findById(id) {
    return Transaction.findById(id)
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email')
      .populate('resolvedBy', 'name email');
  }

  async find(query = {}, sort = { createdAt: -1 }) {
    return Transaction.find(query)
      .sort(sort)
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email');
  }

  async countDocuments(query = {}) {
    return Transaction.countDocuments(query);
  }

  async aggregate(pipeline = []) {
    return Transaction.aggregate(pipeline);
  }

  async findOne(query = {}, sort = {}) {
    return Transaction.findOne(query).sort(sort);
  }

  async updateById(id, updateData) {
    return Transaction.findByIdAndUpdate(id, updateData, { new: true });
  }
}

module.exports = new TransactionRepository();
