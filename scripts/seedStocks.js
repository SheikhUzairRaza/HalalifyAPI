import 'dotenv/config';
import { sequelize } from '../src/config/db.js';
import { Stock } from '../src/models/index.js';
import { addStockService } from '../src/services/stock.service.js';

/**
 * Curated list of ~35 stocks across Halal-compliant and non-compliant / high-debt categories
 */
export const SEED_TICKERS = [
  // Tech
  'AAPL', 'MSFT', 'GOOGL', 'NVDA', 'ADBE', 'AMD',
  // Healthcare
  'JNJ', 'PFE', 'MRK',
  // Consumer
  'PG', 'KO', 'PEP', 'WMT', 'COST', 'NKE',
  // Energy / Industrial
  'XOM', 'CVX', 'CAT',
  // Banks
  'JPM', 'BAC', 'GS', 'WFC',
  // Alcohol / Tobacco
  'BUD', 'STZ', 'MO', 'PM',
  // Gambling
  'MGM', 'LVS', 'DKNG',
  // Defense
  'LMT', 'RTX',
  // High debt
  'T', 'VZ', 'CCL',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const seedStocks = async () => {
  console.log('====================================================');
  console.log(`Starting Stock Seeder (${SEED_TICKERS.length} tickers)`);
  console.log('====================================================\n');

  let addedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const failures = [];

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL database.\n');

    for (let i = 0; i < SEED_TICKERS.length; i++) {
      const rawTicker = SEED_TICKERS[i];
      const ticker = rawTicker.trim().toUpperCase();
      const progress = `[${i + 1}/${SEED_TICKERS.length}]`;

      try {
        // 1. Check if ticker already exists in database to skip without hitting external APIs
        const existingStock = await Stock.findOne({ where: { ticker } });

        if (existingStock) {
          console.log(`${progress} ⏭️  SKIPPED: ${ticker} already exists (${existingStock.name})`);
          skippedCount++;
          continue;
        }

        // 2. Run the same logic as POST /api/v1/stocks (Alpaca asset + Finnhub profile2)
        const { stock } = await addStockService(ticker);
        console.log(
          `${progress} ✅ ADDED:   ${stock.ticker} — ${stock.name} | Sector: ${stock.sector || 'N/A'} | Exchange: ${stock.exchange || 'N/A'}`
        );
        addedCount++;
      } catch (err) {
        failedCount++;
        const reason = err?.message || 'Unknown error';
        failures.push({ ticker, reason });
        console.error(`${progress} ❌ FAILED:  ${ticker} — ${reason}`);
      }

      // 3. Wait 1.5 seconds between API calls to respect Finnhub rate limit
      if (i < SEED_TICKERS.length - 1) {
        await sleep(1500);
      }
    }

    console.log('\n====================================================');
    console.log('Stock Seeding Summary');
    console.log('====================================================');
    console.log(`Total Tickers : ${SEED_TICKERS.length}`);
    console.log(`Added         : ${addedCount}`);
    console.log(`Skipped       : ${skippedCount}`);
    console.log(`Failed        : ${failedCount}`);

    if (failures.length > 0) {
      console.log('\nFailed Tickers:');
      failures.forEach((f) => console.log(`  - ${f.ticker}: ${f.reason}`));
    }
    console.log('====================================================');
  } catch (dbErr) {
    console.error('❌ Database connection error:', dbErr.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close().catch(() => {});
  }
};

seedStocks();
