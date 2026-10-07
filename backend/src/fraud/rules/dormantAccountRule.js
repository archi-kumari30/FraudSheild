/**
 * RULE_DORMANT_SPIKE
 * Rule 6: Dormant Account Spike
 * Weight: +25
 * Triggers when:
 * - no transaction for at least 30 days
 * AND
 * - current transaction amount > 2 × user's historical average (when historical data exists)
 *   OR current transaction amount > ₹5,000 (safe fallback when no historical average exists)
 * Reason Code: RULE_DORMANT_SPIKE
 */
const dormantAccountRule = (transactionData, context = {}) => {
  const amount = Number(transactionData?.amount) || 0;
  const daysSinceLastActivity = context.daysSinceLastActivity ?? 0;
  const isDormant = context.isDormant ?? (daysSinceLastActivity >= 30);
  const historyAvg = Number(context.historyAvg) || 0;

  // Use behavioral baseline (> 2x historical average) when history exists; safe fallback (> ₹5,000) when no history
  const isLargeTransaction = historyAvg > 0 ? (amount > 2 * historyAvg) : (amount > 5000);

  if (isDormant && isLargeTransaction) {
    const detail = historyAvg > 0
      ? `exceeds 2x historical average of ₹${historyAvg.toFixed(2)}`
      : `exceeds baseline threshold ₹5,000`;

    return {
      triggered: true,
      ruleCode: 'RULE_DORMANT_SPIKE',
      weight: 25,
      reason: `Transfer of ₹${amount.toLocaleString('en-IN')} (${detail}) from account dormant for ${daysSinceLastActivity} days (threshold >= 30 days)`,
      metric: 'Account Dormancy & Spike',
      observedValue: `${daysSinceLastActivity} days dormant, ₹${amount.toLocaleString('en-IN')}`,
      baselineValue: '< 30 days dormant or amount within baseline',
      deviation: 'Sudden reactivation with large transfer',
      severity: 'HIGH'
    };
  }

  return {
    triggered: false,
    ruleCode: 'RULE_DORMANT_SPIKE',
    weight: 0,
    reason: null,
    metric: 'Account Dormancy',
    observedValue: isDormant ? `${daysSinceLastActivity} days dormant (small transfer)` : 'Active account',
    baselineValue: '< 30 days inactivity',
    deviation: 'Normal account activity',
    severity: 'LOW'
  };
};

module.exports = dormantAccountRule;
