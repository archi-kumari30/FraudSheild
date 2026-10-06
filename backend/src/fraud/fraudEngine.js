const amountRule = require('./rules/amountRule');
const velocityRule = require('./rules/velocityRule');
const deviceRule = require('./rules/deviceRule');
const beneficiaryRule = require('./rules/beneficiaryRule');
const failedAttemptsRule = require('./rules/failedAttemptsRule');
const dormantAccountRule = require('./rules/dormantAccountRule');
const { calculateRiskScore } = require('./riskCalculator');

/**
 * Registry of all six approved deterministic fraud rules
 */
const RULES = [
  amountRule,
  velocityRule,
  deviceRule,
  beneficiaryRule,
  failedAttemptsRule,
  dormantAccountRule
];

/**
 * Evaluate a transaction deterministically against the six rules
 * @param {Object} transactionData - { amount, senderId, recipientId }
 * @param {Object} context - Historical and behavioral telemetry
 * @returns {Object} - Fraud risk assessment breakdown
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

  // Synchronously evaluate all 6 heuristic rules
  const ruleResults = RULES.map((ruleFn) => {
    try {
      return ruleFn(txData, context);
    } catch (error) {
      console.error('[FRAUD ENGINE] Error in rule evaluator:', error.message);
      return { triggered: false, weight: 0, reason: null };
    }
  });

  const scoring = calculateRiskScore(ruleResults);

  return {
    ...scoring,
    evaluatedAt: new Date().toISOString()
  };
};

module.exports = {
  evaluateTransaction,
  RULES
};
