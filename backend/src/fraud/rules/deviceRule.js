/**
 * RULE_DEVICE_NEW
 * Rule 3: New Device
 * Weight: +25
 * Triggers when:
 * - device identifier is not known for the customer
 * Reason Code: RULE_DEVICE_NEW
 */
const deviceRule = (transactionData, context = {}) => {
  const isKnown = context.isKnownDevice ?? context.deviceContext?.isKnownDevice;

  if (isKnown === false) {
    const deviceId = context.deviceId || context.deviceContext?.deviceId || 'unknown';
    return {
      triggered: true,
      ruleCode: 'RULE_DEVICE_NEW',
      weight: 25,
      reason: `Transaction initiated from unrecognized or new device (${deviceId})`
    };
  }

  return {
    triggered: false,
    ruleCode: 'RULE_DEVICE_NEW',
    weight: 0,
    reason: null
  };
};

module.exports = deviceRule;
