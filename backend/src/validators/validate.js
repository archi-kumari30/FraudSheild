const { errorResponse } = require('../utils/apiResponse');

/**
 * Higher-order middleware to validate requests against Joi schemas
 * @param {Object} schema - Joi schema or { body, query, params } schemas
 */
const validate = (schema) => {
  return (req, res, next) => {
    // If schema is a direct Joi object, validate req.body by default
    const isDirectJoi = schema.isJoi || (schema.validate && !schema.body && !schema.query && !schema.params);

    if (isDirectJoi) {
      const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: false });
      if (error) {
        const errorList = error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message
        }));
        const primaryMessage = error.details[0]?.message || 'Validation error';
        return errorResponse(res, 400, primaryMessage, 'VALIDATION_ERROR', errorList);
      }
      req.body = value;
      return next();
    }

    // Validate segmented schema: { params, query, body }
    const segments = ['params', 'query', 'body'];
    for (const segment of segments) {
      if (schema[segment]) {
        const { error, value } = schema[segment].validate(req[segment], { abortEarly: false, stripUnknown: false });
        if (error) {
          const errorList = error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message
          }));
          const primaryMessage = error.details[0]?.message || 'Validation error';
          return errorResponse(res, 400, primaryMessage, 'VALIDATION_ERROR', errorList);
        }
        req[segment] = value;
      }
    }

    return next();
  };
};

module.exports = validate;
