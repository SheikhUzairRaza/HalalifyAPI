import { ApiError } from '../utils/index.js';

/**
 * Middleware factory to validate request data using Zod schema(s)
 * Supports:
 *  - validate(schema) -> validates req.body (default)
 *  - validate(schema, 'query' | 'params' | 'body') -> validates specified request target
 *  - validate({ body?: schema, query?: schema, params?: schema }) -> validates multiple targets
 *
 * @param {import('zod').ZodSchema | { body?: import('zod').ZodSchema, query?: import('zod').ZodSchema, params?: import('zod').ZodSchema }} schema
 * @param {'body' | 'query' | 'params'} [target='body']
 */
export const validate = (schema, target = 'body') => (req, res, next) => {
  // Case 1: Composite schema object with body / query / params
  if (schema && typeof schema === 'object' && !('safeParse' in schema)) {
    const targets = ['body', 'query', 'params'];
    for (const key of targets) {
      if (schema[key] && typeof schema[key].safeParse === 'function') {
        const result = schema[key].safeParse(req[key]);
        if (!result.success) {
          const errorMessages = result.error.issues
            .map((issue) => `${key}.${issue.path.join('.') || 'field'}: ${issue.message}`)
            .join(', ');
          throw new ApiError(400, `Validation Error: ${errorMessages}`);
        }
        req[key] = result.data;
      }
    }
    return next();
  }

  // Case 2: Standard single Zod schema targeting body/query/params
  if (schema && typeof schema.safeParse === 'function') {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errorMessages = result.error.issues
        .map((issue) => `${issue.path.join('.') || 'field'}: ${issue.message}`)
        .join(', ');

      throw new ApiError(400, `Validation Error: ${errorMessages}`);
    }

    req[target] = result.data;
    return next();
  }

  next();
};

export default validate;
