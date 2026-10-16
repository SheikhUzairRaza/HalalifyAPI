import { asyncHandler, ApiResponse } from '../utils/index.js';
import { refreshMarketData } from '../services/marketData.service.js';
import { refreshFundamentals } from '../services/fundamentals.service.js';
import { runComplianceCheck } from '../services/compliance.service.js';

/**
 * @desc    Manually trigger market data refresh for active stocks
 * @route   POST /api/v1/admin/stocks/refresh
 * @access  Admin / Public
 */
export const refreshStocksMarketData = asyncHandler(async (req, res) => {
  const symbols = req.body?.symbols;
  const result = await refreshMarketData(symbols);

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
 * @desc    Manually trigger fundamental metrics refresh for active stocks
 * @route   POST /api/v1/admin/features/refresh
 * @access  Admin / Public
 */
export const refreshStocksFeatures = asyncHandler(async (req, res) => {
  const symbols = req.body?.symbols;
  const result = await refreshFundamentals(symbols);

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

/**
 * @desc    Run Shariah compliance check for all active stocks across standard & strict modes
 * @route   POST /api/v1/admin/compliance/run
 * @access  Private (Admin / Authenticated)
 */
export const runCompliance = asyncHandler(async (req, res) => {
  const result = await runComplianceCheck();

  return new ApiResponse(
    200,
    {
      evaluated: result.evaluated,
      compliant: result.compliant,
      non_compliant: result.non_compliant,
      insufficient_data: result.insufficient_data,
      by_mode: result.by_mode,
    },
    `Compliance check completed: ${result.evaluated} evaluations (${result.compliant} compliant, ${result.non_compliant} non-compliant, ${result.insufficient_data} insufficient data)`
  ).send(res);
});

export default {
  refreshStocksMarketData,
  refreshStocksFeatures,
  runCompliance,
};
