const Joi = require('joi');

const resolveReviewSchema = Joi.object({
  decision: Joi.string().valid('APPROVE', 'REJECT').insensitive().required().messages({
    'string.empty': 'Decision is required',
    'any.only': 'Decision must be either APPROVE or REJECT'
  }),
  resolutionNotes: Joi.string().trim().required().messages({
    'string.empty': 'Resolution notes are required',
    'any.required': 'Resolution notes are required'
  })
});

const addCaseNoteSchema = Joi.object({
  note: Joi.string().trim().min(3).max(1000).required().messages({
    'string.empty': 'Investigation note cannot be empty',
    'string.min': 'Investigation note must be at least 3 characters long',
    'string.max': 'Investigation note cannot exceed 1000 characters'
  })
});

module.exports = {
  resolveReviewSchema,
  addCaseNoteSchema
};
