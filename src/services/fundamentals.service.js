import { Stock, Feature } from '../models/index.js';
import { getFinnhubMetrics } from './finnhub.service.js';

/**
 * Fetch fundamental metrics for all active stocks from Finnhub and capture metric property
 * @returns {Promise<{ success: boolean, totalStocks: number, updatedCount: number, data: Array }>}
 */
export const refreshFundamentals = async () => {
  // Step 1: Query all active stocks from stocks table
  const activeStocks = await Stock.findAll({
    where: { is_active: true },
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
    const metric = await getFinnhubMetrics(stock.ticker);

    if (metric) {
      // Extract key metrics from Finnhub response
      const peRatio = metric.peTTM || metric.peAnnual || metric.peNormalizedAnnual || null;
      const marketCap = metric.marketCapitalization || null;
      const debtRatio = metric['totalDebt/totalEquityQuarterly'] || metric['totalDebt/totalEquityAnnual'] || null;

      results.push({
        stock_id: stock.id,
        ticker: stock.ticker,
        date: today,
        pe_ratio: peRatio,
        market_cap: marketCap,
        debt_ratio: debtRatio,
        metric, // Captured metric property from Finnhub response
      });
    }
  }

  // Step 3: Upsert into features table on (stock_id, date)
  if (results.length > 0) {
    const recordsToUpsert = results.map((r) => ({
      stock_id: r.stock_id,
      date: r.date,
      debt_ratio: r.debt_ratio,
      pe_ratio: r.pe_ratio,
      market_cap: r.market_cap,
      technical_indicators: r.metric,
    }));

    await Feature.bulkCreate(recordsToUpsert, {
      updateOnDuplicate: ['debt_ratio', 'pe_ratio', 'market_cap', 'updated_at'],
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
