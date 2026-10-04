const Transaction = require('../models/Transaction');
const { sanitizeContext } = require('../ai/piiSanitizer');
const { buildInvestigationPrompt } = require('../ai/promptTemplates');
const geminiClient = require('../ai/geminiClient');

const TIMEOUT_MS = 5000;

/**
 * Generate fallback advisory brief when Gemini API is offline, timed out, or unconfigured
 * @param {Transaction} transaction
 * @returns {Object}
 */
const generateFallbackBrief = (transaction) => {
  return {
    isFallback: true,
    caseSummary: `Advisory analysis for Transaction ${transaction._id}: The transfer of ₹${transaction.amount} was flagged with risk score ${transaction.riskScore}/100 (${transaction.riskLevel}).`,
    riskPatterns:
      transaction.triggeredRules && transaction.triggeredRules.length > 0
        ? transaction.triggeredRules.map((r) => r.reason)
        : ['Heuristic review indicated risk score threshold trigger.'],
    investigationChecklist: [
      'Contact sender via registered phone number to confirm authorization.',
      'Verify beneficiary relationship and newly added account legitimacy.',
      'Check recent transaction velocity and login device history.'
    ],
    analyzedAt: new Date()
  };
};

/**
 * Perform on-demand AI fraud investigation analysis for an analyst case
 * @param {string|ObjectId} transactionId
 * @returns {Promise<Object>}
 */
const analyzeTransaction = async (transactionId) => {
  const transaction = await Transaction.findById(transactionId)
    .populate('senderId', 'name email')
    .populate('recipientId', 'name email');

  if (!transaction) {
    const error = new Error('Transaction not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  // 1. Return cached AI brief if previously generated successfully
  if (
    transaction.aiInvestigation &&
    transaction.aiInvestigation.caseSummary &&
    !transaction.aiInvestigation.isFallback
  ) {
    return transaction.aiInvestigation;
  }

  // 2. Sanitize all PII before external communication
  const sanitizedContext = sanitizeContext(transaction);

  // 3. Attempt Gemini API execution with 5,000ms timeout
  const model = geminiClient.getInvestigationModel();
  if (!model) {
    // Model unconfigured or in test fallback mode
    const fallback = generateFallbackBrief(transaction);
    return fallback;
  }

  try {
    const prompt = buildInvestigationPrompt(sanitizedContext);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI request timed out after 5000ms')), TIMEOUT_MS);
    });

    const aiCall = model.generateContent(prompt);

    const result = await Promise.race([aiCall, timeoutPromise]);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    const aiReport = {
      caseSummary: parsed.caseSummary || 'Advisory brief generated.',
      riskPatterns: Array.isArray(parsed.riskPatterns) ? parsed.riskPatterns : [],
      investigationChecklist: Array.isArray(parsed.investigationChecklist)
        ? parsed.investigationChecklist
        : [],
      isFallback: false,
      analyzedAt: new Date()
    };

    // Cache report on transaction document without altering transaction status or balances
    transaction.aiInvestigation = aiReport;
    await transaction.save();

    return aiReport;
  } catch (error) {
    console.warn('[AI SERVICE] External Gemini call failed or timed out:', error.message);
    const fallback = generateFallbackBrief(transaction);
    return fallback;
  }
};

module.exports = {
  analyzeTransaction,
  generateFallbackBrief
};
