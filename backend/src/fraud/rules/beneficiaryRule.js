/**
 * RULE_BENEFICIARY_NEW
 * Rule 4: New Beneficiary
 * Weight: +30
 * Triggers when:
 * - transaction amount > ₹10,000
 * AND
 * - beneficiary age < 24 hours
 * Reason Code: RULE_BENEFICIARY_NEW
 */
const beneficiaryRule = (transactionData, context = {}) => {
  const { amount } = transactionData;
  const beneficiaryAgeHours = context.beneficiaryAgeHours ?? null;

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

module.exports = beneficiaryRule;
