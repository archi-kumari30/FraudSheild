const Wallet = require('../models/Wallet');

/**
 * Initialize a simulated INR wallet for a user
 * @param {string|ObjectId} userId
 * @returns {Promise<Wallet>}
 */
const createWallet = async (userId) => {
  try {
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({
        userId,
        availableBalance: 10000,
        heldBalance: 0,
        currency: 'INR'
      });
      await wallet.save();
    }
    return wallet;
  } catch (error) {
    if (error.code === 11000) {
      return Wallet.findOne({ userId });
    }
    throw error;
  }
};

/**
 * Retrieve user's wallet
 * @param {string|ObjectId} userId
 * @returns {Promise<Wallet>}
 */
const getWallet = async (userId) => {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await createWallet(userId);
  }
  return wallet;
};

/**
 * Deposit test funds into availableBalance atomically
 * @param {string|ObjectId} userId
 * @param {number} amount
 * @returns {Promise<Wallet>}
 */
const depositFunds = async (userId, amount) => {
  const numericAmount = Number(amount);

  if (isNaN(numericAmount) || numericAmount <= 0) {
    const error = new Error('Deposit amount must be a positive number');
    error.status = 400;
    error.code = 'INVALID_AMOUNT';
    throw error;
  }

  if (numericAmount > 10000000) {
    const error = new Error('Deposit amount exceeds maximum allowable limit of ₹10,000,000');
    error.status = 400;
    error.code = 'AMOUNT_EXCEEDS_LIMIT';
    throw error;
  }

  const roundedAmount = Math.round(numericAmount * 100) / 100;

  const wallet = await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { availableBalance: roundedAmount } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const auditService = require('./auditService');
  await auditService.logEvent({
    eventType: 'WALLET_DEPOSIT_COMPLETED',
    actorId: userId,
    actorRole: 'customer',
    targetEntity: { entityType: 'Wallet', entityId: wallet._id },
    metadata: { amount: roundedAmount, availableBalance: wallet.availableBalance }
  });

  return wallet;
};

/**
 * Execute an approved direct transfer between sender and recipient
 * Supports optional MongoDB session for ACID transaction wrapping
 * @param {string|ObjectId} senderId
 * @param {string|ObjectId} recipientId
 * @param {number} amount
 * @param {ClientSession} [session]
 * @returns {Promise<Object>}
 */
const executeApprovedTransfer = async (senderId, recipientId, amount, session = null) => {
  const roundedAmount = Math.round(Number(amount) * 100) / 100;
  const options = { new: true };
  if (session) options.session = session;

  // Atomically debit sender verifying availableBalance >= roundedAmount
  const senderWallet = await Wallet.findOneAndUpdate(
    { userId: senderId, availableBalance: { $gte: roundedAmount } },
    { $inc: { availableBalance: -roundedAmount } },
    options
  );

  if (!senderWallet) {
    const error = new Error('Insufficient available balance');
    error.status = 400;
    error.code = 'INSUFFICIENT_BALANCE';
    throw error;
  }

  // Atomically credit recipient
  const recipientOptions = { new: true, upsert: true, setDefaultsOnInsert: true };
  if (session) recipientOptions.session = session;

  const recipientWallet = await Wallet.findOneAndUpdate(
    { userId: recipientId },
    { $inc: { availableBalance: roundedAmount } },
    recipientOptions
  );

  return { senderWallet, recipientWallet };
};

/**
 * Execute an escrow hold (reserve funds) for a flagged transaction
 * @param {string|ObjectId} senderId
 * @param {number} amount
 * @param {ClientSession} [session]
 * @returns {Promise<Wallet>}
 */
const executeEscrowHold = async (senderId, amount, session = null) => {
  const roundedAmount = Math.round(Number(amount) * 100) / 100;
  const options = { new: true };
  if (session) options.session = session;

  // Atomically transfer from availableBalance to heldBalance
  const senderWallet = await Wallet.findOneAndUpdate(
    { userId: senderId, availableBalance: { $gte: roundedAmount } },
    { $inc: { availableBalance: -roundedAmount, heldBalance: roundedAmount } },
    options
  );

  if (!senderWallet) {
    const error = new Error('Insufficient available balance');
    error.status = 400;
    error.code = 'INSUFFICIENT_BALANCE';
    throw error;
  }

  return senderWallet;
};

/**
 * Release escrow funds and settle to recipient (analyst approval)
 * @param {string|ObjectId} senderId
 * @param {string|ObjectId} recipientId
 * @param {number} amount
 * @param {ClientSession} [session]
 * @returns {Promise<Object>}
 */
const releaseEscrowAndSettle = async (senderId, recipientId, amount, session = null) => {
  const roundedAmount = Math.round(Number(amount) * 100) / 100;
  const senderOptions = { new: true };
  if (session) senderOptions.session = session;

  const senderWallet = await Wallet.findOneAndUpdate(
    { userId: senderId, heldBalance: { $gte: roundedAmount } },
    { $inc: { heldBalance: -roundedAmount } },
    senderOptions
  );

  if (!senderWallet) {
    const error = new Error('Insufficient held escrow balance');
    error.status = 400;
    error.code = 'INSUFFICIENT_HELD_BALANCE';
    throw error;
  }

  const recipientOptions = { new: true, upsert: true, setDefaultsOnInsert: true };
  if (session) recipientOptions.session = session;

  const recipientWallet = await Wallet.findOneAndUpdate(
    { userId: recipientId },
    { $inc: { availableBalance: roundedAmount } },
    recipientOptions
  );

  return { senderWallet, recipientWallet };
};

/**
 * Release escrow hold and refund back to sender (analyst rejection)
 * @param {string|ObjectId} senderId
 * @param {number} amount
 * @param {ClientSession} [session]
 * @returns {Promise<Wallet>}
 */
const refundEscrow = async (senderId, amount, session = null) => {
  const roundedAmount = Math.round(Number(amount) * 100) / 100;
  const options = { new: true };
  if (session) options.session = session;

  const senderWallet = await Wallet.findOneAndUpdate(
    { userId: senderId, heldBalance: { $gte: roundedAmount } },
    { $inc: { heldBalance: -roundedAmount, availableBalance: roundedAmount } },
    options
  );

  if (!senderWallet) {
    const error = new Error('Insufficient held escrow balance');
    error.status = 400;
    error.code = 'INSUFFICIENT_HELD_BALANCE';
    throw error;
  }

  return senderWallet;
};

/**
 * Execute an approved dispute refund: atomically debit recipient's available balance and credit sender's available balance
 * Enforces that recipient available balance is >= amount (prevents negative balance)
 * @param {string|ObjectId} senderId
 * @param {string|ObjectId} recipientId
 * @param {number} amount
 * @param {ClientSession} [session]
 * @returns {Promise<Object>}
 */
const executeDisputeRefund = async (senderId, recipientId, amount, session = null) => {
  const roundedAmount = Math.round(Number(amount) * 100) / 100;
  const recipientOptions = { new: true };
  if (session) recipientOptions.session = session;

  // 1. Atomically debit recipient ONLY if recipient availableBalance >= roundedAmount
  const recipientWallet = await Wallet.findOneAndUpdate(
    { userId: recipientId, availableBalance: { $gte: roundedAmount } },
    { $inc: { availableBalance: -roundedAmount } },
    recipientOptions
  );

  if (!recipientWallet) {
    const error = new Error('Recipient has insufficient available balance to process refund. Balance cannot drop below zero.');
    error.status = 400;
    error.code = 'INSUFFICIENT_FUNDS_FOR_REFUND';
    throw error;
  }

  // 2. Atomically credit sender
  const senderOptions = { new: true, upsert: true, setDefaultsOnInsert: true };
  if (session) senderOptions.session = session;

  const senderWallet = await Wallet.findOneAndUpdate(
    { userId: senderId },
    { $inc: { availableBalance: roundedAmount } },
    senderOptions
  );

  return { senderWallet, recipientWallet };
};

module.exports = {
  createWallet,
  getWallet,
  depositFunds,
  executeApprovedTransfer,
  executeEscrowHold,
  releaseEscrowAndSettle,
  refundEscrow,
  executeDisputeRefund
};
