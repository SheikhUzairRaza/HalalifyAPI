import { z } from 'zod';

/**
 * Validation schema for adding a stock
 */
export const createStockSchema = z.object({
  ticker: z.string({ required_error: 'Ticker is required' })
    .trim()
    .min(1, 'Ticker cannot be empty')
    .max(15, 'Ticker cannot exceed 15 characters')
    .transform((val) => val.toUpperCase()),
});

