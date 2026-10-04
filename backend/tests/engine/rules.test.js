const amtExtremeRule = require('../../src/engine/rules/amtExtremeRule');
const velocityHighRule = require('../../src/engine/rules/velocityHighRule');
const deviceNewRule = require('../../src/engine/rules/deviceNewRule');
const beneficiaryNewRule = require('../../src/engine/rules/beneficiaryNewRule');
const failBurstRule = require('../../src/engine/rules/failBurstRule');
const dormantSpikeRule = require('../../src/engine/rules/dormantSpikeRule');

describe('Module 5: Heuristic Fraud Rules Unit Tests', () => {
  // TC-M5-001: RULE_AMT_EXTREME Triggers on Amount > ₹50,000
  test('TC-M5-001: RULE_AMT_EXTREME triggers when amount > ₹50,000', () => {
    const result = amtExtremeRule({ amount: 50001 }, { historyAvg: 5000 });
    expect(result.triggered).toBe(true);
    expect(result.weight).toBe(35);
    expect(result.ruleCode).toBe('RULE_AMT_EXTREME');
  });

  // TC-M5-002: RULE_AMT_EXTREME Triggers on > 5x Historical Average
  test('TC-M5-002: RULE_AMT_EXTREME triggers when amount > 5x historical average', () => {
    // 12,000 > 5 * 2,000 (10,000)
    const result = amtExtremeRule({ amount: 12000 }, { historyAvg: 2000 });
    expect(result.triggered).toBe(true);
    expect(result.weight).toBe(35);
  });

  // TC-M5-003: RULE_AMT_EXTREME Boundary (Exactly ₹50,000) Does NOT Trigger
  test('TC-M5-003: RULE_AMT_EXTREME does not trigger at boundary of ₹50,000 with high average', () => {
    // 50,000 <= 50,000 and 50,000 <= 5 * 15,000
    const result = amtExtremeRule({ amount: 50000 }, { historyAvg: 15000 });
    expect(result.triggered).toBe(false);
    expect(result.weight).toBe(0);
  });

  // TC-M5-004: RULE_VELOCITY_HIGH Triggers on > 3 Transactions in 10 Minutes
  test('TC-M5-004: RULE_VELOCITY_HIGH triggers on > 3 transactions in 10 minutes', () => {
    const triggered = velocityHighRule({ amount: 1000 }, { recent10MinTxCount: 4 });
    expect(triggered.triggered).toBe(true);
    expect(triggered.weight).toBe(30);
    expect(triggered.ruleCode).toBe('RULE_VELOCITY_HIGH');

    // Boundary: exactly 3 does not trigger
    const notTriggered = velocityHighRule({ amount: 1000 }, { recent10MinTxCount: 3 });
    expect(notTriggered.triggered).toBe(false);
    expect(notTriggered.weight).toBe(0);
  });

  // TC-M5-005: RULE_DEVICE_NEW Triggers on Unrecognized Device
  test('TC-M5-005: RULE_DEVICE_NEW triggers when isKnownDevice is false', () => {
    const triggered = deviceNewRule({ amount: 1000 }, { isKnownDevice: false, deviceId: 'new-macbook' });
    expect(triggered.triggered).toBe(true);
    expect(triggered.weight).toBe(25);
    expect(triggered.ruleCode).toBe('RULE_DEVICE_NEW');

    // Known device does not trigger
    const notTriggered = deviceNewRule({ amount: 1000 }, { isKnownDevice: true });
    expect(notTriggered.triggered).toBe(false);
    expect(notTriggered.weight).toBe(0);
  });

  // TC-M5-006: RULE_BENEFICIARY_NEW Triggers on > ₹10,000 to Beneficiary Added < 24h Ago
  test('TC-M5-006: RULE_BENEFICIARY_NEW triggers on > ₹10,000 to beneficiary added < 24h ago', () => {
    const triggered = beneficiaryNewRule({ amount: 15000 }, { beneficiaryAgeHours: 2 });
    expect(triggered.triggered).toBe(true);
    expect(triggered.weight).toBe(30);
    expect(triggered.ruleCode).toBe('RULE_BENEFICIARY_NEW');

    // Amount <= 10,000 does not trigger even if new
    const smallAmount = beneficiaryNewRule({ amount: 10000 }, { beneficiaryAgeHours: 2 });
    expect(smallAmount.triggered).toBe(false);

    // Old beneficiary (> 24h) does not trigger even if high amount
    const oldBeneficiary = beneficiaryNewRule({ amount: 25000 }, { beneficiaryAgeHours: 25 });
    expect(oldBeneficiary.triggered).toBe(false);
  });

  // TC-M5-007: RULE_FAIL_BURST Triggers on >= 3 Failed Attempts in 15 Minutes
  test('TC-M5-007: RULE_FAIL_BURST triggers on >= 3 failed attempts in 15 minutes', () => {
    const triggered = failBurstRule({ amount: 1000 }, { recentFailedCount: 3 });
    expect(triggered.triggered).toBe(true);
    expect(triggered.weight).toBe(20);
    expect(triggered.ruleCode).toBe('RULE_FAIL_BURST');

    // 2 failed attempts does not trigger
    const notTriggered = failBurstRule({ amount: 1000 }, { recentFailedCount: 2 });
    expect(notTriggered.triggered).toBe(false);
  });

  // TC-M5-008: RULE_DORMANT_SPIKE Triggers on > ₹5,000 After > 30 Days Inactivity
  test('TC-M5-008: RULE_DORMANT_SPIKE triggers on > ₹5,000 after > 30 days inactivity', () => {
    const triggered = dormantSpikeRule({ amount: 6000 }, { daysSinceLastActivity: 45, isDormant: true });
    expect(triggered.triggered).toBe(true);
    expect(triggered.weight).toBe(25);
    expect(triggered.ruleCode).toBe('RULE_DORMANT_SPIKE');

    // Amount <= 5,000 does not trigger
    const smallAmount = dormantSpikeRule({ amount: 5000 }, { daysSinceLastActivity: 45, isDormant: true });
    expect(smallAmount.triggered).toBe(false);

    // Active account (days <= 30) does not trigger
    const activeAccount = dormantSpikeRule({ amount: 10000 }, { daysSinceLastActivity: 5, isDormant: false });
    expect(activeAccount.triggered).toBe(false);
  });
});
