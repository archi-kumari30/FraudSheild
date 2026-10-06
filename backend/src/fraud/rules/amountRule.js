/**
 * RULE_AMOUNT_ANOMALY
 * Rule 1: Unusual Transaction Amount
 * Evaluates transaction amount relative to the customer's 30-day settled average.
 *
 * Deterministic thresholds:
 * - Cold-start (no 30-day history): +0 pts ("Insufficient behavioral history")
 * - Normal (amount <= 2 × 30-day average): +0 pts
 * - Elevated (amount > 2 × average AND amount <= 3 × average): +20 pts
 * - Extreme Behavioral Spike (amount > 3 × 30-day average): +35 pts
 *
 * Reason Code: RULE_AMOUNT_ANOMALY
 */
const amountRule = (transactionData, context = {}) => {
  const { amount } = transactionData;
  const historyAvg = Number(context.historyAvg) || 0;

  // Cold-start problem: new account with zero valid 30-day transaction history
  if (historyAvg <= 0) {
    return {
      triggered: false,
      ruleCode: 'RULE_AMOUNT_ANOMALY',
      weight: 0,
      reason: 'Insufficient behavioral history',
      ratio: 0,
      historyAvg: 0
    };
  }

  const ratio = amount / historyAvg;

  // Normal: <= 2x average (+0)
  if (ratio <= 2) {
    return {
      triggered: false,
      ruleCode: 'RULE_AMOUNT_ANOMALY',
      weight: 0,
      reason: `Transaction amount ₹${amount} is within normal behavioral range (${ratio.toFixed(2)}x 30-day average of ₹${historyAvg.toFixed(2)})`,
      ratio: Number(ratio.toFixed(2)),
      historyAvg
    };
  }

  // Elevated: > 2x and <= 3x average (+20)
  if (ratio <= 3) {
    return {
      triggered: true,
      ruleCode: 'RULE_AMOUNT_ANOMALY',
      weight: 20,
      reason: `Elevated transaction amount (${ratio.toFixed(1)}x user's 30-day average of ₹${historyAvg.toFixed(2)})`,
      ratio: Number(ratio.toFixed(2)),
      historyAvg
    };
  }

  // Extreme Behavioral Spike: > 3x average (+35)
  return {
    triggered: true,
    ruleCode: 'RULE_AMOUNT_ANOMALY',
    weight: 35,
    reason: `Extreme behavioral spike (${ratio.toFixed(1)}x user's 30-day average of ₹${historyAvg.toFixed(2)})`,
    ratio: Number(ratio.toFixed(2)),
    historyAvg
  };
};

module.exports = amountRule;
