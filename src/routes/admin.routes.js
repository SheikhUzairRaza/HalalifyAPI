import { Router } from 'express';
import { refreshStocksMarketData } from '../controllers/admin.controller.js';

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

export default router;

