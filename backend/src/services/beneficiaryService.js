const Beneficiary = require('../models/Beneficiary');
const User = require('../models/User');

/**
 * Add a new saved beneficiary to a customer's address book
 * @param {string|ObjectId} userId - Current user ID
 * @param {string} recipientEmail - Email address of recipient
 * @param {string} nickname - Friendly nickname for beneficiary
 * @returns {Promise<Beneficiary>}
 */
const addBeneficiary = async (userId, recipientEmail, nickname) => {
  const normalizedEmail = (recipientEmail || '').toLowerCase().trim();

  // 1. Verify recipient user exists
  const recipientUser = await User.findOne({ email: normalizedEmail });
  if (!recipientUser) {
    const error = new Error('No FraudShield account found with this email. Ask the recipient to create an account first.');
    error.status = 404;
    error.code = 'RECIPIENT_NOT_FOUND';
    throw error;
  }

  // 2. Prevent self-beneficiary
  if (recipientUser._id.toString() === userId.toString()) {
    const error = new Error('Cannot add yourself as a beneficiary');
    error.status = 400;
    error.code = 'SELF_BENEFICIARY_PROHIBITED';
    throw error;
  }

  // 3. Check for duplicates
  const existing = await Beneficiary.findOne({
    userId,
    recipientAccountId: recipientUser._id
  });

  if (existing) {
    const error = new Error('Beneficiary already added');
    error.status = 409;
    error.code = 'BENEFICIARY_EXISTS';
    throw error;
  }

  // 4. Create beneficiary record
  const beneficiary = new Beneficiary({
    userId,
    recipientAccountId: recipientUser._id,
    nickname: (nickname || recipientUser.name).trim(),
    createdAt: new Date()
  });

  await beneficiary.save();
  await beneficiary.populate('recipientAccountId', 'name email role');

  const auditService = require('./auditService');
  await auditService.logEvent({
    eventType: 'BENEFICIARY_ADDED',
    actorId: userId,
    actorRole: 'customer',
    targetEntity: { entityType: 'Beneficiary', entityId: beneficiary._id },
    metadata: {
      recipientAccountId: recipientUser._id.toString(),
      recipientEmail: normalizedEmail,
      nickname: beneficiary.nickname
    }
  });

  return beneficiary;
};

/**
 * Retrieve saved beneficiaries for a user
 * @param {string|ObjectId} userId
 * @returns {Promise<Array<Beneficiary>>}
 */
const getBeneficiaries = async (userId) => {
  return Beneficiary.find({ userId })
    .populate('recipientAccountId', 'name email role')
    .sort({ createdAt: -1 });
};

/**
 * Remove a beneficiary from user's address book
 * @param {string|ObjectId} userId
 * @param {string} beneficiaryId
 * @returns {Promise<Beneficiary>}
 */
const deleteBeneficiary = async (userId, beneficiaryId) => {
  const beneficiary = await Beneficiary.findOneAndDelete({
    _id: beneficiaryId,
    userId
  });

  if (!beneficiary) {
    const error = new Error('Beneficiary not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const auditService = require('./auditService');
  await auditService.logEvent({
    eventType: 'BENEFICIARY_REMOVED',
    actorId: userId,
    actorRole: 'customer',
    targetEntity: { entityType: 'Beneficiary', entityId: beneficiary._id },
    metadata: {
      recipientAccountId: beneficiary.recipientAccountId.toString(),
      nickname: beneficiary.nickname
    }
  });

  return beneficiary;
};

module.exports = {
  addBeneficiary,
  getBeneficiaries,
  deleteBeneficiary
};
