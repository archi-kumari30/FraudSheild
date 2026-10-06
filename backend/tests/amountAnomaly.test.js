const amountRule = require('../src/fraud/rules/amountRule');
const dormantAccountRule = require('../src/fraud/rules/dormantAccountRule');
const { evaluateTransaction } = require('../src/engine/fraudEngine');
const { getRiskLevel, getRecommendation } = require('../src/engine/scorer');

describe('User-Relative Amount Detection Suite (RULE_AMOUNT_ANOMALY)', () => {
  // Scenario 1: Cold start — user with zero valid history
  test('Scenario 1: Cold start (0 average) safely yields +0 pts without division by zero', () => {
    const res = amountRule({ amount: 10000 }, { historyAvg: 0 });
    expect(res.triggered).toBe(false);
    expect(res.weight).toBe(0);
    expect(res.ruleCode).toBe('RULE_AMOUNT_ANOMALY');
    expect(res.reason).toBe('Insufficient behavioral history');
    expect(res.ratio).toBe(0);
  });

  // Scenario 2: Normal ratio <= 2x average
  test('Scenario 2: Amount <= 2x average (e.g. 1.6x) yields +0 pts and triggered: false', () => {
    // 4,000 / 2,500 = 1.6x
    const res = amountRule({ amount: 4000 }, { historyAvg: 2500 });
    expect(res.triggered).toBe(false);
    expect(res.weight).toBe(0);
    expect(res.ratio).toBe(1.6);
  });

  // Scenario 3: Exactly 2.0x boundary
  test('Scenario 3: Exactly 2.0x average (e.g. 5,000 / 2,500) yields +0 pts and triggered: false', () => {
    const res = amountRule({ amount: 5000 }, { historyAvg: 2500 });
    expect(res.triggered).toBe(false);
    expect(res.weight).toBe(0);
    expect(res.ratio).toBe(2);
  });

  // Scenario 4: Elevated spike > 2x and <= 3x
  test('Scenario 4: Amount > 2x and <= 3x average (e.g. 2.5x) triggers +20 pts', () => {
    // 6,250 / 2,500 = 2.5x
    const res = amountRule({ amount: 6250 }, { historyAvg: 2500 });
    expect(res.triggered).toBe(true);
    expect(res.weight).toBe(20);
    expect(res.ruleCode).toBe('RULE_AMOUNT_ANOMALY');
    expect(res.ratio).toBe(2.5);
  });

  // Scenario 5: Exactly 3.0x boundary
  test('Scenario 5: Exactly 3.0x average (e.g. 7,500 / 2,500) triggers +20 pts', () => {
    const res = amountRule({ amount: 7500 }, { historyAvg: 2500 });
    expect(res.triggered).toBe(true);
    expect(res.weight).toBe(20);
    expect(res.ratio).toBe(3);
  });

  // Scenario 6: Extreme spike > 3x
  test('Scenario 6: Amount > 3x average (e.g. 4.0x) triggers +35 pts', () => {
    // 10,000 / 2,500 = 4.0x
    const res = amountRule({ amount: 10000 }, { historyAvg: 2500 });
    expect(res.triggered).toBe(true);
    expect(res.weight).toBe(35);
    expect(res.ruleCode).toBe('RULE_AMOUNT_ANOMALY');
    expect(res.ratio).toBe(4);
  });

  // Scenario 7: Business user ₹50,000 normal payment with ₹50,000 average (1.0x)
  test('Scenario 7: Business user ₹50,000 payment with ₹50,000 baseline (1.0x) yields +0 pts', () => {
    const res = amountRule({ amount: 50000 }, { historyAvg: 50000 });
    expect(res.triggered).toBe(false);
    expect(res.weight).toBe(0);
    expect(res.ratio).toBe(1);
  });

  // Scenario 8: Business user ₹60,000 payment with ₹50,000 average (1.2x <= 2x) -> NO fixed 50k cap!
  test('Scenario 8: Business user ₹60,000 payment with ₹50,000 baseline (1.2x) yields +0 pts, proving no fixed ₹50k cap', () => {
    const res = amountRule({ amount: 60000 }, { historyAvg: 50000 });
    expect(res.triggered).toBe(false);
    expect(res.weight).toBe(0);
    expect(res.ratio).toBe(1.2);
  });

  // Scenario 9: Business user ₹100,000 payment with ₹50,000 average (2.0x <= 2x)
  test('Scenario 9: Business user ₹100,000 payment with ₹50,000 baseline (2.0x) yields +0 pts', () => {
    const res = amountRule({ amount: 100000 }, { historyAvg: 50000 });
    expect(res.triggered).toBe(false);
    expect(res.weight).toBe(0);
    expect(res.ratio).toBe(2);
  });

  // Scenario 10: Business user ₹125,000 payment with ₹50,000 average (2.5x)
  test('Scenario 10: Business user ₹125,000 payment with ₹50,000 baseline (2.5x) triggers +20 pts', () => {
    const res = amountRule({ amount: 125000 }, { historyAvg: 50000 });
    expect(res.triggered).toBe(true);
    expect(res.weight).toBe(20);
    expect(res.ratio).toBe(2.5);
  });

  // Scenario 11: Business user ₹200,000 payment with ₹50,000 average (4.0x > 3x)
  test('Scenario 11: Business user ₹200,000 payment with ₹50,000 baseline (4.0x) triggers +35 pts', () => {
    const res = amountRule({ amount: 200000 }, { historyAvg: 50000 });
    expect(res.triggered).toBe(true);
    expect(res.weight).toBe(35);
    expect(res.ratio).toBe(4);
  });

  // Scenario 12: Multi-rule: 2.5x spike (+20) + New device (+25) = 45 -> MEDIUM (Escrow Review)
  test('Scenario 12: 2.5x spike (+20) + New device (+25) evaluates to Score 45 (MEDIUM, FLAGGED_FOR_REVIEW)', () => {
    const evaluation = evaluateTransaction(
      { amount: 6250 },
      {
        historyAvg: 2500, // 2.5x -> +20
        isKnownDevice: false, // +25
        recent10MinTxCount: 1,
        beneficiaryAgeHours: 72,
        recentFailedCount: 0,
        isDormant: false
      }
    );

    expect(evaluation.riskScore).toBe(45);
    expect(evaluation.riskLevel).toBe('MEDIUM');
    expect(evaluation.recommendation).toBe('FLAGGED_FOR_REVIEW');
    expect(evaluation.triggeredRules.map(r => r.ruleCode)).toEqual(
      expect.arrayContaining(['RULE_AMOUNT_ANOMALY', 'RULE_DEVICE_NEW'])
    );
  });

  // Scenario 13: Multi-rule: 4.0x spike (+35) + New device (+25) = 60 -> MEDIUM (Escrow Review)
  test('Scenario 13: 4.0x spike (+35) + New device (+25) evaluates to Score 60 (MEDIUM, FLAGGED_FOR_REVIEW)', () => {
    const evaluation = evaluateTransaction(
      { amount: 10000 },
      {
        historyAvg: 2500, // 4.0x -> +35
        isKnownDevice: false, // +25
        recent10MinTxCount: 1,
        beneficiaryAgeHours: 72,
        recentFailedCount: 0,
        isDormant: false
      }
    );

    expect(evaluation.riskScore).toBe(60);
    expect(evaluation.riskLevel).toBe('MEDIUM');
    expect(evaluation.recommendation).toBe('FLAGGED_FOR_REVIEW');
    expect(evaluation.triggeredRules.map(r => r.ruleCode)).toEqual(
      expect.arrayContaining(['RULE_AMOUNT_ANOMALY', 'RULE_DEVICE_NEW'])
    );
  });

  // Scenario 14: Multi-rule: 4.0x spike (+35) + New device (+25) + New beneficiary (+30) = 90 -> HIGH (BLOCKED)
  test('Scenario 14: 4.0x spike (+35) + New device (+25) + New beneficiary (+30) evaluates to Score 90 (HIGH, BLOCKED)', () => {
    const evaluation = evaluateTransaction(
      { amount: 10000 },
      {
        historyAvg: 2500, // 4.0x -> +35
        isKnownDevice: false, // +25
        beneficiaryAgeHours: 2, // < 24h & amount > 10000 ? beneficiary rule requires amount > 10,000; let's check with 12,000
        recent10MinTxCount: 1,
        recentFailedCount: 0,
        isDormant: false
      }
    );

    // With amount 12,000:
    const evalHigh = evaluateTransaction(
      { amount: 12000 },
      {
        historyAvg: 2500, // 12,000 / 2,500 = 4.8x (> 3x) -> +35
        isKnownDevice: false, // +25
        beneficiaryAgeHours: 2, // beneficiary age < 24h and amount > 10,000 -> +30
        recent10MinTxCount: 1,
        recentFailedCount: 0,
        isDormant: false
      }
    );

    expect(evalHigh.riskScore).toBe(90);
    expect(evalHigh.riskLevel).toBe('HIGH');
    expect(evalHigh.recommendation).toBe('BLOCKED');
    expect(evalHigh.triggeredRules.map(r => r.ruleCode)).toEqual(
      expect.arrayContaining(['RULE_AMOUNT_ANOMALY', 'RULE_DEVICE_NEW', 'RULE_BENEFICIARY_NEW'])
    );
  });

  // Scenario 15: Dormant account behavioral evaluations
  describe('Scenario 15: Dormant Account Behavioral Thresholds', () => {
    test('Dormant >= 30 days + historical avg ₹3,000 + payment ₹7,000 (> 2x) triggers RULE_DORMANT_SPIKE (+25)', () => {
      const res = dormantAccountRule(
        { amount: 7000 },
        { daysSinceLastActivity: 35, historyAvg: 3000 }
      );
      expect(res.triggered).toBe(true);
      expect(res.weight).toBe(25);
      expect(res.ruleCode).toBe('RULE_DORMANT_SPIKE');
    });

    test('Dormant >= 30 days + historical avg ₹10,000 + payment ₹15,000 (<= 2x) does NOT trigger RULE_DORMANT_SPIKE', () => {
      const res = dormantAccountRule(
        { amount: 15000 },
        { daysSinceLastActivity: 35, historyAvg: 10000 }
      );
      expect(res.triggered).toBe(false);
      expect(res.weight).toBe(0);
    });

    test('Dormant >= 30 days + cold start (no history) + payment ₹6,000 (> ₹5,000) triggers fallback (+25)', () => {
      const res = dormantAccountRule(
        { amount: 6000 },
        { daysSinceLastActivity: 35, historyAvg: 0 }
      );
      expect(res.triggered).toBe(true);
      expect(res.weight).toBe(25);
    });

    test('Dormant >= 30 days + cold start (no history) + payment ₹4,000 (<= ₹5,000) does NOT trigger fallback (+0)', () => {
      const res = dormantAccountRule(
        { amount: 4000 },
        { daysSinceLastActivity: 35, historyAvg: 0 }
      );
      expect(res.triggered).toBe(false);
      expect(res.weight).toBe(0);
    });
  });
});
