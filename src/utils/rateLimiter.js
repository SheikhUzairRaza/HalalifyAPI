/**
 * Utility helper to sleep/delay execution for rate-limiting compliance
 * @param {number} ms Milliseconds to delay (default: 2000ms for ~30 calls/min limit)
 */
export const sleep = (ms = 2000) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Paced execution wrapper to ensure calls are spaced out
 */
class RateLimiter {
  constructor(delayMs = 2000) {
    this.delayMs = delayMs;
    this.lastCallTime = 0;
  }

  async throttle() {
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < this.delayMs) {
      const waitTime = this.delayMs - elapsed;
      await sleep(waitTime);
    }
    this.lastCallTime = Date.now();
  }
}

export const finnhubRateLimiter = new RateLimiter(2000);

