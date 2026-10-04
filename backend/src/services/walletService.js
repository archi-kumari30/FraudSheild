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

  // Round to 2 decimal places to avoid floating point precision leaks
  const roundedAmount = Math.round(numericAmount * 100) / 100;

  const wallet = await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { availableBalance: roundedAmount } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return wallet;
};

module.exports = {
  createWallet,
  getWallet,
  depositFunds
};
