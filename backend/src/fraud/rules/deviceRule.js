/**
 * RULE_DEVICE_NEW
 * Rule 3: New Device
 * Weight: +25
 * Triggers when:
 * - device identifier is not known or is revoked for the customer
 * Reason Code: RULE_DEVICE_NEW
 */
const deviceRule = (transactionData, context = {}) => {
  const isKnown = context.isKnownDevice ?? context.deviceContext?.isKnownDevice;
  const isRevoked = context.isRevokedDevice ?? context.deviceContext?.isRevokedDevice ?? false;
  const deviceId = context.deviceId || context.deviceContext?.deviceId || 'unknown';

  if (isRevoked) {
    return {
      triggered: true,
      ruleCode: 'RULE_DEVICE_NEW',
      weight: 25,
      reason: `Transaction initiated from revoked device identifier (${deviceId})`,
      metric: 'Device Trust',
      observedValue: `Revoked: ${deviceId}`,
      baselineValue: 'Active Trusted Device',
      deviation: 'Security Revoked Device',
      severity: 'HIGH'
    };
  }

  if (isKnown === false) {
    return {
      triggered: true,
      ruleCode: 'RULE_DEVICE_NEW',
      weight: 25,
      reason: `Transaction initiated from unrecognized or new device (${deviceId})`,
      metric: 'Device Recognition',
      observedValue: `New: ${deviceId}`,
      baselineValue: 'Known Device Registry',
      deviation: 'Unrecognized Device ID',
      severity: 'HIGH'
    };
  }

  return {
    triggered: false,
    ruleCode: 'RULE_DEVICE_NEW',
    weight: 0,
    reason: null,
    metric: 'Device Recognition',
    observedValue: `Verified: ${deviceId}`,
    baselineValue: 'Known Device Registry',
    deviation: 'Recognized Device',
    severity: 'LOW'
  };
};

module.exports = deviceRule;
