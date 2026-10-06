const Beneficiary = require('../models/Beneficiary');

class BeneficiaryRepository {
  async findByUserId(userId) {
    return Beneficiary.find({ userId })
      .sort({ createdAt: -1 })
      .populate('recipientAccountId', 'name email');
  }

  async findOne(query) {
    return Beneficiary.findOne(query);
  }

  async findById(id) {
    return Beneficiary.findById(id);
  }

  async create(data) {
    const beneficiary = new Beneficiary(data);
    return beneficiary.save();
  }

  async delete(userId, beneficiaryId) {
    return Beneficiary.findOneAndDelete({ _id: beneficiaryId, userId });
  }
}

module.exports = new BeneficiaryRepository();
