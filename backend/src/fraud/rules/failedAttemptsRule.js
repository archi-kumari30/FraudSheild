/**
 * RULE_FAIL_BURST
 * Rule 5: Failed Attempt Burst
 * Weight: +20
 * Triggers when:
 * - at least 3 failed transaction attempts occur within 15 minutes
 * Reason Code: RULE_FAIL_BURST
 */
const failedAttemptsRule = (transactionData, context = {}) => {
  const recentFailedCount = context.recentFailedCount || 0;

  if (recentFailedCount >= 3) {
    return {
      triggered: true,
      ruleCode: 'RULE_FAIL_BURST',
      weight: 20,
      reason: `Burst of failed transactions detected (${recentFailedCount} failed attempts in last 15 minutes, threshold >= 3)`,
      metric: 'Failed Attempts Burst',
      observedValue: `${recentFailedCount} failed attempts in 15m`,
      baselineValue: '< 3 failed attempts in 15m',
      deviation: 'Rapid failure burst pattern',
      severity: 'MEDIUM'
    };
  }

  return {
    triggered: false,
    ruleCode: 'RULE_FAIL_BURST',
    weight: 0,
    reason: null,
    metric: 'Failed Attempts Burst',
    observedValue: `${recentFailedCount} failed attempts in 15m`,
    baselineValue: '< 3 failed attempts in 15m',
    deviation: 'Normal failure count',
    severity: 'LOW'
  };
};

module.exports = failedAttemptsRule;
