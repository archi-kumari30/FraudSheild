const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Full name is required',
    'string.min': 'Name must be at least 2 characters long'
  }),
  email: Joi.string().email().trim().lowercase().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address'
  }),
  phone: Joi.string().trim().pattern(/^[0-9+() -]{7,20}$/).optional().allow('', null).messages({
    'string.pattern.base': 'Please provide a valid phone number'
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters long'
  }),
  role: Joi.string().valid('customer', 'admin').default('customer')
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address'
  })
});

const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).max(128).required().messages({
    'string.empty': 'New password is required',
    'string.min': 'Password must be at least 8 characters long'
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
