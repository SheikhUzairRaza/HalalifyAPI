import { sequelize } from '../config/db.js';
import {
  syncStockProfile,
  syncMarketData,
  syncFundamentalRatios,
} from '../services/stockData.service.js';
import { runIngestionCycle } from '../services/scheduler.service.js';

const testStockModule = async () => {
  try {
    console.log('🧪 Connecting to MySQL database...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ Database connected & synchronized.\n');

    const testTicker = 'AAPL';

    // Test 1: Sync Stock Profile
    console.log(`--- [1] Testing syncStockProfile('${testTicker}') ---`);
    const profile = await syncStockProfile(testTicker);
    console.log('Result Stock Profile:', {
      ticker: profile.ticker,
      name: profile.name,
      sector: profile.sector,
      exchange: profile.exchange,
    });

    // Test 2: Sync Daily Price Data
    console.log(`\n--- [2] Testing syncMarketData('${testTicker}') ---`);
    const dailyPrice = await syncMarketData(testTicker);
    console.log('Result Market Price (Daily):', dailyPrice);

    // Test 3: Sync Historical Price Data (Backfill)
    console.log(`\n--- [3] Testing syncMarketData('${testTicker}', historical range) ---`);
    const historicalPrices = await syncMarketData(testTicker, {
      from: '2026-01-01',
      to: '2026-01-15',
    });
    console.log(`Synced ${historicalPrices.length} historical candle days.`);

    // Test 4: Sync Fundamental Ratios
    console.log(`\n--- [4] Testing syncFundamentalRatios('${testTicker}') ---`);
    const features = await syncFundamentalRatios(testTicker);
    console.log('Result Features/Ratios:', {
      ticker: features.ticker,
      pe_ratio: features.pe_ratio,
      debt_to_equity: features.debt_to_equity,
      market_cap: features.market_cap,
      has_raw_json: Boolean(features.raw_ratios),
    });

    // Test 5: Full Ingestion Cycle Runner
    console.log('\n--- [5] Testing runIngestionCycle() ---');
    await runIngestionCycle();

    console.log('\n🎉 ALL STOCKS DATA MODULE TESTS PASSED!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Test Execution Error:', error);
    process.exit(1);
  }
};

testStockModule();

