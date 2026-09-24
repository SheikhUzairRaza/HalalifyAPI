import { Router } from 'express';
import {
  refreshStocksMarketData,
  refreshStocksFeatures,
} from '../controllers/admin.controller.js';

const router = Router();

/**
 * @openapi
 * /api/v1/admin/stocks/refresh:
 *   post:
 *     summary: Refresh latest market data for all active stocks
 *     description: Fetches latest bars from Alpaca for all active stocks and upserts them into the market_data table.
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: Market data refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         updated:
 *                           type: integer
 *                           example: 5
 *                         totalStocks:
 *                           type: integer
 *                           example: 5
 */
router.post('/stocks/refresh', refreshStocksMarketData);

/**
 * @openapi
 * /api/v1/admin/features/refresh:
 *   post:
 *     summary: Refresh fundamental financial metrics for all active stocks
 *     description: Iterates through active stocks, calls Finnhub metric endpoint for each ticker, captures the metric property, and upserts them into the features table.
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: Fundamental features refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         updated:
 *                           type: integer
 *                           example: 5
 *                         totalStocks:
 *                           type: integer
 *                           example: 5
 *                         data:
 *                           type: array
 *                           items:
 *                             type: object
 */
router.post('/features/refresh', refreshStocksFeatures);

export default router;
