/**
 * RULE_BENEFICIARY_NEW
 * Weight: +30
 * Triggers if transfer amount > ₹10,000 sent to a beneficiary added less than 24 hours ago
 */
const beneficiaryNewRule = (transactionData, context = {}) => {
  const { amount } = transactionData;
  const beneficiaryAgeHours = context.beneficiaryAgeHours ?? null;

  // Amount > 10,000 AND beneficiary created < 24 hours ago
  if (amount > 10000 && beneficiaryAgeHours !== null && beneficiaryAgeHours < 24) {
    return {
      triggered: true,
      ruleCode: 'RULE_BENEFICIARY_NEW',
      weight: 30,
      reason: `High-value transfer of ₹${amount} sent to newly added beneficiary (${beneficiaryAgeHours.toFixed(1)} hours old, threshold < 24h)`
    };
  }

  return {
    triggered: false,
    ruleCode: 'RULE_BENEFICIARY_NEW',
    weight: 0,
    reason: null
  };
};

module.exports = beneficiaryNewRule;
