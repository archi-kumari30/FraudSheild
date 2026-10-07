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
      reason: `Transaction velocity exceeded (${recent10MinTxCount} transactions in last 10 minutes, threshold > 3)`,
      metric: 'Transaction Velocity',
      observedValue: `${recent10MinTxCount} txns in 10 mins`,
      baselineValue: '<= 3 txns in 10 mins',
      deviation: `+${recent10MinTxCount - 3} over limit`,
      severity: 'HIGH'
    };
  }

  return {
    triggered: false,
    ruleCode: 'RULE_VELOCITY_HIGH',
    weight: 0,
    reason: null,
    metric: 'Transaction Velocity',
    observedValue: `${recent10MinTxCount} txns in 10 mins`,
    baselineValue: '<= 3 txns in 10 mins',
    deviation: 'Normal transaction pace',
    severity: 'LOW'
  };
};

module.exports = velocityRule;
