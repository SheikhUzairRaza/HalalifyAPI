import { z } from 'zod';
import { tickerSchema } from './stock.validation.js';

/**
 * Validation schema for triggering market data refresh
 */
export const refreshMarketDataSchema = z.object({
  symbols: z
    .union([
      z.array(tickerSchema),
      z.string().trim().transform((val) =>
        val
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
      ),
    ])
    .optional(),
  force: z.boolean().optional().default(false),
}).optional().default({});

/**
 * Validation schema for triggering fundamentals features refresh
 */
export const refreshFundamentalsSchema = z.object({
  symbols: z
    .union([
      z.array(tickerSchema),
      z.string().trim().transform((val) =>
        val
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
      ),
    ])
    .optional(),
  force: z.boolean().optional().default(false),
}).optional().default({});

export default {
  refreshMarketDataSchema,
  refreshFundamentalsSchema,
};
