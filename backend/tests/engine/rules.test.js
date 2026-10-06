const amtExtremeRule = require('../../src/engine/rules/amtExtremeRule');
const velocityHighRule = require('../../src/engine/rules/velocityHighRule');
const deviceNewRule = require('../../src/engine/rules/deviceNewRule');
const beneficiaryNewRule = require('../../src/engine/rules/beneficiaryNewRule');
const failBurstRule = require('../../src/engine/rules/failBurstRule');
const dormantSpikeRule = require('../../src/engine/rules/dormantSpikeRule');

describe('Module 5: Heuristic Fraud Rules Unit Tests', () => {
  // TC-M5-001: RULE_AMOUNT_ANOMALY Cold-Start Safe Fallback (+0)
  test('TC-M5-001: RULE_AMOUNT_ANOMALY cold-start safely yields +0 with insufficient history', () => {
    const result = amtExtremeRule({ amount: 50000 }, { historyAvg: 0 });
    expect(result.triggered).toBe(false);
    expect(result.weight).toBe(0);
    expect(result.ruleCode).toBe('RULE_AMOUNT_ANOMALY');
    expect(result.reason).toBe('Insufficient behavioral history');
  });

  // TC-M5-002: RULE_AMOUNT_ANOMALY Normal Range (<= 2x Average) Does NOT Trigger (+0)
  test('TC-M5-002: RULE_AMOUNT_ANOMALY does not trigger for transactions <= 2x average', () => {
    // 4,000 <= 2 * 2,500 (1.6x)
    const result1 = amtExtremeRule({ amount: 4000 }, { historyAvg: 2500 });
    expect(result1.triggered).toBe(false);
    expect(result1.weight).toBe(0);

    // Boundary: exactly 2.0x (5,000 == 2 * 2,500)
    const result2 = amtExtremeRule({ amount: 5000 }, { historyAvg: 2500 });
    expect(result2.triggered).toBe(false);
    expect(result2.weight).toBe(0);

    // High absolute amounts within baseline (₹50k and ₹60k for business account with ₹50k avg)
    const biz50k = amtExtremeRule({ amount: 50000 }, { historyAvg: 50000 });
    expect(biz50k.triggered).toBe(false);
    expect(biz50k.weight).toBe(0);

    const biz60k = amtExtremeRule({ amount: 60000 }, { historyAvg: 50000 });
    expect(biz60k.triggered).toBe(false);
    expect(biz60k.weight).toBe(0);
  });

  // TC-M5-003: RULE_AMOUNT_ANOMALY Elevated Spike (> 2x and <= 3x) Triggers +20
  test('TC-M5-003: RULE_AMOUNT_ANOMALY triggers +20 for > 2x and <= 3x average', () => {
    // 6,250 is 2.5x of 2,500
    const result = amtExtremeRule({ amount: 6250 }, { historyAvg: 2500 });
    expect(result.triggered).toBe(true);
    expect(result.weight).toBe(20);
    expect(result.ruleCode).toBe('RULE_AMOUNT_ANOMALY');

    // Boundary: exactly 3.0x (7,500 == 3 * 2,500) -> +20
    const boundaryResult = amtExtremeRule({ amount: 7500 }, { historyAvg: 2500 });
    expect(boundaryResult.triggered).toBe(true);
    expect(boundaryResult.weight).toBe(20);
  });

  // TC-M5-003B: RULE_AMOUNT_ANOMALY Extreme Spike (> 3x) Triggers +35
  test('TC-M5-003B: RULE_AMOUNT_ANOMALY triggers +35 for > 3x average', () => {
    // 10,000 is 4.0x of 2,500
    const result = amtExtremeRule({ amount: 10000 }, { historyAvg: 2500 });
    expect(result.triggered).toBe(true);
    expect(result.weight).toBe(35);
    expect(result.ruleCode).toBe('RULE_AMOUNT_ANOMALY');
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

  // TC-M5-008: RULE_DORMANT_SPIKE Triggers on Inactivity >= 30 Days and Amount > 2x Avg (or > ₹5,000 fallback)
  test('TC-M5-008: RULE_DORMANT_SPIKE triggers based on 2x historical average and fallback', () => {
    // 1. With historical average: amount > 2x average triggers
    const withHistoryTriggered = dormantSpikeRule(
      { amount: 7000 },
      { daysSinceLastActivity: 45, isDormant: true, historyAvg: 3000 }
    );
    expect(withHistoryTriggered.triggered).toBe(true);
    expect(withHistoryTriggered.weight).toBe(25);
    expect(withHistoryTriggered.ruleCode).toBe('RULE_DORMANT_SPIKE');

    // 2. With historical average: amount <= 2x average does NOT trigger
    const withHistoryNotTriggered = dormantSpikeRule(
      { amount: 5000 },
      { daysSinceLastActivity: 45, isDormant: true, historyAvg: 3000 }
    );
    expect(withHistoryNotTriggered.triggered).toBe(false);

    // 3. Cold start fallback (no history): amount > 5,000 triggers
    const fallbackTriggered = dormantSpikeRule(
      { amount: 6000 },
      { daysSinceLastActivity: 45, isDormant: true, historyAvg: 0 }
    );
    expect(fallbackTriggered.triggered).toBe(true);
    expect(fallbackTriggered.weight).toBe(25);

    // 4. Cold start fallback (no history): amount <= 5,000 does NOT trigger
    const fallbackNotTriggered = dormantSpikeRule(
      { amount: 5000 },
      { daysSinceLastActivity: 45, isDormant: true, historyAvg: 0 }
    );
    expect(fallbackNotTriggered.triggered).toBe(false);

    // 5. Active account (days <= 30) does not trigger
    const activeAccount = dormantSpikeRule(
      { amount: 10000 },
      { daysSinceLastActivity: 5, isDormant: false, historyAvg: 3000 }
    );
    expect(activeAccount.triggered).toBe(false);
  });
});
