const amtExtremeRule = require('./rules/amtExtremeRule');
const velocityHighRule = require('./rules/velocityHighRule');
const deviceNewRule = require('./rules/deviceNewRule');
const beneficiaryNewRule = require('./rules/beneficiaryNewRule');
const failBurstRule = require('./rules/failBurstRule');
const dormantSpikeRule = require('./rules/dormantSpikeRule');
const { calculateFinalScore } = require('./scorer');

/**
 * Registry of all 6 deterministic fraud rules
 */
const RULES = [
  amtExtremeRule,
  velocityHighRule,
  deviceNewRule,
  beneficiaryNewRule,
  failBurstRule,
  dormantSpikeRule
];

/**
 * Synchronous in-memory deterministic fraud evaluation
 * @param {Object} transactionData - { amount, senderId, recipientId }
 * @param {Object} context - Historical and contextual metrics
 * @returns {Object} - Complete fraud score and explainability breakdown
 */
const evaluateTransaction = (transactionData, context = {}) => {
  const numericAmount = Number(transactionData?.amount);

  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Invalid transaction amount for fraud evaluation');
  }

  const txData = {
    ...transactionData,
    amount: numericAmount
  };

  // Concurrently evaluate all 6 heuristic rules
  const ruleResults = RULES.map((ruleFn) => {
    try {
      return ruleFn(txData, context);
    } catch (error) {
      console.error(`[FRAUD ENGINE] Error in rule evaluator:`, error.message);
      return { triggered: false, weight: 0, reason: null };
    }
  });

  const scoring = calculateFinalScore(ruleResults);

  return {
    ...scoring,
    evaluatedAt: new Date().toISOString()
  };
};

module.exports = {
  evaluateTransaction,
  RULES
};
