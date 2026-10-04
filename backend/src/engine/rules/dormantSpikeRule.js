/**
 * RULE_DORMANT_SPIKE
 * Weight: +25
 * Triggers if amount > ₹5,000 from an account with 0 transactions over the prior 30 days
 */
const dormantSpikeRule = (transactionData, context = {}) => {
  const { amount } = transactionData;
  const daysSinceLastActivity = context.daysSinceLastActivity ?? 0;
  const isDormant = context.isDormant ?? (daysSinceLastActivity > 30);

  if (amount > 5000 && isDormant) {
    return {
      triggered: true,
      ruleCode: 'RULE_DORMANT_SPIKE',
      weight: 25,
      reason: `Substantial transfer of ₹${amount} from account dormant for ${daysSinceLastActivity} days (threshold > 30 days)`
    };
  }

  return {
    triggered: false,
    ruleCode: 'RULE_DORMANT_SPIKE',
    weight: 0,
    reason: null
  };
};

module.exports = dormantSpikeRule;
