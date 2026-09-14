import { Stock } from '../models/index.js';
import { getAlpacaAsset } from './alpaca.service.js';
import { ApiError } from '../utils/index.js';

/**
 * Add or fetch stock by ticker using Alpaca Markets asset metadata
 * @param {string} ticker - Stock symbol (e.g., 'AAPL')
 * @returns {Promise<{ stock: Stock, isNew: boolean }>}
 */
export const addStockService = async (ticker) => {
  const normalizedTicker = ticker.trim().toUpperCase();

  // Check if stock already exists in database
  let stock = await Stock.findOne({ where: { ticker: normalizedTicker } });

  if (stock) {
    return { stock, isNew: false };
  }

  // Fetch asset details from Alpaca Markets
  const alpacaAsset = await getAlpacaAsset(normalizedTicker);

  if (!alpacaAsset || !alpacaAsset.name) {
    throw new ApiError(400, `Could not retrieve valid name for stock symbol: ${normalizedTicker}`);
  }

  // Create new stock record in database
  stock = await Stock.create({
    ticker: normalizedTicker,
    name: alpacaAsset.name,
    exchange: alpacaAsset.exchange || null,
    is_active: true,
  });

  return { stock, isNew: true };
};

export default {
  addStockService,
};

