import { Op } from 'sequelize';
import { Stock, MarketData, Feature } from '../models/index.js';
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

/**
 * 1. GET /api/v1/stocks
 * Query: ?search=&sector=&page=1&limit=20
 * Return each stock with its latest price (newest market_data row).
 * Read only from own DB.
 */
export const getStocksService = async ({ search, sector, exchange, is_active, page = 1, limit = 20 }) => {
  const where = {};

  if (is_active !== undefined) {
    where.is_active = is_active;
  }

  if (sector) {
    where.sector = { [Op.like]: `%${sector.trim()}%` };
  }

  if (exchange) {
    where.exchange = { [Op.like]: `%${exchange.trim().toUpperCase()}%` };
  }

  if (search) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { ticker: { [Op.like]: term } },
      { name: { [Op.like]: term } },
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const offset = (pageNum - 1) * limitNum;

  const { count, rows } = await Stock.findAndCountAll({
    where,
    limit: limitNum,
    offset,
    order: [['ticker', 'ASC']],
    attributes: ['id', 'ticker', 'name', 'sector', 'exchange', 'is_active', 'created_at'],
  });

  // Attach latest price (newest market_data row) for each stock
  const stocksWithLatestPrice = await Promise.all(
    rows.map(async (stock) => {
      const latestPriceRow = await MarketData.findOne({
        where: { stock_id: stock.id },
        order: [['date', 'DESC']],
        attributes: ['close', 'date'],
      });

      return {
        id: stock.id,
        ticker: stock.ticker,
        name: stock.name,
        sector: stock.sector,
        exchange: stock.exchange,
        is_active: stock.is_active,
        created_at: stock.created_at,
        latest_price: latestPriceRow
          ? {
              close: latestPriceRow.close,
              date: latestPriceRow.date,
            }
          : null,
      };
    })
  );

  return {
    stocks: stocksWithLatestPrice,
    pagination: {
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum) || 1,
    },
  };
};

/**
 * 2. GET /api/v1/stocks/:id
 * One response with: ticker, name, sector, exchange,
 * latest_price {close, date} from newest market_data row,
 * fundamentals {debt_ratio, pe_ratio, market_cap} from newest features row.
 * Wrong id returns 404. If no price or features yet, returns null for that part.
 */
export const getStockByIdService = async (id) => {
  const stock = await Stock.findByPk(id, {
    attributes: ['id', 'ticker', 'name', 'sector', 'exchange', 'is_active', 'created_at'],
  });

  if (!stock) {
    throw new ApiError(404, `Stock not found with ID: ${id}`);
  }

  // Fetch newest market_data row
  const latestPriceRow = await MarketData.findOne({
    where: { stock_id: stock.id },
    order: [['date', 'DESC']],
    attributes: ['close', 'date'],
  });

  // Fetch newest features row
  const latestFeatureRow = await Feature.findOne({
    where: { stock_id: stock.id },
    order: [['date', 'DESC']],
    attributes: ['debt_ratio', 'debt_to_assets', 'pe_ratio', 'market_cap'],
  });

  return {
    id: stock.id,
    ticker: stock.ticker,
    name: stock.name,
    sector: stock.sector,
    exchange: stock.exchange,
    is_active: stock.is_active,
    created_at: stock.created_at,
    latest_price: latestPriceRow
      ? {
          close: latestPriceRow.close,
          date: latestPriceRow.date,
        }
      : null,
    fundamentals: latestFeatureRow
      ? {
          debt_ratio: latestFeatureRow.debt_ratio,
          debt_to_assets: latestFeatureRow.debt_to_assets,
          pe_ratio: latestFeatureRow.pe_ratio,
          market_cap: latestFeatureRow.market_cap,
        }
      : null,
  };
};

/**
 * 3. GET /api/v1/stocks/:id/market-data?from=&to=&sort=
 * Rows in date range, sorted by date (default ascending). Default to last 90 days if no range given.
 * Wrong id returns 404.
 */
export const getStockMarketDataHistoryService = async (id, { from, to, sort = 'asc' }) => {
  const stock = await Stock.findByPk(id, {
    attributes: ['id', 'ticker'],
  });

  if (!stock) {
    throw new ApiError(404, `Stock not found with ID: ${id}`);
  }

  // Calculate default range (last 90 days)
  const today = new Date();
  const defaultFrom = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const defaultTo = today.toISOString().split('T')[0];

  const startDate = from || defaultFrom;
  const endDate = to || defaultTo;
  const sortDirection = String(sort).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const rows = await MarketData.findAll({
    where: {
      stock_id: stock.id,
      date: {
        [Op.between]: [startDate, endDate],
      },
    },
    order: [['date', sortDirection]],
    attributes: ['id', 'date', 'open', 'high', 'low', 'close', 'volume'],
  });

  return {
    stock_id: stock.id,
    ticker: stock.ticker,
    range: {
      from: startDate,
      to: endDate,
    },
    sort: sortDirection.toLowerCase(),
    count: rows.length,
    data: rows,
  };
};

/**
 * 4. GET /api/v1/stocks/:id/features?full=false
 * Fundamentals history, newest first.
 * Exclude technical_indicators JSON unless ?full=true.
 * Wrong id returns 404.
 */
export const getStockFeaturesHistoryService = async (id, { full = false }) => {
  const stock = await Stock.findByPk(id, {
    attributes: ['id', 'ticker'],
  });

  if (!stock) {
    throw new ApiError(404, `Stock not found with ID: ${id}`);
  }

  const isFull = full === true || full === 'true' || full === 1 || full === '1';
  const attributes = ['id', 'date', 'debt_ratio', 'debt_to_assets', 'pe_ratio', 'market_cap'];

  if (isFull) {
    attributes.push('technical_indicators');
  }

  const rows = await Feature.findAll({
    where: { stock_id: stock.id },
    order: [['date', 'DESC']],
    attributes,
  });

  return {
    stock_id: stock.id,
    ticker: stock.ticker,
    full: isFull,
    count: rows.length,
    data: rows,
  };
};

export default {
  addStockService,
  getStocksService,
  getStockByIdService,
  getStockMarketDataHistoryService,
  getStockFeaturesHistoryService,
};
