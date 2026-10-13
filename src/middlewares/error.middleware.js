import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || [];
  const code = err.code || null;

  res.status(statusCode).json({
    success: false,
    statusCode,
    ...(code && { code }),
    message,
    ...(errors.length > 0 && { errors }),
    ...(env.isDevelopment && { stack: err.stack }),
  });
};

export default errorHandler;
