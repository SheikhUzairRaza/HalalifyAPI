import { ApiError } from '../utils/index.js';

const ALPACA_BASE_URL = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets';

/**
 * Fetch asset details from Alpaca Markets API
 * @param {string} ticker - Stock symbol (e.g., 'AAPL')
 * @returns {Promise<{ name: string, exchange: string, symbol: string }>}
 */
export const getAlpacaAsset = async (ticker) => {
  const apiKey =
    process.env.APCA_API_KEY_ID ||
    process.env['APCA-API-KEY-ID'] ||
    process.env.ALPACA_API_KEY_ID ||
    process.env['ALPACA-API-KEY-ID'] ||
    process.env.ALPACA_API_KEY;

  const apiSecret =
    process.env.APCA_API_SECRET_KEY ||
    process.env['APCA-API-SECRET-KEY'] ||
    process.env.ALPACA_API_SECRET_KEY ||
    process.env['ALPACA-API-SECRET-KEY'] ||
    process.env.ALPACA_SECRET_KEY;

  if (!apiKey || !apiSecret) {
    throw new ApiError(
      500,
      'Alpaca API credentials missing. Please set APCA_API_KEY_ID (or APCA-API-KEY-ID) and APCA_API_SECRET_KEY (or APCA-API-SECRET-KEY) in environment variables.'
    );
  }

  const url = `${ALPACA_BASE_URL}/v2/assets/${encodeURIComponent(ticker)}`;

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
