const Joi = require('joi');

const depositSchema = Joi.object({
  amount: Joi.number().positive().max(10000000).required().messages({
    'number.base': 'Deposit amount must be a number',
    'number.positive': 'Deposit amount must be greater than 0',
    'number.max': 'Deposit amount exceeds maximum allowable limit of ₹10,000,000',
    'any.required': 'Deposit amount is required'
  })
});

module.exports = {
  depositSchema
};
