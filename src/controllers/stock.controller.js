import { asyncHandler, ApiResponse } from '../utils/index.js';
import {
  addStockService,
  getStocksService,
  getStockByIdService,
  getStockMarketDataHistoryService,
  getStockFeaturesHistoryService,
} from '../services/stock.service.js';
import {
  getStockComplianceService,
  getComplianceSummaryService,
} from '../services/compliance.service.js';

/**
 * @desc    Add new stock by ticker (fetches name & exchange from Alpaca Markets)
 * @route   POST /api/v1/stocks
 * @access  Public
 */
export const addStock = asyncHandler(async (req, res) => {
  const { ticker } = req.body;
  const { stock, isNew } = await addStockService(ticker);

  const statusCode = isNew ? 201 : 200;
  const message = isNew ? 'Stock added successfully from Alpaca' : 'Stock already exists in database';

  return new ApiResponse(statusCode, { stock }, message).send(res);
});

/**
 * @desc    Get paginated stocks with latest price & compliance badge from database
 * @route   GET /api/v1/stocks
 * @access  Public
 */
export const getStocks = asyncHandler(async (req, res) => {
  const result = await getStocksService(req.query);
  return new ApiResponse(200, result, 'Stocks retrieved successfully').send(res);
});

/**
 * @desc    Get stock detail with latest price, fundamentals & compliance badge from database
 * @route   GET /api/v1/stocks/:id
 * @access  Public
 */
export const getStockById = asyncHandler(async (req, res) => {
  const stock = await getStockByIdService(req.params.id, req.query.mode);
  return new ApiResponse(200, { stock }, 'Stock details retrieved successfully').send(res);
});

/**
 * @desc    Get stock historical market data in date range (default last 90 days)
 * @route   GET /api/v1/stocks/:id/market-data
 * @access  Public
 */
export const getStockMarketDataHistory = asyncHandler(async (req, res) => {
  const result = await getStockMarketDataHistoryService(req.params.id, req.query);
  return new ApiResponse(200, result, 'Market data history retrieved successfully').send(res);
});

/**
 * @desc    Get stock historical fundamentals (newest first, technical_indicators optional)
 * @route   GET /api/v1/stocks/:id/features
 * @access  Public
 */
export const getStockFeaturesHistory = asyncHandler(async (req, res) => {
  const result = await getStockFeaturesHistoryService(req.params.id, req.query);
  return new ApiResponse(200, result, 'Features history retrieved successfully').send(res);
});

/**
 * @desc    Get Shariah compliance details for a specific stock
 * @route   GET /api/v1/stocks/:id/compliance
 * @access  Public
 */
export const getStockCompliance = asyncHandler(async (req, res) => {
  const result = await getStockComplianceService(req.params.id, req.query.mode);
  return new ApiResponse(200, result, 'Stock compliance retrieved successfully').send(res);
});

/**
 * @desc    Get Shariah compliance summary across all stocks (GROUP BY aggregation)
 * @route   GET /api/v1/compliance/summary
 * @access  Public
 */
export const getComplianceSummary = asyncHandler(async (req, res) => {
  const result = await getComplianceSummaryService(req.query.mode);
  return new ApiResponse(200, result, 'Compliance summary retrieved successfully').send(res);
});

export default {
  addStock,
  getStocks,
  getStockById,
  getStockMarketDataHistory,
  getStockFeaturesHistory,
  getStockCompliance,
  getComplianceSummary,
};
