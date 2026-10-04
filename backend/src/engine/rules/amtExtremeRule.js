/**
 * RULE_AMT_EXTREME
 * Weight: +35
 * Triggers if amount > ₹50,000 OR amount > 5x user's 30-day historical average
 */
const amtExtremeRule = (transactionData, context = {}) => {
  const { amount } = transactionData;
  const historyAvg = context.historyAvg || 0;

  const isAboveFixedThreshold = amount > 50000;
  const isAboveVelocityMultiplier = historyAvg > 0 && amount > 5 * historyAvg;

  if (isAboveFixedThreshold || isAboveVelocityMultiplier) {
    const detail = isAboveFixedThreshold
      ? `exceeds ₹50,000 extreme cap`
      : `exceeds 5x 30-day average of ₹${historyAvg.toFixed(2)}`;

    return {
      triggered: true,
      ruleCode: 'RULE_AMT_EXTREME',
      weight: 35,
      reason: `Transaction amount ₹${amount} ${detail}`
    };
  }

  return {
    triggered: false,
    ruleCode: 'RULE_AMT_EXTREME',
    weight: 0,
    reason: null
  };
};

module.exports = amtExtremeRule;
