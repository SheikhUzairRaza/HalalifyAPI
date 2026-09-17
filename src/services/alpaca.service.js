import { ApiError } from '../utils/index.js';
import { env } from '../config/env.js';

/**
 * Fetch asset details from Alpaca Markets API
 * @param {string} ticker - Stock symbol (e.g., 'AAPL')
 * @returns {Promise<{ name: string, exchange: string, symbol: string }>}
 */
export const getAlpacaAsset = async (ticker) => {
  const apiKey = env.alpaca.apiKeyId;
  const apiSecret = env.alpaca.apiSecretKey;

  if (!apiKey || !apiSecret) {
    throw new ApiError(
      500,
      'Alpaca API credentials missing. Please set APCA_API_KEY_ID and APCA_API_SECRET_KEY in environment variables.'
    );
  }

  const url = `${env.alpaca.baseUrl}/v2/assets/${encodeURIComponent(ticker)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
        accept: 'application/json',
      },
    });

    if (response.status === 404) {
      throw new ApiError(404, `Stock ticker '${ticker}' not found on Alpaca Markets`);
    }

    if (response.status === 401 || response.status === 403) {
      throw new ApiError(401, 'Invalid Alpaca API credentials. Authentication failed.');
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new ApiError(
        response.status,
        `Alpaca API error (${response.status}): ${errorBody || response.statusText}`
      );
    }

    const data = await response.json();

    return {
      name: data.name,
      exchange: data.exchange,
      symbol: data.symbol || ticker,
      status: data.status,
      tradable: data.tradable,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(502, `Failed to communicate with Alpaca API: ${error.message}`);
  }
};

export default {
  getAlpacaAsset,
};
