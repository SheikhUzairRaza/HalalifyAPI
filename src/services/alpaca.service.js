import axios from 'axios';
import { ApiError } from '../utils/index.js';
import { env } from '../config/env.js';

/**
 * Fetch asset details from Alpaca Markets API using axios
 * @param {string} ticker - Stock symbol (e.g., 'AAPL')
 * @returns {Promise<{ name: string, exchange: string, symbol: string, status: string, tradable: boolean }>}
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
    const response = await axios.get(url, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
        accept: 'application/json',
      },
    });

    const data = response.data;

    return {
      name: data.name,
      exchange: data.exchange,
      symbol: data.symbol || ticker,
      status: data.status,
      tradable: data.tradable,
    };
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw new ApiError(404, `Stock ticker '${ticker}' not found on Alpaca Markets`);
      }
      if (error.response.status === 401 || error.response.status === 403) {
        throw new ApiError(401, 'Invalid Alpaca API credentials. Authentication failed.');
      }
      throw new ApiError(
        error.response.status,
        `Alpaca API error (${error.response.status}): ${JSON.stringify(error.response.data)}`
      );
    }
    throw new ApiError(502, `Failed to communicate with Alpaca API: ${error.message}`);
  }
};

export default {
  getAlpacaAsset,
};
