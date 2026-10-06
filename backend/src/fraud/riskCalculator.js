/**
 * Risk Calculator and Decision Matrix
 * Calculates:
 * finalScore = min(totalRuleScore, 100)
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
 * Calculate composite risk score and tier mapping
 * @param {Array<Object>} ruleResults - Array of rule evaluation outputs
 * @returns {Object}
 */
const calculateRiskScore = (ruleResults = []) => {
  const activeTriggers = ruleResults.filter((r) => r && r.triggered);

  const rawScore = activeTriggers.reduce((acc, rule) => acc + (rule.weight || 0), 0);
  const finalScore = Math.min(rawScore, 100);

  const riskLevel = getRiskLevel(finalScore);
  const recommendation = getRecommendation(riskLevel);

  return {
    rawScore,
    riskScore: finalScore,
    riskLevel,
    recommendation,
    triggeredRules: activeTriggers.map((r) => ({
      ruleCode: r.ruleCode,
      weight: r.weight,
      reason: r.reason
    }))
  };
};

module.exports = {
  getRiskLevel,
  getRecommendation,
  calculateRiskScore,
  calculateFinalScore: calculateRiskScore // alias for compatibility
};
