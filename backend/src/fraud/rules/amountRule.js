/**
 * RULE_AMOUNT_ANOMALY
 * Rule 1: Unusual Transaction Amount
 * Evaluates transaction amount relative to the customer's 30-day settled average
 * with cold-start absolute threshold protection.
 *
 * Deterministic thresholds:
 * - Cold-start <= ₹50,000: +0 pts ("Within unestablished baseline threshold")
 * - Cold-start > ₹50,000: +35 pts ("High-value transfer on unvetted account without baseline")
 * - Established <= 2x average: +0 pts ("Normal behavioral range")
 * - Established > 2x and <= 3x: +20 pts ("Elevated transaction spike")
 * - Established > 3x average: +35 pts ("Extreme behavioral spike")
 *
 * Reason Code: RULE_AMOUNT_ANOMALY
 */
const amountRule = (transactionData, context = {}) => {
  const amount = Number(transactionData?.amount) || 0;
  const historyAvg = Number(context.historyAvg) || 0;

  // 1. Cold-start handling: account with zero valid 30-day transaction history
  if (historyAvg <= 0) {
    if (amount > 50000) {
      return {
        triggered: true,
        ruleCode: 'RULE_AMOUNT_ANOMALY',
        weight: 35,
        reason: `High-value transfer of ₹${amount.toLocaleString('en-IN')} exceeds absolute threshold (₹50,000) on account with no established 30-day baseline`,
        ratio: 0,
        historyAvg: 0,
        metric: 'Amount Anomaly',
        observedValue: `₹${amount.toLocaleString('en-IN')}`,
        baselineValue: '₹50,000 max initial limit',
        deviation: 'Cold-start spike > ₹50,000',
        severity: 'CRITICAL'
      };
    }

    return {
      triggered: false,
      ruleCode: 'RULE_AMOUNT_ANOMALY',
      weight: 0,
      reason: 'Insufficient behavioral history',
      ratio: 0,
      historyAvg: 0,
      metric: 'Amount Anomaly',
      observedValue: `₹${amount.toLocaleString('en-IN')}`,
      baselineValue: 'No 30-day history',
      deviation: 'Within safe initial threshold',
      severity: 'LOW'
    };
  }

  // 2. Behavioral comparison when historical baseline exists
  const ratio = amount / historyAvg;

  if (ratio <= 2) {
    return {
      triggered: false,
      ruleCode: 'RULE_AMOUNT_ANOMALY',
      weight: 0,
      reason: `Transaction amount ₹${amount.toLocaleString('en-IN')} is within normal behavioral range (${ratio.toFixed(2)}x 30-day average of ₹${historyAvg.toFixed(2)})`,
      ratio: Number(ratio.toFixed(2)),
      historyAvg,
      metric: 'Amount vs Baseline',
      observedValue: `₹${amount.toLocaleString('en-IN')}`,
      baselineValue: `₹${historyAvg.toLocaleString('en-IN')} (30-day avg)`,
      deviation: `${ratio.toFixed(1)}x average`,
      severity: 'LOW'
    };
  }

  if (ratio <= 3) {
    return {
      triggered: true,
      ruleCode: 'RULE_AMOUNT_ANOMALY',
      weight: 20,
      reason: `Elevated transaction amount (${ratio.toFixed(1)}x user's 30-day average of ₹${historyAvg.toFixed(2)})`,
      ratio: Number(ratio.toFixed(2)),
      historyAvg,
      metric: 'Amount vs Baseline',
      observedValue: `₹${amount.toLocaleString('en-IN')}`,
      baselineValue: `₹${historyAvg.toLocaleString('en-IN')} (30-day avg)`,
      deviation: `${ratio.toFixed(1)}x baseline`,
      severity: 'HIGH'
    };
  }

  return {
    triggered: true,
    ruleCode: 'RULE_AMOUNT_ANOMALY',
    weight: 35,
    reason: `Extreme behavioral spike (${ratio.toFixed(1)}x user's 30-day average of ₹${historyAvg.toFixed(2)})`,
    ratio: Number(ratio.toFixed(2)),
    historyAvg,
    metric: 'Amount vs Baseline',
    observedValue: `₹${amount.toLocaleString('en-IN')}`,
    baselineValue: `₹${historyAvg.toLocaleString('en-IN')} (30-day avg)`,
    deviation: `${ratio.toFixed(1)}x baseline`,
    severity: 'CRITICAL'
  };
};

module.exports = amountRule;
