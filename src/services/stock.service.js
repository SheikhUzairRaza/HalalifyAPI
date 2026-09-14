import { Stock } from '../models/index.js';
import { getAlpacaAsset } from './alpaca.service.js';
import { getFinnhubSector } from './finnhub.service.js';
import { ApiError } from '../utils/index.js';

/**
 * Add or fetch stock by ticker using Alpaca Markets metadata and Finnhub sector profile
 * @param {string} ticker - Stock symbol (e.g., 'AAPL')
 * @returns {Promise<{ stock: Stock, isNew: boolean }>}
 */
export const addStockService = async (ticker) => {
  const normalizedTicker = ticker.trim().toUpperCase();

  // 1. Fetch asset details from Alpaca Markets
  const alpacaAsset = await getAlpacaAsset(normalizedTicker);

  if (!alpacaAsset || !alpacaAsset.name) {
    throw new ApiError(400, `Could not retrieve valid name for stock symbol: ${normalizedTicker}`);
  }

  // 2. Fetch sector from Finnhub API (GET https://finnhub.io/api/v1/stock/profile2?symbol={ticker})
  const finnhubProfile = await getFinnhubSector(normalizedTicker);
  const sector = finnhubProfile.sector || null;

  // 3. Check if stock already exists in database
  let stock = await Stock.findOne({ where: { ticker: normalizedTicker } });

  if (stock) {
    // Update existing stock with latest Alpaca name/exchange and Finnhub sector
    stock.name = alpacaAsset.name || stock.name;
    stock.exchange = alpacaAsset.exchange || stock.exchange;
    if (sector) {
      stock.sector = sector;
    }
    await stock.save();

    return { stock, isNew: false };
  }

  // 4. Create new stock record in database
  stock = await Stock.create({
    ticker: normalizedTicker,
    name: alpacaAsset.name,
    sector,
    exchange: alpacaAsset.exchange || null,
    is_active: true,
  });

  return { stock, isNew: true };
};

export default {
  addStockService,
};
