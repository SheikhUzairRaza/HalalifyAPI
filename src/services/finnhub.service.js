import finnhubClient from '../config/finnhub.js';
import { withRetry, finnhubRateLimiter } from '../utils/index.js';

/**
 * Isolated Finnhub API Client Service
 * Encapsulates all external Finnhub SDK interactions with pacing & retries.
 */

/**
 * Helper to safely convert Unix timestamp (in seconds) to JS Date
 */
const safeTimestampToDate = (ts) => {
  const num = Number(ts);
  if (!isNaN(num) && num > 1000000000) {
    return new Date(num * 1000);
  }
  return new Date();
};

/**
 * Fetch company profile (name, sector/industry, exchange, country, currency)
 * @param {string} symbol Ticker symbol (e.g. 'AAPL')
 * @returns {Promise<Object>} Company profile object
 */
export const getCompanyProfile = async (symbol) => {
  return withRetry(async () => {
    await finnhubRateLimiter.throttle();

    return new Promise((resolve, reject) => {
      finnhubClient.companyProfile2({ symbol: symbol.toUpperCase() }, (error, data, response) => {
        if (error) {
          const errObj = typeof error === 'string' ? new Error(error) : (error instanceof Error ? error : new Error(JSON.stringify(error)));
          return reject(errObj);
        }
        if (!data || Object.keys(data).length === 0) {
          console.warn(`⚠️ Finnhub API returned empty profile for ticker: ${symbol}.`);
          return resolve(null);
        }
        resolve(data);
      });
    });
  });
};

/**
 * Fetch current day real-time quote (open, high, low, close, timestamp)
 * @param {string} symbol Ticker symbol (e.g. 'AAPL')
 * @returns {Promise<Object>} Real-time quote object
 */
export const getQuote = async (symbol) => {
  return withRetry(async () => {
    await finnhubRateLimiter.throttle();

    return new Promise((resolve, reject) => {
      finnhubClient.quote(symbol.toUpperCase(), (error, data, response) => {
        if (error) {
          const errObj = typeof error === 'string' ? new Error(error) : (error instanceof Error ? error : new Error(JSON.stringify(error)));
          return reject(errObj);
        }
        if (!data || data.c === 0) {
          console.warn(`⚠️ Finnhub API returned empty quote for ticker: ${symbol}.`);
          return resolve(null);
        }

        const validTimestamp = safeTimestampToDate(data.t);

        resolve({
          open: data.o,
          high: data.h,
          low: data.l,
          close: data.c,
          previousClose: data.pc,
          timestamp: validTimestamp,
        });
      });
    });
  });
};

/**
 * Fetch historical price candles for a date range
 * @param {string} symbol Ticker symbol (e.g. 'AAPL')
 * @param {string} resolution Candle resolution ('D' for daily)
 * @param {number} from Unix timestamp in seconds
 * @param {number} to Unix timestamp in seconds
 * @returns {Promise<Array<Object>>} Array of OHLC candle objects
 */
export const getHistoricalCandles = async (symbol, resolution = 'D', from, to) => {
  return withRetry(async () => {
    await finnhubRateLimiter.throttle();

    return new Promise((resolve, reject) => {
      finnhubClient.stockCandles(symbol.toUpperCase(), resolution, Number(from), Number(to), (error, data, response) => {
        if (error) {
          const errObj = typeof error === 'string' ? new Error(error) : (error instanceof Error ? error : new Error(JSON.stringify(error)));
          return reject(errObj);
        }
        if (!data || data.s !== 'ok' || !data.t || data.t.length === 0) {
          console.warn(`⚠️ Finnhub API returned no candles for ticker: ${symbol} in date range.`);
          return resolve([]);
        }

        const candles = data.t.map((timestamp, index) => {
          const candleDate = safeTimestampToDate(timestamp);
          return {
            open: data.o[index],
            high: data.h[index],
            low: data.l[index],
            close: data.c[index],
            volume: data.v ? data.v[index] : null,
            timestamp: candleDate,
            date: candleDate.toISOString().split('T')[0],
          };
        });

        resolve(candles);
      });
    });
  });
};

/**
 * Fetch fundamental financial metrics & ratios
 * @param {string} symbol Ticker symbol (e.g. 'AAPL')
 * @returns {Promise<Object>} Fundamental financial metrics object
 */
export const getBasicFinancials = async (symbol) => {
  return withRetry(async () => {
    await finnhubRateLimiter.throttle();

    return new Promise((resolve, reject) => {
      finnhubClient.companyBasicFinancials(symbol.toUpperCase(), 'all', (error, data, response) => {
        if (error) {
          const errObj = typeof error === 'string' ? new Error(error) : (error instanceof Error ? error : new Error(JSON.stringify(error)));
          return reject(errObj);
        }
        if (!data || !data.metric) {
          console.warn(`⚠️ Finnhub API returned no basic financial metrics for ticker: ${symbol}.`);
          return resolve(null);
        }
        resolve(data);
      });
    });
  });
};
