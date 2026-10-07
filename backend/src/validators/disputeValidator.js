const Joi = require('joi');

const createDisputeSchema = Joi.object({
  transactionId: Joi.string().hex().length(24).required().messages({
    'string.empty': 'Transaction ID is required',
    'string.hex': 'Transaction ID must be a valid 24-character ID',
    'string.length': 'Transaction ID must be a valid 24-character ID'
  }),
  reason: Joi.string().trim().min(5).max(500).required().messages({
    'string.empty': 'Dispute reason is required',
    'string.min': 'Dispute reason must be at least 5 characters long',
    'string.max': 'Dispute reason cannot exceed 500 characters'
  })
});

const recipientResponseSchema = Joi.object({
  recognized: Joi.boolean().allow(null).optional(),
  agreesToReturn: Joi.boolean().allow(null).optional(),
  responseNote: Joi.string().trim().max(500).optional().allow('', null).messages({
    'string.max': 'Response note cannot exceed 500 characters'
  })
});

const resolveDisputeSchema = Joi.object({
  decision: Joi.string().valid('REFUND', 'REJECT').insensitive().required().messages({
    'any.only': 'Decision must be either REFUND or REJECT',
    'any.required': 'Decision is required'
  }),
  resolutionNotes: Joi.string().trim().min(10).max(1000).required().messages({
    'string.empty': 'Resolution notes are required',
    'string.min': 'Resolution notes must be at least 10 characters long',
    'string.max': 'Resolution notes cannot exceed 1000 characters'
  })
});

module.exports = {
  createDisputeSchema,
  recipientResponseSchema,
  resolveDisputeSchema
};
