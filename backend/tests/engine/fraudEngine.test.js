const { evaluateTransaction } = require('../../src/engine/fraudEngine');
const { getRiskLevel, getRecommendation, calculateFinalScore } = require('../../src/engine/scorer');

describe('Module 5: Fraud Engine Orchestrator and Scorer Tests', () => {
  // TC-M5-009: Score Capping at 100 When Multiple Rules Exceed 100
  test('TC-M5-009: Multi-rule sum exceeding 100 strictly caps at 100', () => {
    // Trigger RULE_AMT_EXTREME (35) + RULE_VELOCITY_HIGH (30) + RULE_BENEFICIARY_NEW (30) + RULE_DEVICE_NEW (25) = 120
    const transaction = { amount: 60000 };
    const context = {
      historyAvg: 5000,
      recent10MinTxCount: 5,
      beneficiaryAgeHours: 1,
      isKnownDevice: false
    };

    const evaluation = evaluateTransaction(transaction, context);

    expect(evaluation.rawScore).toBe(120);
    expect(evaluation.riskScore).toBe(100); // Strictly capped
    expect(evaluation.riskLevel).toBe('HIGH');
    expect(evaluation.recommendation).toBe('BLOCKED');
    expect(evaluation.triggeredRules.length).toBe(4);
  });

  // TC-M5-010: Risk Tier Boundary Categorization (Low, Medium, High)
  test('TC-M5-010: Boundary scores map accurately to LOW, MEDIUM, HIGH', () => {
    // Tier LOW: 0 - 30
    expect(getRiskLevel(0)).toBe('LOW');
    expect(getRecommendation('LOW')).toBe('APPROVED');
    expect(getRiskLevel(30)).toBe('LOW');

    // Tier MEDIUM: 31 - 70
    expect(getRiskLevel(31)).toBe('MEDIUM');
    expect(getRecommendation('MEDIUM')).toBe('FLAGGED_FOR_REVIEW');
    expect(getRiskLevel(50)).toBe('MEDIUM');
    expect(getRiskLevel(70)).toBe('MEDIUM');

    // Tier HIGH: 71 - 100
    expect(getRiskLevel(71)).toBe('HIGH');
    expect(getRecommendation('HIGH')).toBe('BLOCKED');
    expect(getRiskLevel(100)).toBe('HIGH');
  });

  // Zero triggers scenario -> Clean transaction (Score 0, LOW, APPROVED)
  test('Clean transaction with zero rule triggers yields score 0, LOW, APPROVED', () => {
    const transaction = { amount: 2000 };
    const context = {
      historyAvg: 3000,
      recent10MinTxCount: 1,
      beneficiaryAgeHours: 72,
      isKnownDevice: true,
      recentFailedCount: 0,
      isDormant: false
    };

    const evaluation = evaluateTransaction(transaction, context);

    expect(evaluation.riskScore).toBe(0);
    expect(evaluation.riskLevel).toBe('LOW');
    expect(evaluation.recommendation).toBe('APPROVED');
    expect(evaluation.triggeredRules.length).toBe(0);
  });

  // Single rule trigger within MEDIUM tier (e.g. RULE_AMOUNT_ANOMALY = 35)
  test('Single rule trigger resulting in 35 maps to MEDIUM and FLAGGED_FOR_REVIEW', () => {
    const transaction = { amount: 20000 };
    const context = {
      historyAvg: 5000, // 20,000 / 5,000 = 4.0x (> 3x) -> +35 pts
      recent10MinTxCount: 1,
      beneficiaryAgeHours: 72,
      isKnownDevice: true,
      recentFailedCount: 0,
      isDormant: false
    };

    const evaluation = evaluateTransaction(transaction, context);

    expect(evaluation.riskScore).toBe(35);
    expect(evaluation.riskLevel).toBe('MEDIUM');
    expect(evaluation.recommendation).toBe('FLAGGED_FOR_REVIEW');
    expect(evaluation.triggeredRules.length).toBe(1);
    expect(evaluation.triggeredRules[0].ruleCode).toBe('RULE_AMOUNT_ANOMALY');
  });

  // Invalid amount error
  test('Invalid transaction amount throws explicit error', () => {
    expect(() => evaluateTransaction({ amount: -500 })).toThrow('Invalid transaction amount');
    expect(() => evaluateTransaction({ amount: 0 })).toThrow('Invalid transaction amount');
  });
});
