const Joi = require('joi');

const initiateTransferSchema = Joi.object({
  recipientId: Joi.alternatives()
    .try(
      Joi.string().hex().length(24).messages({
        'string.hex': 'Recipient ID must be a valid account ID',
        'string.length': 'Recipient ID must be a valid 24-character account ID'
      }),
      Joi.string().email().messages({
        'string.email': 'Recipient must be a valid email or account ID'
      })
    )
    .required()
    .messages({
      'any.required': 'Recipient identifier is required'
    }),
  amount: Joi.number().positive().max(1000000).required().messages({
    'number.base': 'Transfer amount must be a number',
    'number.positive': 'Transfer amount must be greater than 0',
    'number.max': 'Transfer amount exceeds maximum per-transaction limit of ₹1,000,000',
    'any.required': 'Transfer amount is required'
  }),
  note: Joi.string().max(200).optional().allow('', null),
  transactionPin: Joi.string().pattern(/^\d{6}$/).optional().messages({
    'string.pattern.base': 'Transaction PIN must be a 6-digit number'
  })
});

const confirmTransactionSchema = Joi.object({
  transactionPin: Joi.string().pattern(/^\d{6}$/).optional().messages({
    'string.pattern.base': 'Transaction PIN must be a 6-digit number'
  })
});

const escalateTransactionSchema = Joi.object({
  reason: Joi.string().max(300).optional().allow('', null)
});

const declineTransactionSchema = Joi.object({
  reason: Joi.string().max(300).optional().allow('', null)
});

module.exports = {
  initiateTransferSchema,
  confirmTransactionSchema,
  escalateTransactionSchema,
  declineTransactionSchema
};

