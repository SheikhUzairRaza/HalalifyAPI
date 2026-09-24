<<<<<<< Updated upstream
# External API Research — Halalfy API Research Work
=======
# External API Research — Halalfy
>>>>>>> Stashed changes

This document covers all external API endpoints researched and validated for the Halalfy backend, their purpose, and how data flows into the database. Use this as the reference when implementing the `data_ingestion` module.

---

## 1. Overview

Halalfy uses **two external data sources**, each responsible for a different kind of data:

| Source            | Responsible for                                                         |
| ----------------- | ----------------------------------------------------------------------- |
| **Alpaca**  | Live stock prices, historical price data, market status, asset metadata |
| **Finnhub** | Company fundamentals — sector, PE ratio, debt ratio, financial ratios  |

These two sources are combined because no single free API provides both genuinely real-time price data *and* full company fundamentals.

---

## 2. Alpaca Endpoints

**Base URLs:**

- Trading/Account API: `https://paper-api.alpaca.markets`
- Market Data API: `https://data.alpaca.markets`

**Auth (all Alpaca requests):**

```
Headers:
  APCA-API-KEY-ID: <your key>
  APCA-API-SECRET-KEY: <your secret>
```

### 2.1 `GetAccountInfo`

```
GET https://paper-api.alpaca.markets/v2/account
```

Verifies API keys and account status. Not called by the app in normal operation — used once during setup/testing.

### 2.2 `GetMarketClock`

```
GET https://paper-api.alpaca.markets/v2/clock
```

Returns whether the market is currently open (`is_open: true/false`), plus next open/close times. Called by the scheduler before every price-refresh cycle — if the market is closed, the cycle is skipped to avoid wasted API calls.

### 2.3 `GetTradingCalendar`

```
GET https://paper-api.alpaca.markets/v2/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD
```

Returns actual trading days in a date range (excludes weekends/holidays). Used by the backtesting module to align historical data correctly.

### 2.4 `GetAssetInfo`

```
GET https://paper-api.alpaca.markets/v2/assets/{symbol}
```

Returns basic metadata for a stock: company name, exchange, tradability status. Called once when a new stock is added to the tracked universe — populates the `stocks` table.

### 2.5 `GetLatestSnapshot`

```
GET https://data.alpaca.markets/v2/stocks/{symbol}/snapshot
```

Returns the latest trade, quote, and minute bar for a single stock in one call. Useful for testing / single-stock detail views.

### 2.6 `GetLatestBarsMultiple`

```
GET https://data.alpaca.markets/v2/stocks/bars/latest?symbols=AAPL,MSFT,TSLA
```

Returns the latest minute bar for multiple stocks in one call. **This is the primary endpoint for the dashboard/scheduler** — refreshing all tracked stocks' prices in a single request instead of one call per stock.

### 2.7 `GetHistoricalBars`

```
GET https://data.alpaca.markets/v2/stocks/bars?symbols=AAPL&timeframe=1Day&start=YYYY-MM-DD&end=YYYY-MM-DD
```

Returns historical OHLCV bars for a date range. Used for backfilling price history and for the backtesting engine. `timeframe` can be `1Min`, `1Hour`, `1Day`, etc.

**Note:** Alpaca does **not** provide company fundamentals (PE ratio, debt ratio, sector) — confirmed via Alpaca's own community forum. Fundamentals must come from Finnhub.

---

## 3. Finnhub Endpoints

**Base URL:** `https://finnhub.io/api/v1`
**Auth:** API key passed as a `token` query parameter on every request.

### 3.1 `GetCompanyProfile`

```
GET https://finnhub.io/api/v1/stock/profile2?symbol=AAPL&token=YOUR_KEY
```

Returns company name, sector/industry (`finnhubIndustry`), exchange, market capitalization. Called once when a stock is added — populates the `sector` field on the `stocks` table, which feeds the compliance screening logic.

### 3.2 `GetBasicFinancials`

```
GET https://finnhub.io/api/v1/stock/metric?symbol=AAPL&metric=all&token=YOUR_KEY
```

Returns two sections in the response:

- **`metric`** — the current/latest values (PE ratio, debt-to-equity ratio, ROE, margins, beta, 52-week high/low, etc.) → **this is the only part the app uses.**
- **`series`** — full historical time series for every metric going back decades → **not used, ignore/discard this on parse.** Including it would bloat storage and processing for no benefit to the FYP scope.

Only pull fields you actually need from `metric`, e.g.:

| Field                               | Use                                  |
| ----------------------------------- | ------------------------------------ |
| `peBasicExclExtraTTM` / `peTTM` | PE ratio                             |
| `totalDebt/totalEquityQuarterly`  | Debt ratio (compliance + ML feature) |
| `roeTTM`, `roaTTM`              | Profitability ratios (ML feature)    |
| `marketCapitalization`            | Company size (ML feature)            |
| `beta`                            | Volatility measure (ML feature)      |

**Refresh cadence:** Company fundamentals only change when a company files a new quarterly/annual report — refreshing this weekly or monthly is sufficient. Refreshing more often wastes API quota for no new data.

---

## 4. Postman Collection Structure

```
HalalifyAPI (collection)
│
├── AlpacaAccount (folder)
│   ├── GetAccountInfo
│   ├── GetMarketClock
│   ├── GetTradingCalendar
│   └── GetAssetInfo
│
├── AlpacaMarketData (folder)
│   ├── GetLatestSnapshot
│   ├── GetLatestBarsMultiple
│   └── GetHistoricalBars
│
└── FinnhubFundamentals (folder)
    ├── GetCompanyProfile
    └── GetBasicFinancials
```

**Environment variables:**

| Variable          | Example value            |
| ----------------- | ------------------------ |
| `symbol`        | `AAPL`                 |
| `symbols`       | `AAPL,MSFT,TSLA`       |
| `start_date`    | `2026-01-01`           |
| `end_date`      | `2026-09-01`           |
| `finnhub_token` | *(your Finnhub key)*   |
| `apca_key`      | *(your Alpaca Key ID)* |
| `apca_secret`   | *(your Alpaca Secret)* |

---

## 5. End-to-End Data Flow

```
User adds a stock
      │
      ▼
GetAssetInfo (Alpaca) ─────────► stocks table: name, exchange
GetCompanyProfile (Finnhub) ───► stocks table: sector
      │
      ▼
SCHEDULED JOB — FAST (every few minutes, market hours only)
  1. Call GetMarketClock — is_open?
  2. If yes → GetLatestBarsMultiple (all tracked symbols)
  3. Upsert into market_data table
      │
      ▼
SCHEDULED JOB — SLOW (weekly/monthly)
  1. GetBasicFinancials (per symbol)
  2. Parse only the `metric` object
  3. Upsert into features table
      │
      ▼
ML Classification reads features + market_data
      → classifications table (return/risk class)
      │
      ▼
Compliance Screening reads sector + debt_ratio
      → compliance_checks table (is_compliant)
      │
      ▼
Portfolio Optimization reads classifications + compliance_checks
      → portfolios + holdings tables
      │
      ▼
Backtesting reads holdings + GetHistoricalBars (Alpaca)
      → backtests table
      │
      ▼
Internal REST API serves everything above to the dashboard
(dashboard reads only from the DB — never calls Alpaca/Finnhub directly)
```

---

## 6. Storing "Real-Time" Data Correctly

"Real-time" does **not** mean inserting a new row on every fetch. The correct pattern:

1. **Background scheduler**, not per-request calls. A job runs on an interval (respecting `GetMarketClock`), not triggered by user page loads.
2. **Upsert, don't insert blindly.** The schema uses a `UNIQUE (stock_id, date)` constraint on `market_data` and `features`. Each fetch either updates today's existing row or inserts a new one if today's row doesn't exist yet:

```sql
INSERT INTO market_data (stock_id, date, open, high, low, close, volume)
VALUES (?, ?, ?, ?, ?, ?, ?)
ON CONFLICT (stock_id, date)
DO UPDATE SET high = EXCLUDED.high, low = EXCLUDED.low,
              close = EXCLUDED.close, volume = EXCLUDED.volume;
```

3. **Dashboard reads from the database only.** The frontend/API layer never calls Alpaca or Finnhub directly on a page load — it reads the latest row already stored by the scheduler. This keeps dashboard load times fast (NFR1: under 3 seconds) and keeps API usage well under rate limits.
4. **Different refresh rates for different data.** Price data (`market_data`) refreshes frequently; fundamentals (`features`) refresh far less often, since the underlying values don't change until a new quarterly filing.

---

## 7. Summary Table

| # | Endpoint              | Source  | Feeds table                | Refresh cadence   |
| - | --------------------- | ------- | -------------------------- | ----------------- |
| 1 | GetAccountInfo        | Alpaca  | — (setup only)            | Once              |
| 2 | GetMarketClock        | Alpaca  | — (scheduler gate)        | Every cycle       |
| 3 | GetTradingCalendar    | Alpaca  | — (backtest helper)       | On demand         |
| 4 | GetAssetInfo          | Alpaca  | `stocks`                 | Once per stock    |
| 5 | GetLatestSnapshot     | Alpaca  | `market_data`            | On demand         |
| 6 | GetLatestBarsMultiple | Alpaca  | `market_data`            | Every few minutes |
| 7 | GetHistoricalBars     | Alpaca  | `market_data` (backfill) | On demand         |
| 8 | GetCompanyProfile     | Finnhub | `stocks`                 | Once / rarely     |
| 9 | GetBasicFinancials    | Finnhub | `features`               | Weekly/monthly    |
