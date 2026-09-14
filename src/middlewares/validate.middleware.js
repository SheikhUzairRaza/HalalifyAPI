import { ApiError } from '../utils/index.js';

/**
 * Middleware factory to validate request body using a Zod schema
 * @param {import('zod').ZodSchema} schema
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errorMessages = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'field'}: ${issue.message}`)
      .join(', ');

    throw new ApiError(400, `Validation Error: ${errorMessages}`);
  }

  // Replace req.body with parsed/sanitized data from Zod
  req.body = result.data;
  next();
};

