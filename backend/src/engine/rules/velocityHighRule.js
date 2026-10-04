/**
 * RULE_VELOCITY_HIGH
 * Weight: +30
 * Triggers if more than 3 transactions occur within a 10-minute sliding window
 */
const velocityHighRule = (transactionData, context = {}) => {
  const recent10MinTxCount = context.recent10MinTxCount || 0;

  // More than 3 transactions in 10 minutes
  if (recent10MinTxCount > 3) {
    return {
      triggered: true,
      ruleCode: 'RULE_VELOCITY_HIGH',
      weight: 30,
      reason: `Transaction velocity exceeded (${recent10MinTxCount} transactions in last 10 minutes, threshold > 3)`
    };
  }

  return {
    triggered: false,
    ruleCode: 'RULE_VELOCITY_HIGH',
    weight: 0,
    reason: null
  };
};

module.exports = velocityHighRule;
