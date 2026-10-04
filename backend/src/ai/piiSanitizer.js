/**
 * PII Sanitizer & Data Minimization Filter for Gemini AI
 * Asserts that zero raw passwords, email addresses, real customer names, or full account numbers reach the LLM.
 */

/**
 * Mask account / object ID to generic synthetic representation
 * @param {string|ObjectId} id
 * @returns {string} - e.g. ACC-***9821
 */
const maskAccountId = (id) => {
  if (!id) return 'ACC-***0000';
  const str = id.toString();
  return `ACC-***${str.slice(-4)}`;
};

/**
 * Sanitize transaction data into an anonymized analytical context
 * @param {Object} transaction - Populated transaction document
 * @param {Object} additionalContext - Extra historical metadata
 * @returns {Object} - Anonymized context safe for external dispatch
 */
const sanitizeContext = (transaction, additionalContext = {}) => {
  const senderMaskedId = maskAccountId(transaction.senderId?._id || transaction.senderId);
  const recipientMaskedId = maskAccountId(transaction.recipientId?._id || transaction.recipientId);

  // Extract purely analytical features
  const sanitized = {
    senderAlias: 'Customer_Sender',
    senderAccountId: senderMaskedId,
    recipientAlias: 'Recipient_Beneficiary',
    recipientAccountId: recipientMaskedId,
    amountINR: transaction.amount,
    currency: transaction.currency || 'INR',
    riskScore: transaction.riskScore,
    riskLevel: transaction.riskLevel,
    triggeredRules: (transaction.triggeredRules || []).map((r) => ({
      ruleCode: r.ruleCode,
      weight: r.weight,
      reason: r.reason
    })),
    contextualIndicators: {
      daysSinceLastActivity: additionalContext.daysSinceLastActivity || null,
      historyAvgINR: additionalContext.historyAvg || null,
      recentVelocityCount: additionalContext.recent10MinTxCount || null,
      beneficiaryAgeHours: additionalContext.beneficiaryAgeHours || null,
      deviceStatus: transaction.deviceContext?.deviceId ? 'Supplied' : 'Unspecified'
    }
  };

  return sanitized;
};

/**
 * Audit helper verifying that a string contains none of the prohibited sensitive strings
 * @param {string} payloadString
 * @param {Array<string>} sensitiveValues - Raw emails, names, passwords, IPs
 * @returns {boolean} - true if completely clean
 */
const assertZeroPii = (payloadString, sensitiveValues = []) => {
  for (const sensitive of sensitiveValues) {
    if (sensitive && typeof sensitive === 'string' && sensitive.trim().length > 3) {
      if (payloadString.toLowerCase().includes(sensitive.toLowerCase())) {
        return false;
      }
    }
  }
  return true;
};

module.exports = {
  maskAccountId,
  sanitizeContext,
  assertZeroPii
};
