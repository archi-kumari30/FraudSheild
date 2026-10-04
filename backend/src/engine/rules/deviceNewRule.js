/**
 * RULE_DEVICE_NEW
 * Weight: +25
 * Triggers if transaction originates from an unrecognized device identifier
 */
const deviceNewRule = (transactionData, context = {}) => {
  const isKnown = context.isKnownDevice ?? context.deviceContext?.isKnownDevice;

  // If device is not known, rule triggers
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

module.exports = deviceNewRule;
