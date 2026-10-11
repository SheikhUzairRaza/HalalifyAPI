import { ApiError } from '../utils/index.js';

/**
 * Safely assign parsed data to req property (handles Express 5 req.query getter)
 * @param {object} req
 * @param {'body' | 'query' | 'params'} key
 * @param {any} data
 */
const assignReqData = (req, key, data) => {
  try {
    req[key] = data;
  } catch {
    if (req[key] && typeof req[key] === 'object' && data && typeof data === 'object') {
      // Clear existing keys and copy sanitized data
      for (const prop of Object.keys(req[key])) {
        delete req[key][prop];
      }
      Object.assign(req[key], data);
    } else {
      Object.defineProperty(req, key, {
        value: data,
        writable: true,
        configurable: true,
      });
    }
  }
};

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
        assignReqData(req, key, result.data);
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

    assignReqData(req, target, result.data);
    return next();
  }

  next();
};

export default validate;
