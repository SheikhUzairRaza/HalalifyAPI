import { Router } from 'express';
import { getComplianceSummary } from '../controllers/stock.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { complianceModeQuerySchema } from '../validations/stock.validation.js';

const router = Router();

/**
 * @openapi
 * /api/v1/compliance/summary:
 *   get:
 *     summary: Get Shariah compliance summary across all evaluated stocks
 *     description: Uses SQL GROUP BY queries to return total, compliant, non_compliant, insufficient_data counts and breakdown by_reason for the requested mode (default standard).
 *     tags:
 *       - Compliance
 *     parameters:
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [standard, strict]
 *           default: standard
 *         description: Screening strictness mode (standard or strict)
 *     responses:
 *       200:
 *         description: Compliance summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         mode:
 *                           type: string
 *                           example: standard
 *                         total:
 *                           type: integer
 *                           example: 36
 *                         compliant:
 *                           type: integer
 *                           example: 16
 *                         non_compliant:
 *                           type: integer
 *                           example: 20
 *                         insufficient_data:
 *                           type: integer
 *                           example: 0
 *                         by_reason:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               reason:
 *                                 type: string
 *                                 example: Sector not permitted
 *                               count:
 *                                 type: integer
 *                                 example: 8
 *       400:
 *         description: Validation error
 */
router.get('/summary', validate(complianceModeQuerySchema, 'query'), getComplianceSummary);

export default router;
