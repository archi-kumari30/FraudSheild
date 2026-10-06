const Joi = require('joi');

const initiateTransferSchema = Joi.object({
  recipientId: Joi.string().hex().length(24).required().messages({
    'string.empty': 'Recipient ID is required',
    'string.hex': 'Recipient ID must be a valid ID',
    'string.length': 'Recipient ID must be a valid ID'
  }),
  amount: Joi.number().positive().max(1000000).required().messages({
    'number.base': 'Transfer amount must be a number',
    'number.positive': 'Transfer amount must be greater than 0',
    'number.max': 'Transfer amount exceeds maximum per-transaction limit of ₹1,000,000',
    'any.required': 'Transfer amount is required'
  }),
  note: Joi.string().max(200).optional().allow('', null)
});

module.exports = {
  initiateTransferSchema
};
