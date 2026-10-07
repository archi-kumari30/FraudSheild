const Joi = require('joi');

const depositSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.base': 'Deposit amount must be a number',
    'number.positive': 'Deposit amount must be greater than 0',
    'any.required': 'Deposit amount is required'
  })
});

module.exports = {
  depositSchema
};
