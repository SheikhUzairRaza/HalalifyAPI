import axios from 'axios';
import { ApiError } from '../utils/index.js';
import { env } from '../config/env.js';

/**
 * Fetch company profile from Finnhub API and extract sector/industry
 * @param {string} ticker - Stock symbol (e.g. 'AAPL')
 * @returns {Promise<{ sector: string | null, raw: object | null }>}
 */
export const getFinnhubSector = async (ticker) => {
  const apiKey = env.finnhub.apiKey;

  if (!apiKey) {
    console.warn('FINNHUB_API_KEY is not configured in environment variables.');
    return { sector: null, raw: null };
  }

  const url = `${env.finnhub.baseUrl}/stock/profile2`;

  try {
    const response = await axios.get(url, {
      params: { symbol: ticker },
      headers: {
        'X-Finnhub-Token': apiKey,
        accept: 'application/json',
      },
    });

    const data = response.data;

    // Finnhub returns sector/industry under finnhubIndustry or sector
    const sector = data?.finnhubIndustry || data?.sector || data?.industry || null;

    return {
      sector,
      raw: data,
    };
  } catch (error) {
    console.warn(`Failed to communicate with Finnhub API for symbol '${ticker}': ${error.message}`);
    return { sector: null, raw: null };
  }
};

/**
 * Fetch fundamental financial metrics from Finnhub API
 * @param {string} ticker - Stock symbol (e.g. 'AAPL')
 * @returns {Promise<object|null>} - Captured metric property from Finnhub response
 */
export const getFinnhubMetrics = async (ticker) => {
  const apiKey = env.finnhub.apiKey;

  if (!apiKey) {
    console.warn('FINNHUB_API_KEY is not configured in environment variables.');
    return null;
  }

  const url = `${env.finnhub.baseUrl}/stock/metric`;

  try {
    const response = await axios.get(url, {
      params: {
        symbol: ticker,
        metric: 'all'
      },
      headers: {
        'X-Finnhub-Token': apiKey,
        accept: 'application/json',
      },
    });

    return response.data?.metric || null;
  } catch (error) {
    console.warn(`Failed to fetch Finnhub metrics for '${ticker}': ${error.message}`);
    return null;
  }
};

export default {
  getFinnhubSector,
  getFinnhubMetrics,
};
