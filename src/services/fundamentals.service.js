import { Stock, Feature } from '../models/index.js';
import { getFinnhubMetrics } from './finnhub.service.js';

/**
 * Fetch fundamental metrics for all active stocks from Finnhub and capture metric property
 * @returns {Promise<{ success: boolean, totalStocks: number, updatedCount: number, data: Array }>}
 */
export const refreshFundamentals = async (filterSymbols = null) => {
  const whereClause = { is_active: true };
  if (filterSymbols && Array.isArray(filterSymbols) && filterSymbols.length > 0) {
    whereClause.ticker = filterSymbols.map((s) => s.toUpperCase());
  }

  // Step 1: Query active stocks from stocks table
  const activeStocks = await Stock.findAll({
    where: whereClause,
    attributes: ['id', 'ticker'],
  });

  if (!activeStocks || activeStocks.length === 0) {
    return {
      success: true,
      totalStocks: 0,
      updatedCount: 0,
      message: 'No active stocks found in database',
      data: [],
    };
  }

  const results = [];
  const today = new Date().toISOString().split('T')[0];

  // Step 2: Loop every active ticker and call Finnhub metric endpoint
  for (const stock of activeStocks) {
    const finnhubData = await getFinnhubMetrics(stock.ticker);
    const metric = finnhubData?.metric || null;
    const series = finnhubData?.series || null;

    if (metric) {
      // Extract key metrics from Finnhub response
      const peRatio = metric.peTTM || metric.peAnnual || metric.peNormalizedAnnual || null;
      const marketCap = metric.marketCapitalization || null;
      const debtRatio = metric['totalDebt/totalEquityQuarterly'] || metric['totalDebt/totalEquityAnnual'] || null;

      // Extract latest quarterly totalDebtToTotalAsset from series.quarterly.totalDebtToTotalAsset (first entry .v)
      const debtToAssetsSeries = series?.quarterly?.totalDebtToTotalAsset;
      const rawDebtToAssets =
        Array.isArray(debtToAssetsSeries) && debtToAssetsSeries.length > 0
          ? debtToAssetsSeries[0]?.v
          : null;
      const debtToAssets =
        rawDebtToAssets !== undefined && rawDebtToAssets !== null ? rawDebtToAssets : null;

      results.push({
        stock_id: stock.id,
        ticker: stock.ticker,
        date: today,
        pe_ratio: peRatio,
        market_cap: marketCap,
        debt_ratio: debtRatio,
        debt_to_assets: debtToAssets,
        metric, // Captured metric property from Finnhub response (series is not stored)
      });
    }

    // Rate-limit safety: 1 second delay between ticker calls
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Step 3: Upsert into features table on (stock_id, date)
  if (results.length > 0) {
    const recordsToUpsert = results.map((r) => ({
      stock_id: r.stock_id,
      date: r.date,
      debt_ratio: r.debt_ratio,
      debt_to_assets: r.debt_to_assets,
      pe_ratio: r.pe_ratio,
      market_cap: r.market_cap,
      technical_indicators: r.metric,
    }));

    await Feature.bulkCreate(recordsToUpsert, {
      updateOnDuplicate: ['debt_ratio', 'debt_to_assets', 'pe_ratio', 'market_cap', 'updated_at'],
    });
  }

  return {
    success: true,
    totalStocks: activeStocks.length,
    upsertedCount: results.length,
    data: results,
  };
};

export default {
  refreshFundamentals,
};
