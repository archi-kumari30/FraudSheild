const Joi = require('joi');

const addBeneficiarySchema = Joi.object({
  recipientEmail: Joi.string().email().optional().messages({
    'string.email': 'Recipient must be a valid email address'
  }),
  recipientAccountId: Joi.string().hex().length(24).optional().messages({
    'string.hex': 'Recipient account ID must be a valid 24-character ID'
  }),
  nickname: Joi.string().trim().min(2).max(50).optional().allow('', null).messages({
    'string.min': 'Nickname must be at least 2 characters long'
  })
}).or('recipientEmail', 'recipientAccountId').messages({
  'object.missing': 'Either recipient email or recipient account ID is required'
});

module.exports = {
  addBeneficiarySchema
};
