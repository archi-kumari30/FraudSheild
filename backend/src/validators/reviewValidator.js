const Joi = require('joi');

const resolveReviewSchema = Joi.object({
  decision: Joi.string().valid('APPROVE', 'REJECT').insensitive().required().messages({
    'string.empty': 'Decision is required',
    'any.only': 'Decision must be either APPROVE or REJECT'
  }),
  resolutionNotes: Joi.string().trim().min(10).required().messages({
    'string.empty': 'Resolution notes are required',
    'string.min': 'Resolution notes must be at least 10 characters long'
  })
});

module.exports = {
  resolveReviewSchema
};
