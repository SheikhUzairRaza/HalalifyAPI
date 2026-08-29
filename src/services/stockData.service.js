import { Stock, MarketData, StockFeature } from '../models/index.js';
import {
  getCompanyProfile,
  getQuote,
  getHistoricalCandles,
  getBasicFinancials,
} from './finnhub.service.js';
import { ApiError } from '../utils/index.js';

/**
 * 1. Fetch & Store Basic Stock Info (Populates `stocks` table)
 * @param {string} ticker Stock symbol (e.g. 'AAPL')
 * @returns {Promise<Stock>} Updated Stock model instance
 */
export const syncStockProfile = async (ticker) => {
  const symbol = ticker.toUpperCase().trim();

  try {
    const profile = await getCompanyProfile(symbol);

    if (!profile) {
      console.warn(`⚠️ [Stock Sync] No profile data returned for ticker: ${symbol}. Serving last cached data if available.`);
      const existingStock = await Stock.findOne({ where: { ticker: symbol } });
      if (existingStock) return existingStock;
      throw new ApiError(404, `No stock profile found for ticker: ${symbol}`);
    }

    const [stock] = await Stock.upsert({
      ticker: symbol,
      name: profile.name || symbol,
      sector: profile.finnhubIndustry || null,
      exchange: profile.exchange || null,
      country: profile.country || null,
      currency: profile.currency || 'USD',
      is_active: true,
      last_profile_sync: new Date(),
    });

    console.log(`✅ [Stock Sync] Profile synced for ${symbol}: ${stock.name} (${stock.exchange})`);
    return stock;
  } catch (error) {
    console.error(`💥 [Stock Sync Error] Failed to sync profile for ${symbol}:`, error.message);
    const existingStock = await Stock.findOne({ where: { ticker: symbol } });
    if (existingStock) return existingStock;
    throw error;
  }
};

/**
 * 2. Fetch & Store Market Price Data (Populates `market_data` table, 1 row per stock per day)
 * @param {string} ticker Stock symbol (e.g. 'AAPL')
 * @param {{ from: string|Date, to: string|Date }|null} dateRange Optional historical date range
 * @returns {Promise<Array<MarketData>>} Saved market data records
 */
export const syncMarketData = async (ticker, dateRange = null) => {
  const symbol = ticker.toUpperCase().trim();

  // Ensure stock exists in database
  let stock = await Stock.findOne({ where: { ticker: symbol } });
  if (!stock) {
    stock = await syncStockProfile(symbol);
  }

  try {
    const savedRecords = [];

    if (dateRange && dateRange.from && dateRange.to) {
      // Historical Backfill Mode
      const fromSeconds = Math.floor(new Date(dateRange.from).getTime() / 1000);
      const toSeconds = Math.floor(new Date(dateRange.to).getTime() / 1000);

      const candles = await getHistoricalCandles(symbol, 'D', fromSeconds, toSeconds);

      for (const candle of candles) {
        const [record] = await MarketData.upsert({
          stock_id: stock.id,
          ticker: symbol,
          date: candle.date,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          timestamp: candle.timestamp,
        });
        savedRecords.push(record);
      }

      console.log(`✅ [Market Data Sync] Historical candles synced for ${symbol}: ${savedRecords.length} days backfilled.`);
    } else {
      // Current Daily Price Quote Mode
      const quote = await getQuote(symbol);

      if (!quote) {
        console.warn(`⚠️ [Market Data Sync] No quote returned for ${symbol}. Serving last cached price.`);
        const lastData = await MarketData.findAll({ where: { stock_id: stock.id }, limit: 1 });
        return lastData;
      }

      const todayDate = quote.timestamp.toISOString().split('T')[0];

      const [record] = await MarketData.upsert({
        stock_id: stock.id,
        ticker: symbol,
        date: todayDate,
        open: quote.open,
        high: quote.high,
        low: quote.low,
        close: quote.close,
        volume: null,
        timestamp: quote.timestamp,
      });

      savedRecords.push(record);
      console.log(`✅ [Market Data Sync] Daily price quote synced for ${symbol} on ${todayDate}: Close $${quote.close}`);
    }

    return savedRecords;
  } catch (error) {
    console.error(`💥 [Market Data Sync Error] Failed to sync price data for ${symbol}:`, error.message);
    const cachedRecords = await MarketData.findAll({
      where: { stock_id: stock.id },
      order: [['date', 'DESC']],
      limit: 30,
    });
    return cachedRecords;
  }
};

/**
 * 3. Fetch & Store Fundamental Ratios (Populates `features` table)
 * @param {string} ticker Stock symbol (e.g. 'AAPL')
 * @returns {Promise<StockFeature>} Saved feature metrics record
 */
export const syncFundamentalRatios = async (ticker) => {
  const symbol = ticker.toUpperCase().trim();

  // Ensure stock exists in database
  let stock = await Stock.findOne({ where: { ticker: symbol } });
  if (!stock) {
    stock = await syncStockProfile(symbol);
  }

  try {
    const rawFinancials = await getBasicFinancials(symbol);

    if (!rawFinancials || !rawFinancials.metric) {
      console.warn(`⚠️ [Ratio Sync] No metrics returned for ${symbol}. Serving last cached features.`);
      const existingFeature = await StockFeature.findOne({ where: { stock_id: stock.id } });
      if (existingFeature) return existingFeature;
      throw new ApiError(404, `No fundamental ratios found for ticker: ${symbol}`);
    }

    const metric = rawFinancials.metric;

    // Extract key ratios
    const peRatio = metric.peNormalizedAnnual || metric.peTTM || metric.peBasicExclExtraTTM || null;
    const debtToEquity = metric.totalDebtToEquity || metric.debtEquityAnnual || metric.totalDebtToTotalEquityQuarterly || null;
    const marketCap = metric.marketCapitalization || null;

    const [feature] = await StockFeature.upsert({
      stock_id: stock.id,
      ticker: symbol,
      pe_ratio: peRatio,
      debt_to_equity: debtToEquity,
      market_cap: marketCap,
      raw_ratios: rawFinancials,
      last_ratios_sync: new Date(),
    });

    console.log(`✅ [Ratio Sync] Fundamental ratios synced for ${symbol}: P/E = ${peRatio}, D/E = ${debtToEquity}`);
    return feature;
  } catch (error) {
    console.error(`💥 [Ratio Sync Error] Failed to sync ratios for ${symbol}:`, error.message);
    const existingFeature = await StockFeature.findOne({ where: { stock_id: stock.id } });
    if (existingFeature) return existingFeature;
    throw error;
  }
};

