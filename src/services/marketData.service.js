import axios from 'axios';
import { Stock, MarketData } from '../models/index.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/index.js';

const ALPACA_DATA_URL = 'https://data.alpaca.markets/v2';

/**
 * Fetch latest market bars from Alpaca using Axios and upsert into market_data table
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

  // Step 2: Call Alpaca Data endpoint using Axios
  const apiKey = env.alpaca.apiKeyId;
  const apiSecret = env.alpaca.apiSecretKey;

  if (!apiKey || !apiSecret) {
    throw new ApiError(
      500,
      'Alpaca API credentials missing. Please set APCA_API_KEY_ID and APCA_API_SECRET_KEY in environment variables.'
    );
  }

  const url = `${ALPACA_DATA_URL}/stocks/bars/latest`;

  let payload;
  try {
    const response = await axios.get(url, {
      params: { symbols },
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
        accept: 'application/json',
      },
    });
    payload = response.data;
  } catch (err) {
    if (err.response) {
      throw new ApiError(
        err.response.status,
        `Alpaca Data API error (${err.response.status}): ${JSON.stringify(err.response.data)}`
      );
    }
    throw new ApiError(502, `Failed to communicate with Alpaca Data API: ${err.message}`);
  }

  const bars = payload?.bars || {};

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
