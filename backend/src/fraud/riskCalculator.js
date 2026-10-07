/**
 * Risk Calculator and Explainable Risk Attribution Matrix
 *
 * Computes:
 * - rawScore = sum(triggered rule weights)
 * - finalScore = min(rawScore, 100)
 * - attributionWaterfall: structured explainability for each triggered rule
 * - mitigatingSignals: observed healthy telemetry parameters
 *
 * Risk Tiers:
 * 0–30: LOW -> APPROVED
 * 31–70: MEDIUM -> FLAGGED_FOR_REVIEW
 * 71–100: HIGH -> BLOCKED
 */

/**
 * Determine risk level based on final score
 * @param {number} score
 * @returns {'LOW' | 'MEDIUM' | 'HIGH'}
 */
const getRiskLevel = (score) => {
  if (score <= 30) return 'LOW';
  if (score <= 70) return 'MEDIUM';
  return 'HIGH';
};

/**
 * Determine recommendation action based on risk level
 * @param {'LOW' | 'MEDIUM' | 'HIGH'} riskLevel
 * @returns {'APPROVED' | 'FLAGGED_FOR_REVIEW' | 'BLOCKED'}
 */
const getRecommendation = (riskLevel) => {
  switch (riskLevel) {
    case 'LOW':
      return 'APPROVED';
    case 'MEDIUM':
      return 'FLAGGED_FOR_REVIEW';
    case 'HIGH':
      return 'BLOCKED';
    default:
      return 'FLAGGED_FOR_REVIEW';
  }
};

/**
 * Calculate composite risk score, decision tier, and structured explainability waterfall
 * @param {Array<Object>} ruleResults - Array of rule evaluation outputs
 * @returns {Object}
 */
const calculateRiskScore = (ruleResults = []) => {
  const activeTriggers = ruleResults.filter((r) => r && r.triggered);
  const inactiveSignals = ruleResults.filter((r) => r && !r.triggered);

  const rawScore = activeTriggers.reduce((acc, rule) => acc + (rule.weight || 0), 0);
  const finalScore = Math.min(rawScore, 100);

  const riskLevel = getRiskLevel(finalScore);
  const recommendation = getRecommendation(riskLevel);

  // 1. Explainable Risk Attribution Waterfall
  const attributionWaterfall = activeTriggers.map((r) => ({
    ruleCode: r.ruleCode,
    points: r.weight,
    reason: r.reason,
    metric: r.metric || 'Rule Evaluator',
    observedValue: r.observedValue || 'Threshold Triggered',
    baselineValue: r.baselineValue || 'Normal Parameter',
    deviation: r.deviation || 'Exceeded Allowed Limit',
    severity: r.severity || 'HIGH'
  }));

  // 2. Mitigating & Non-Triggered Reassuring Signals
  const mitigatingSignals = inactiveSignals.map((r) => ({
    ruleCode: r.ruleCode,
    metric: r.metric || 'Rule Evaluator',
    observedValue: r.observedValue || 'Within Limits',
    baselineValue: r.baselineValue || 'Normal Parameter',
    status: 'CLEARED'
  }));

  const waterfallSummary = {
    baseScore: 0,
    totalPenalties: rawScore,
    rawScore,
    cappedScore: finalScore,
    riskTier: riskLevel,
    cappedDeduction: Math.max(0, rawScore - 100)
  };

  return {
    rawScore,
    riskScore: finalScore,
    riskLevel,
    recommendation,
    triggeredRules: activeTriggers.map((r) => ({
      ruleCode: r.ruleCode,
      weight: r.weight,
      reason: r.reason
    })),
    attributionWaterfall,
    mitigatingSignals,
    waterfallSummary
  };
};

module.exports = {
  getRiskLevel,
  getRecommendation,
  calculateRiskScore,
  calculateFinalScore: calculateRiskScore
};
