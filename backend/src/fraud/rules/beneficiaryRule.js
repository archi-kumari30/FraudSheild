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
  const amount = Number(transactionData?.amount) || 0;
  const beneficiaryAgeHours = context.beneficiaryAgeHours ?? null;

  if (amount > 10000 && beneficiaryAgeHours !== null && beneficiaryAgeHours < 24) {
    return {
      triggered: true,
      ruleCode: 'RULE_BENEFICIARY_NEW',
      weight: 30,
      reason: `High-value transfer of ₹${amount.toLocaleString('en-IN')} sent to newly added beneficiary (${beneficiaryAgeHours.toFixed(1)} hours old, threshold < 24h)`,
      metric: 'Beneficiary Age & Amount',
      observedValue: `Age: ${beneficiaryAgeHours.toFixed(1)}h, ₹${amount.toLocaleString('en-IN')}`,
      baselineValue: 'Age >= 24h or Amount <= ₹10,000',
      deviation: 'High-value transfer to new recipient',
      severity: 'HIGH'
    };
  }

  const ageText = beneficiaryAgeHours !== null ? `${beneficiaryAgeHours.toFixed(1)}h old` : 'Established/Direct';
  return {
    triggered: false,
    ruleCode: 'RULE_BENEFICIARY_NEW',
    weight: 0,
    reason: null,
    metric: 'Beneficiary Age & Amount',
    observedValue: `Age: ${ageText}`,
    baselineValue: 'Established Beneficiary',
    deviation: 'Safe recipient age/amount',
    severity: 'LOW'
  };
};

module.exports = beneficiaryRule;
