import { asyncHandler, ApiResponse } from '../utils/index.js';
import { refreshMarketData } from '../services/marketData.service.js';
import { refreshFundamentals } from '../services/fundamentals.service.js';

/**
 * @desc    Manually trigger market data refresh for all active stocks
 * @route   POST /api/v1/admin/stocks/refresh
 * @access  Admin / Public
 */
export const refreshStocksMarketData = asyncHandler(async (req, res) => {
  const result = await refreshMarketData();

  return new ApiResponse(
    200,
    {
      updated: result.updatedCount,
      totalStocks: result.totalStocks,
    },
    `Market data refreshed successfully for ${result.updatedCount} stock(s)`
  ).send(res);
});

/**
 * @desc    Manually trigger fundamental metrics refresh for all active stocks
 * @route   POST /api/v1/admin/features/refresh
 * @access  Admin / Public
 */
export const refreshStocksFeatures = asyncHandler(async (req, res) => {
  const result = await refreshFundamentals();

  return new ApiResponse(
    200,
    {
      updated: result.upsertedCount,
      totalStocks: result.totalStocks,
      data: result.data,
    },
    `Fundamentals refreshed successfully for ${result.upsertedCount} stock(s)`
  ).send(res);
});

export default {
  refreshStocksMarketData,
  refreshStocksFeatures,
};
