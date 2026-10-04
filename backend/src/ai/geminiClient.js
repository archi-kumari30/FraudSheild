const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const { SYSTEM_INSTRUCTION } = require('./promptTemplates');

let genAIInstance = null;

/**
 * Get or initialize Google Generative AI client
 * @returns {GoogleGenerativeAI|null}
 */
const getGeminiClient = () => {
  const apiKey = config.geminiApiKey;

  if (!apiKey || apiKey.startsWith('mock_')) {
    return null;
  }

  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }

  return genAIInstance;
};

/**
 * Get configured model instance
 * @returns {Object|null}
 */
const getInvestigationModel = () => {
  const client = getGeminiClient();
  if (!client) {
    return null;
  }

  return client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  });
};

module.exports = {
  getGeminiClient,
  getInvestigationModel
};
