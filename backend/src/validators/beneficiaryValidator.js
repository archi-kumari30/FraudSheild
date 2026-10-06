const Joi = require('joi');

const addBeneficiarySchema = Joi.object({
  recipientAccountId: Joi.string().hex().length(24).required().messages({
    'string.empty': 'Recipient account ID is required',
    'string.hex': 'Recipient account ID must be a valid ID',
    'string.length': 'Recipient account ID must be a valid ID'
  }),
  nickname: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Beneficiary nickname is required',
    'string.min': 'Nickname must be at least 2 characters long'
  })
});

module.exports = {
  addBeneficiarySchema
};
