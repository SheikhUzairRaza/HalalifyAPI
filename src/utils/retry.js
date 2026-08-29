/**
 * Retries an async function execution with exponential backoff
 * @param {Function} fn Async function to execute
 * @param {number} maxRetries Maximum retry attempts (default: 3)
 * @param {number} baseDelay Base delay in ms (default: 1000ms)
 * @returns {Promise<any>} Result of fn execution
 */
export const withRetry = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed: ${error.message}. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

