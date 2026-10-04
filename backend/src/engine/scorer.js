/**
 * Scorer and Risk Tier Classifier
 * Enforces finalScore = min(totalScore, 100) and maps 3 tiers:
 * 0 - 30: LOW (APPROVED)
 * 31 - 70: MEDIUM (FLAGGED_FOR_REVIEW)
 * 71 - 100: HIGH (BLOCKED)
 */

/**
 * Determine risk level based on final score
 * @param {number} score
 * @returns {string} - 'LOW' | 'MEDIUM' | 'HIGH'
 */
const getRiskLevel = (score) => {
  if (score <= 30) return 'LOW';
  if (score <= 70) return 'MEDIUM';
  return 'HIGH';
};

/**
 * Determine recommendation action based on risk level
 * @param {string} riskLevel
 * @returns {string} - 'APPROVED' | 'FLAGGED_FOR_REVIEW' | 'BLOCKED'
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
 * Calculate aggregated score and tier classification
 * @param {Array<Object>} triggeredRules - Array of rule evaluation results
 * @returns {Object}
 */
const calculateFinalScore = (triggeredRules = []) => {
  const activeTriggers = triggeredRules.filter((r) => r && r.triggered);

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
  calculateFinalScore
};
