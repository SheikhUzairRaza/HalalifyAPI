import cron from 'node-cron';
import { Stock } from '../models/index.js';
import {
  syncStockProfile,
  syncMarketData,
  syncFundamentalRatios,
} from './stockData.service.js';

/**
 * Runs a complete data ingestion cycle across all active tracked stocks
 */
export const runIngestionCycle = async () => {
  console.log('🚀 [Data Ingestion Cycle] Starting periodic stock data refresh...');

  try {
    const trackedStocks = await Stock.findAll({ where: { is_active: true } });

    if (!trackedStocks || trackedStocks.length === 0) {
      console.log('ℹ️ [Data Ingestion Cycle] No active tracked stocks found in database.');
      return;
    }

    console.log(`📋 [Data Ingestion Cycle] Found ${trackedStocks.length} tracked stock(s). Starting paced data sync...`);

    for (const stock of trackedStocks) {
      const ticker = stock.ticker;
      console.log(`\n⏳ [Data Ingestion Cycle] Syncing data for ticker: ${ticker}...`);

      // 1. Sync Profile Info
      try {
        await syncStockProfile(ticker);
      } catch (err) {
        console.warn(`⚠️ Profile sync skipped for ${ticker}: ${err.message}`);
      }

      // 2. Sync Market Price Data
      try {
        await syncMarketData(ticker);
      } catch (err) {
        console.warn(`⚠️ Market price sync skipped for ${ticker}: ${err.message}`);
      }

      // 3. Sync Fundamental Ratios
      try {
        await syncFundamentalRatios(ticker);
      } catch (err) {
        console.warn(`⚠️ Ratio sync skipped for ${ticker}: ${err.message}`);
      }
    }

    console.log('\n🎉 [Data Ingestion Cycle] Full ingestion cycle completed successfully.');
  } catch (error) {
    console.error('💥 [Data Ingestion Cycle Error] Failed to complete ingestion cycle:', error.message);
  }
};

/**
 * Initializes cron schedule for background stock data ingestion
 * @param {string} cronExpression Cron schedule expression (Default: Every day at midnight '0 0 * * *')
 */
export const initIngestionScheduler = (cronExpression = '0 0 * * *') => {
  const schedule = process.env.INGESTION_CRON_SCHEDULE || cronExpression;
  console.log(`⏰ [Scheduler] Ingestion scheduler initialized with schedule: '${schedule}'`);

  cron.schedule(schedule, async () => {
    await runIngestionCycle();
  });
};

