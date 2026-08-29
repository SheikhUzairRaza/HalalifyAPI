import { Stock, MarketData, StockFeature } from '../models/index.js';
import {
  syncStockProfile,
  syncMarketData,
  syncFundamentalRatios,
} from '../services/stockData.service.js';
import { ApiError, ApiResponse, asyncHandler } from '../utils/index.js';

/**
 * Helper to fetch complete stock details with associations from Database
 */
const fetchStockFromDatabase = async (symbol) => {
  return Stock.findOne({
    where: { ticker: symbol },
    include: [
      {
        model: StockFeature,
        as: 'feature',
        attributes: ['id', 'stock_id', 'ticker', 'pe_ratio', 'debt_to_equity', 'market_cap', 'last_ratios_sync'],
      },
      {
        model: MarketData,
        as: 'marketData',
        limit: 30,
        order: [['date', 'DESC']],
      },
    ],
  });
};

/**
 * @desc    Get all tracked stocks from database
 * @route   GET /api/stocks
 * @access  Public
 */
export const getAllStocks = asyncHandler(async (req, res) => {
  const stocks = await Stock.findAll({
    where: { is_active: true },
    include: [
      {
        model: StockFeature,
        as: 'feature',
        attributes: ['id', 'stock_id', 'ticker', 'pe_ratio', 'debt_to_equity', 'market_cap', 'last_ratios_sync'],
      },
    ],
    order: [['ticker', 'ASC']],
  });

  return new ApiResponse(200, { stocks }, 'Tracked stocks retrieved successfully').send(res);
});

/**
 * @desc    Get single stock details by ticker (Auto-syncs from Finnhub if ticker is not in DB or ?sync=true)
 * @route   GET /api/stocks/:ticker
 * @access  Public
 */
export const getStockByTicker = asyncHandler(async (req, res) => {
  const symbol = req.params.ticker.toUpperCase().trim();
  const forceSync = req.query.sync === 'true';

  let stock = await fetchStockFromDatabase(symbol);

  // If stock is not in database OR user requested ?sync=true -> Auto-sync from Finnhub & save to DB!
  if (!stock || forceSync) {
    try {
      console.log(`🌐 [Auto Sync] Fetching live data from Finnhub for '${symbol}'...`);
      await syncStockProfile(symbol);
      await syncMarketData(symbol);
      await syncFundamentalRatios(symbol);

      stock = await fetchStockFromDatabase(symbol);
    } catch (syncErr) {
      if (!stock) {
        throw new ApiError(404, `Stock with ticker '${symbol}' could not be fetched: ${syncErr.message}`);
      }
      console.warn(`⚠️ [Auto Sync Warning] Failed to refresh live data for '${symbol}', returning existing cached DB data.`);
    }
  }

  return new ApiResponse(200, { stock }, 'Stock details retrieved successfully').send(res);
});

/**
 * @desc    Get price history / market data for a stock ticker (Auto-syncs from Finnhub if not in DB)
 * @route   GET /api/stocks/:ticker/market-data
 * @access  Public
 */
export const getStockMarketData = asyncHandler(async (req, res) => {
  const symbol = req.params.ticker.toUpperCase().trim();
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

  let stock = await Stock.findOne({ where: { ticker: symbol } });
  if (!stock) {
    stock = await syncStockProfile(symbol);
    await syncMarketData(symbol);
  }

  const marketData = await MarketData.findAll({
    where: { stock_id: stock.id },
    order: [['date', 'DESC']],
    limit,
  });

  return new ApiResponse(200, { ticker: symbol, marketData }, 'Market data retrieved successfully').send(res);
});

/**
 * @desc    Get fundamental ratios & features for a stock ticker (Auto-syncs from Finnhub if not in DB)
 * @route   GET /api/stocks/:ticker/features
 * @access  Public
 */
export const getStockFeatures = asyncHandler(async (req, res) => {
  const symbol = req.params.ticker.toUpperCase().trim();

  let feature = await StockFeature.findOne({ where: { ticker: symbol } });
  if (!feature) {
    await syncStockProfile(symbol);
    feature = await syncFundamentalRatios(symbol);
  }

  return new ApiResponse(200, { ticker: symbol, feature }, 'Stock features retrieved successfully').send(res);
});

/**
 * @desc    Manually trigger on-demand sync for a stock ticker
 * @route   POST /api/stocks/:ticker/sync
 * @access  Public / Admin
 */
export const syncStockOnDemand = asyncHandler(async (req, res) => {
  const symbol = req.params.ticker.toUpperCase().trim();

  const profile = await syncStockProfile(symbol);
  const marketData = await syncMarketData(symbol);
  const feature = await syncFundamentalRatios(symbol);

  return new ApiResponse(
    200,
    {
      stock: profile,
      marketData,
      feature,
    },
    `Stock data successfully synced for ${symbol}`
  ).send(res);
});
