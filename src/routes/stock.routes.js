import { Router } from 'express';
import {
  addStock,
  getStocks,
  getStockById,
  getStockMarketDataHistory,
  getStockFeaturesHistory,
} from '../controllers/stock.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createStockSchema,
  getStocksQuerySchema,
  stockIdParamSchema,
  getMarketDataQuerySchema,
  getFeaturesQuerySchema,
} from '../validations/stock.validation.js';

const router = Router();

/**
 * @openapi
 * /api/v1/stocks:
 *   post:
 *     summary: Add stock by ticker
 *     description: Fetches asset details (name & exchange) from Alpaca Markets API and saves them in the stocks table.
 *     tags:
 *       - Stocks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticker
 *             properties:
 *               ticker:
 *                 type: string
 *                 example: AAPL
 *                 description: Stock ticker symbol (e.g. AAPL, MSFT, TSLA)
 *     responses:
 *       201:
 *         description: Stock fetched from Alpaca and stored successfully
 *       200:
 *         description: Stock already exists in database
 *       400:
 *         description: Validation error
 *       404:
 *         description: Stock ticker not found on Alpaca Markets
 */
router.post('/', validate(createStockSchema), addStock);

/**
 * @openapi
 * /api/v1/stocks:
 *   get:
 *     summary: Get all stocks with latest price
 *     description: Returns paginated stocks from our database with their latest market price. Reads only from own DB.
 *     tags:
 *       - Stocks
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by ticker or company name
 *       - in: query
 *         name: sector
 *         schema:
 *           type: string
 *         description: Filter by sector name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Stocks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         stocks:
 *                           type: array
 *                           items:
 *                             type: object
 *                         pagination:
 *                           type: object
 *       400:
 *         description: Validation error
 */
router.get('/', validate(getStocksQuerySchema, 'query'), getStocks);

/**
 * @openapi
 * /api/v1/stocks/{id}:
 *   get:
 *     summary: Get stock detail with latest price and fundamentals
 *     description: Returns stock details, newest market_data price row, and newest features row. Reads only from own DB.
 *     tags:
 *       - Stocks
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stock UUID
 *     responses:
 *       200:
 *         description: Stock details retrieved successfully
 *       404:
 *         description: Stock not found
 *       400:
 *         description: Invalid UUID format
 */
router.get('/:id', validate(stockIdParamSchema, 'params'), getStockById);

/**
 * @openapi
 * /api/v1/stocks/{id}/market-data:
 *   get:
 *     summary: Get stock historical market data in date range
 *     description: Returns market data bars ascending by date. Defaults to last 90 days if no range given. Reads only from own DB.
 *     tags:
 *       - Stocks
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stock UUID
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-06-01"
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-09-01"
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Historical market data retrieved successfully
 *       404:
 *         description: Stock not found
 *       400:
 *         description: Validation error
 */
router.get(
  '/:id/market-data',
  validate({ params: stockIdParamSchema, query: getMarketDataQuerySchema }),
  getStockMarketDataHistory
);

/**
 * @openapi
 * /api/v1/stocks/{id}/features:
 *   get:
 *     summary: Get stock fundamentals history
 *     description: Returns fundamentals history newest first. Excludes technical_indicators JSON unless ?full=true. Reads only from own DB.
 *     tags:
 *       - Stocks
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stock UUID
 *       - in: query
 *         name: full
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include technical_indicators JSON payload
 *     responses:
 *       200:
 *         description: Historical features retrieved successfully
 *       404:
 *         description: Stock not found
 *       400:
 *         description: Validation error
 */
router.get(
  '/:id/features',
  validate({ params: stockIdParamSchema, query: getFeaturesQuerySchema }),
  getStockFeaturesHistory
);

export default router;
