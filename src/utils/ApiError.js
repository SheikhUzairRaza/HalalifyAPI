export class ApiError extends Error {
  constructor(
    statusCode = 500,
    message = 'Something went wrong',
    errors = [],
    code = null,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;

    if (typeof errors === 'string') {
      this.code = errors;
      this.errors = [];
    } else {
      this.errors = errors;
      this.code = code;
    }

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export default ApiError;

