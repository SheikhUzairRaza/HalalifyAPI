import axios from 'axios';
import { ApiError } from '../utils/index.js';
import { env } from '../config/env.js';

/**
 * Fetch company profile from Finnhub API using axios and extract sector/industry
 * @param {string} ticker - Stock symbol (e.g. 'AAPL')
 * @returns {Promise<{ sector: string | null, raw: object | null }>}
 */
export const getFinnhubSector = async (ticker) => {
  const apiKey = env.finnhub.apiKey;

  if (!apiKey) {
    console.warn('⚠️ FINNHUB_API_KEY is not configured in environment variables.');
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

export default {
  getFinnhubSector,
};
