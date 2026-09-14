import { Router } from 'express';
import { addStock } from '../controllers/stock.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createStockSchema } from '../validations/stock.validation.js';

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
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         stock:
 *                           $ref: '#/components/schemas/Stock'
 *       200:
 *         description: Stock already exists in database
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         stock:
 *                           $ref: '#/components/schemas/Stock'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Stock ticker not found on Alpaca Markets
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Missing Alpaca API credentials or server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/', validate(createStockSchema), addStock);

export default router;

