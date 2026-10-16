import { Router } from 'express';
import {
  refreshStocksMarketData,
  refreshStocksFeatures,
  runCompliance,
} from '../controllers/admin.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  refreshMarketDataSchema,
  refreshFundamentalsSchema,
} from '../validations/admin.validation.js';

const router = Router();

/**
 * @openapi
 * /api/v1/admin/stocks/refresh:
 *   post:
 *     summary: Refresh latest market data for all active stocks
 *     description: Fetches latest bars from Alpaca for all active stocks and upserts them into the market_data table.
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               symbols:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["AAPL", "MSFT"]
 *                 description: Optional list of tickers to refresh (defaults to all active)
 *               force:
 *                 type: boolean
 *                 default: false
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
 *       400:
 *         description: Validation error
 */
router.post('/stocks/refresh', validate(refreshMarketDataSchema), refreshStocksMarketData);

/**
 * @openapi
 * /api/v1/admin/features/refresh:
 *   post:
 *     summary: Refresh fundamental financial metrics for all active stocks
 *     description: Iterates through active stocks, calls Finnhub metric endpoint for each ticker, captures the metric property, and upserts them into the features table.
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               symbols:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["AAPL", "MSFT"]
 *                 description: Optional list of tickers to refresh (defaults to all active)
 *               force:
 *                 type: boolean
 *                 default: false
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
 *       400:
 *         description: Validation error
 */
router.post('/features/refresh', validate(refreshFundamentalsSchema), refreshStocksFeatures);

/**
 * @openapi
 * /api/v1/admin/compliance/run:
 *   post:
 *     summary: Run Shariah compliance screening across all active stocks
 *     description: Evaluates all active stocks against both 'standard' and 'strict' Shariah compliance rules using their latest features row and upserts into compliance_checks.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compliance screening completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         evaluated:
 *                           type: integer
 *                           example: 72
 *                         compliant:
 *                           type: integer
 *                           example: 32
 *                         non_compliant:
 *                           type: integer
 *                           example: 40
 *                         insufficient_data:
 *                           type: integer
 *                           example: 0
 *       401:
 *         description: Unauthorized - missing or invalid access token
 */
router.post('/compliance/run', protect, runCompliance);

export default router;
