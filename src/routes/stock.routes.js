import { Router } from 'express';
import {
  getAllStocks,
  getStockByTicker,
  getStockMarketData,
  getStockFeatures,
  syncStockOnDemand,
} from '../controllers/stock.controller.js';

const router = Router();

/**
 * @openapi
 * /api/stocks:
 *   get:
 *     summary: Get all tracked stocks
 *     description: Retrieves all active tracked stocks along with their latest financial features.
 *     tags:
 *       - Stocks
 *     responses:
 *       200:
 *         description: Tracked stocks list retrieved successfully
 */
router.get('/', getAllStocks);

/**
 * @openapi
 * /api/stocks/{ticker}:
 *   get:
 *     summary: Get single stock details by ticker symbol
 *     tags:
 *       - Stocks
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         schema:
 *           type: string
 *         example: AAPL
 *     responses:
 *       200:
 *         description: Stock details retrieved successfully
 *       404:
 *         description: Stock not found
 */
router.get('/:ticker', getStockByTicker);

/**
 * @openapi
 * /api/stocks/{ticker}/market-data:
 *   get:
 *     summary: Get historical market price OHLC data for a stock
 *     tags:
 *       - Stocks
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         schema:
 *           type: string
 *         example: AAPL
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Market price history retrieved successfully
 */
router.get('/:ticker/market-data', getStockMarketData);

/**
 * @openapi
 * /api/stocks/{ticker}/features:
 *   get:
 *     summary: Get fundamental financial ratios for a stock
 *     tags:
 *       - Stocks
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         schema:
 *           type: string
 *         example: AAPL
 *     responses:
 *       200:
 *         description: Stock fundamental ratios retrieved successfully
 */
router.get('/:ticker/features', getStockFeatures);

/**
 * @openapi
 * /api/stocks/{ticker}/sync:
 *   post:
 *     summary: Manually trigger an on-demand Finnhub data sync for a ticker
 *     tags:
 *       - Stocks
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         schema:
 *           type: string
 *         example: AAPL
 *     responses:
 *       200:
 *         description: Stock data synced on demand
 */
router.post('/:ticker/sync', syncStockOnDemand);

export default router;

