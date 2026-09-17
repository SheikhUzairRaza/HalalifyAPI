import { Stock, MarketData } from '../models/index.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/index.js';

const ALPACA_DATA_URL = 'https://data.alpaca.markets/v2';

/**
 * Fetch latest market bars from Alpaca and upsert into market_data table
 * @returns {Promise<{ success: boolean, totalStocks: number, updatedCount: number, data: Array }>}
 */
export const refreshMarketData = async () => {
  // Step 1: Fetch all active stocks from stocks table
  const activeStocks = await Stock.findAll({
    where: { is_active: true },
    attributes: ['id', 'ticker'],
  });

  if (!activeStocks || activeStocks.length === 0) {
    return {
      success: true,
      totalStocks: 0,
      updatedCount: 0,
      message: 'No active stocks found in database',
      data: [],
    };
  }

  // Map ticker -> stock_id
  const stockMap = new Map();
  activeStocks.forEach((stock) => {
    stockMap.set(stock.ticker.toUpperCase(), stock.id);
  });

  // Make comma-separated string like "AAPL,MSFT,TSLA"
  const symbols = activeStocks.map((stock) => stock.ticker.toUpperCase()).join(',');

  // Step 2: Call Alpaca Data endpoint
  const apiKey = env.alpaca.apiKeyId;
  const apiSecret = env.alpaca.apiSecretKey;

  if (!apiKey || !apiSecret) {
    throw new ApiError(
      500,
      'Alpaca API credentials missing. Please set APCA_API_KEY_ID and APCA_API_SECRET_KEY in environment variables.'
    );
  }

  const url = `${ALPACA_DATA_URL}/stocks/bars/latest?symbols=${encodeURIComponent(symbols)}`;

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
        accept: 'application/json',
      },
    });
  } catch (err) {
    throw new ApiError(502, `Failed to communicate with Alpaca Data API: ${err.message}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(
      response.status,
      `Alpaca Data API error (${response.status}): ${errorText || response.statusText}`
    );
  }

  const payload = await response.json();
  const bars = payload.bars || {};

  // Step 3: Loop through JSON response for each symbol
  const recordsToUpsert = [];

  for (const [symbol, bar] of Object.entries(bars)) {
    const stockId = stockMap.get(symbol.toUpperCase());
    if (stockId && bar) {
      const barDate = bar.t ? bar.t.split('T')[0] : new Date().toISOString().split('T')[0];

      recordsToUpsert.push({
        stock_id: stockId,
        date: barDate,
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v || 0,
        fetched_at: new Date(),
      });
    }
  }

  // Step 4: Upsert into market_data table on (stock_id, date) duplicate
  if (recordsToUpsert.length > 0) {
    await MarketData.bulkCreate(recordsToUpsert, {
      updateOnDuplicate: ['open', 'high', 'low', 'close', 'volume', 'fetched_at', 'updated_at'],
    });
  }

  return {
    success: true,
    totalStocks: activeStocks.length,
    updatedCount: recordsToUpsert.length,
    data: recordsToUpsert,
  };
};

export default {
  refreshMarketData,
};
