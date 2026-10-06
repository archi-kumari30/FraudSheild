/**
 * RULE_VELOCITY_HIGH
 * Rule 2: High Velocity
 * Weight: +30
 * Triggers when:
 * - more than 3 transactions occur within 10 minutes
 * Reason Code: RULE_VELOCITY_HIGH
 */
const velocityRule = (transactionData, context = {}) => {
  const recent10MinTxCount = context.recent10MinTxCount || 0;

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

module.exports = velocityRule;
