import { z } from 'zod';

/**
 * Reusable ticker symbol schema with formatting and validation
 */
export const tickerSchema = z
  .string({ required_error: 'Ticker is required' })
  .trim()
  .min(1, 'Ticker cannot be empty')
  .max(15, 'Ticker cannot exceed 15 characters')
  .regex(/^[A-Za-z0-9.-]+$/, 'Ticker must only contain alphanumeric characters, hyphens, or dots')
  .transform((val) => val.toUpperCase());

/**
 * Validation schema for adding a single stock
 */
export const createStockSchema = z.object({
  ticker: tickerSchema,
});

/**
 * Validation schema for adding multiple stocks in bulk
 */
export const bulkCreateStockSchema = z.object({
  tickers: z
    .array(tickerSchema, { required_error: 'Tickers array is required' })
    .min(1, 'At least one ticker must be provided')
    .max(100, 'Cannot add more than 100 tickers at once'),
});

/**
 * Validation schema for route params containing a stock ticker (:ticker)
 */
export const stockTickerParamSchema = z.object({
  ticker: tickerSchema,
});

/**
 * Validation schema for route params containing a stock ID (:id)
 */
export const stockIdParamSchema = z.object({
  id: z.string({ required_error: 'Stock ID is required' }).uuid('Invalid stock ID format (UUID expected)'),
});

/**
 * Validation schema for querying/listing stocks with pagination and filters
 */
export const getStocksQuerySchema = z.object({
  search: z.string().trim().max(100, 'Search term cannot exceed 100 characters').optional(),
  sector: z.string().trim().max(100, 'Sector cannot exceed 100 characters').optional(),
  exchange: z.string().trim().max(50, 'Exchange cannot exceed 50 characters').optional(),
  is_active: z
    .preprocess((val) => {
      if (val === 'true' || val === true || val === 1 || val === '1') return true;
      if (val === 'false' || val === false || val === 0 || val === '0') return false;
      return val;
    }, z.boolean())
    .optional(),
  page: z
    .preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1, 'Page must be at least 1').default(1))
    .optional(),
  limit: z
    .preprocess((val) => (val ? Number(val) : 20), z.number().int().min(1).max(100, 'Limit cannot exceed 100').default(20))
    .optional(),
});

/**
 * Validation schema for market data history query parameters (?from=&to=&sort=)
 */
export const getMarketDataQuerySchema = z
  .object({
    from: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'from date must be in YYYY-MM-DD format')
      .optional(),
    to: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'to date must be in YYYY-MM-DD format')
      .optional(),
    sort: z
      .enum(['asc', 'desc'], {
        invalid_type_error: 'sort must be either asc or desc',
      })
      .optional()
      .default('asc'),
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: 'from date must be earlier than or equal to to date',
    path: ['from'],
  });

/**
 * Validation schema for features history query parameters (?full=true)
 */
export const getFeaturesQuerySchema = z.object({
  full: z
    .preprocess((val) => val === 'true' || val === true || val === '1' || val === 1, z.boolean())
    .optional()
    .default(false),
});

/**
 * Validation schema for updating stock details
 */
export const updateStockSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').max(255, 'Name cannot exceed 255 characters').optional(),
  sector: z.string().trim().max(100, 'Sector cannot exceed 100 characters').nullable().optional(),
  exchange: z.string().trim().max(50, 'Exchange cannot exceed 50 characters').nullable().optional(),
  is_active: z.boolean().optional(),
});

export default {
  tickerSchema,
  createStockSchema,
  bulkCreateStockSchema,
  stockTickerParamSchema,
  stockIdParamSchema,
  getStocksQuerySchema,
  getMarketDataQuerySchema,
  getFeaturesQuerySchema,
  updateStockSchema,
};
