import axios from 'axios';
import { sequelize } from '../src/config/db.js';
import { Stock, MarketData } from '../src/models/index.js';
import { env } from '../src/config/env.js';

const ALPACA_BARS_URL = 'https://data.alpaca.markets/v2/stocks/bars';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Format Date to YYYY-MM-DD in UTC
 * @param {Date} date
 * @returns {string}
 */
const formatDateUTC = (date) => date.toISOString().split('T')[0];

const runBackfill = async () => {
  console.log('====================================================');
  console.log('📊 Starting Historical Market Data Backfill Script');
  console.log('====================================================\n');

  const apiKey = env.alpaca.apiKeyId;
  const apiSecret = env.alpaca.apiSecretKey;

  if (!apiKey || !apiSecret) {
    console.error('❌ Alpaca API credentials missing (APCA_API_KEY_ID / APCA_API_SECRET_KEY).');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database successfully.');

    // 1. Load all active tickers from stocks
    const activeStocks = await Stock.findAll({
      where: { is_active: true },
      attributes: ['id', 'ticker'],
      order: [['ticker', 'ASC']],
    });

    if (!activeStocks.length) {
      console.log('⚠️ No active stocks found in database. Exiting.');
      await sequelize.close();
      process.exit(0);
    }

    const stockMap = new Map();
    const barCounts = new Map();

    for (const stock of activeStocks) {
      const symbol = stock.ticker.trim().toUpperCase();
      stockMap.set(symbol, stock.id);
      barCounts.set(symbol, 0);
    }

    const symbols = Array.from(stockMap.keys()).join(',');

    // Date range: start = 400 calendar days ago, end = yesterday (never overwrite today's row)
    const now = new Date();
    const todayStr = formatDateUTC(now);
    const yesterdayStr = formatDateUTC(new Date(now.getTime() - 1 * MS_PER_DAY));
    const startStr = formatDateUTC(new Date(now.getTime() - 400 * MS_PER_DAY));

    console.log(`📌 Active stocks count : ${activeStocks.length}`);
    console.log(`📅 Date range (UTC)    : ${startStr} -> ${yesterdayStr} (Today: ${todayStr} excluded)\n`);

    // 2 & 3. Call Alpaca GET /v2/stocks/bars and follow next_page_token until null
    let nextPageToken = null;
    let pageNumber = 0;
    let totalBarsUpserted = 0;

    do {
      pageNumber += 1;
      const params = {
        symbols,
        timeframe: '1Day',
        adjustment: 'all',
        feed: 'iex',
        limit: 10000,
        start: startStr,
        end: yesterdayStr,
      };

      if (nextPageToken) {
        params.page_token = nextPageToken;
      }

      console.log(`🔄 Fetching page ${pageNumber}${nextPageToken ? ` (page_token: ${nextPageToken.slice(0, 12)}...)` : ''}...`);

      const response = await axios.get(ALPACA_BARS_URL, {
        params,
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': apiSecret,
          accept: 'application/json',
        },
      });

      const payload = response.data || {};
      const barsBySymbol = payload.bars || {};
      nextPageToken = payload.next_page_token || null;

      const recordsToUpsert = [];
      const fetchedAt = new Date();

      for (const [rawSymbol, symbolBars] of Object.entries(barsBySymbol)) {
        const symbol = rawSymbol.trim().toUpperCase();
        const stockId = stockMap.get(symbol);

        if (!stockId || !Array.isArray(symbolBars)) {
          continue;
        }

        for (const bar of symbolBars) {
          if (!bar || !bar.t) continue;

          const barDate = bar.t.split('T')[0];

          // 5. Never overwrite today's row
          if (barDate >= todayStr) {
            continue;
          }

          recordsToUpsert.push({
            stock_id: stockId,
            date: barDate,
            open: bar.o,
            high: bar.h,
            low: bar.l,
            close: bar.c,
            volume: bar.v ?? 0,
            fetched_at: fetchedAt,
          });

          barCounts.set(symbol, (barCounts.get(symbol) || 0) + 1);
        }
      }

      // 4. Upsert each bar into market_data on (stock_id, date)
      if (recordsToUpsert.length > 0) {
        const CHUNK_SIZE = 2000;
        for (let i = 0; i < recordsToUpsert.length; i += CHUNK_SIZE) {
          const chunk = recordsToUpsert.slice(i, i + CHUNK_SIZE);
          await MarketData.bulkCreate(chunk, {
            updateOnDuplicate: ['open', 'high', 'low', 'close', 'volume', 'fetched_at', 'updated_at'],
          });
        }
        totalBarsUpserted += recordsToUpsert.length;
        console.log(`   ✅ Upserted ${recordsToUpsert.length} bars from page ${pageNumber}.`);
      } else {
        console.log(`   ℹ️ No bars returned on page ${pageNumber}.`);
      }
    } while (nextPageToken !== null);

    // 6. Log counts per ticker. A ticker with 0 bars is logged, not fatal.
    console.log('\n====================================================');
    console.log('📈 Backfill Summary Per Ticker');
    console.log('====================================================');

    let zeroBarTickers = 0;
    for (const [symbol, count] of barCounts.entries()) {
      if (count === 0) {
        zeroBarTickers += 1;
        console.warn(`⚠️  ${symbol.padEnd(6)} : 0 bars (WARNING: No historical bars returned)`);
      } else {
        console.log(`✅ ${symbol.padEnd(6)} : ${count} bars`);
      }
    }

    console.log('----------------------------------------------------');
    console.log(`Total Pages Fetched : ${pageNumber}`);
    console.log(`Total Bars Upserted : ${totalBarsUpserted}`);
    console.log(`Tickers with 0 Bars : ${zeroBarTickers}`);
    console.log('====================================================\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    if (error.response) {
      console.error(
        `❌ Alpaca API Error (${error.response.status}):`,
        JSON.stringify(error.response.data)
      );
    } else {
      console.error('❌ Backfill script failed:', error.message);
    }
    await sequelize.close().catch(() => {});
    process.exit(1);
  }
};

runBackfill();
