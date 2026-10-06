/**
 * Higher-order middleware to validate requests against Joi schemas
 * @param {Object} schema - Joi schema or { body, query, params } schemas
 */
const validate = (schema) => {
  return (req, res, next) => {
    // If schema is a Joi object directly, default to validating req.body
    const isDirectJoi = schema.isJoi || (schema.validate && !schema.body && !schema.query && !schema.params);

    if (isDirectJoi) {
      const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: false });
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details.map((d) => d.message).join(', '),
          errors: error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message
          }))
        });
      }
      req.body = value;
      return next();
    }

    // Validate segments if provided: body, params, query
    const segments = ['params', 'query', 'body'];
    for (const segment of segments) {
      if (schema[segment]) {
        const { error, value } = schema[segment].validate(req[segment], { abortEarly: false, stripUnknown: false });
        if (error) {
          return res.status(400).json({
            success: false,
            message: error.details.map((d) => d.message).join(', '),
            errors: error.details.map((d) => ({
              field: d.path.join('.'),
              message: d.message
            }))
          });
        }
        req[segment] = value;
      }
    }

    return next();
  };
};

module.exports = validate;
