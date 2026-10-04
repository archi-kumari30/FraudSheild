/**
 * RULE_FAIL_BURST
 * Weight: +20
 * Triggers if 3 or more failed transaction attempts occurred within the last 15 minutes
 */
const failBurstRule = (transactionData, context = {}) => {
  const recentFailedCount = context.recentFailedCount || 0;

  if (recentFailedCount >= 3) {
    return {
      triggered: true,
      ruleCode: 'RULE_FAIL_BURST',
      weight: 20,
      reason: `Burst of failed transactions detected (${recentFailedCount} failed attempts in last 15 minutes, threshold >= 3)`
    };
  }

  return {
    triggered: false,
    ruleCode: 'RULE_FAIL_BURST',
    weight: 0,
    reason: null
  };
};

module.exports = failBurstRule;
