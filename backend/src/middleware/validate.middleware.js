/**
 * Request validation middleware factory
 * Validates req.body against a schema object.
 * Replace with Joi or Zod for production-grade validation.
 */
export function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
      }

      if (rules.type && value !== undefined && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: true, message: 'Validation failed', details: errors });
    }

    next();
  };
}
