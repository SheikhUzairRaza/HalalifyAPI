import { Router } from 'express';
import { asyncHandler, ApiResponse } from '../utils/index.js';
import authRoutes from './auth.routes.js';

const router = Router();

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     summary: API Health Check
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API is running and operational
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: OK
 */
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    return new ApiResponse(200, { status: 'OK' }, 'Halalfy API is running').send(res);
  })
);

// Mount feature routes
router.use('/auth', authRoutes);

export default router;
