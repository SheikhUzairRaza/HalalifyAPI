import { sequelize, Stock, Feature, ComplianceCheck } from '../models/index.js';
import { ApiError } from '../utils/index.js';
import {
  DEBT_LIMIT,
  PROHIBITED_SECTORS,
  STRICT_EXTRA_SECTORS,
  TICKER_BLOCKLIST,
} from '../config/compliance.js';

// Pre-normalized sets (trimmed and lowercased) for case-insensitive matching
const PROHIBITED_SECTOR_SET = new Set(
  PROHIBITED_SECTORS.map((s) => s.trim().toLowerCase())
);
const STRICT_EXTRA_SECTOR_SET = new Set(
  STRICT_EXTRA_SECTORS.map((s) => s.trim().toLowerCase())
);
const TICKER_BLOCKLIST_SET = new Set(
  TICKER_BLOCKLIST.map((t) => t.trim().toLowerCase())
);

/**
 * Step 8: Evaluate a single stock's Shariah compliance for a given strictness mode
 * @param {object} stock - Stock record ({ id, ticker, sector })
 * @param {object|null} features - Latest Feature record ({ debt_to_assets })
 * @param {'standard'|'strict'} mode - Screening strictness mode
 * @returns {object} ComplianceCheck attributes ready for DB upsert
 */
export const evaluateStock = (stock, features, mode = 'standard') => {
  const normalizedMode = String(mode).trim().toLowerCase() === 'strict' ? 'strict' : 'standard';
  const rawSector = stock?.sector ? String(stock.sector).trim() : '';
  const rawTicker = stock?.ticker ? String(stock.ticker).trim().toUpperCase() : '';
  const rawDebt = features?.debt_to_assets;

  const hasValidSector = rawSector.length > 0;
  const hasValidDebt =
    rawDebt !== null &&
    rawDebt !== undefined &&
    String(rawDebt).trim() !== '' &&
    !Number.isNaN(Number(rawDebt));

  // 1. sector ya debt_to_assets missing -> is_compliant = false, reason "Insufficient data", stop
  if (!hasValidSector || !hasValidDebt) {
    return {
      stock_id: stock?.id || null,
      strictness_mode: normalizedMode,
      is_compliant: false,
      sector_pass: false,
      debt_pass: false,
      reason: 'Insufficient data',
      debt_to_assets_used: hasValidDebt ? Number(Number(rawDebt).toFixed(4)) : null,
      sector_used: hasValidSector ? rawSector : null,
      checked_at: new Date(),
    };
  }

  const normalizedSector = rawSector.toLowerCase();
  const normalizedTicker = rawTicker.toLowerCase();
  const debtToAssets = Number(rawDebt);
  const debtLimit = DEBT_LIMIT[normalizedMode] ?? DEBT_LIMIT.standard;

  // 2. sector prohibited (strict mein STRICT_EXTRA bhi) ya ticker blocklist mein -> sector_pass = false
  let sectorPass = true;
  let sectorFailReason = null;

  if (PROHIBITED_SECTOR_SET.has(normalizedSector)) {
    sectorPass = false;
    sectorFailReason = `Prohibited sector (${rawSector})`;
  } else if (normalizedMode === 'strict' && STRICT_EXTRA_SECTOR_SET.has(normalizedSector)) {
    sectorPass = false;
    sectorFailReason = `Prohibited sector in strict mode (${rawSector})`;
  } else if (TICKER_BLOCKLIST_SET.has(normalizedTicker)) {
    sectorPass = false;
    sectorFailReason = `Prohibited business activity for ticker ${rawTicker} (${rawSector})`;
  }

  // 3. debt_to_assets >= DEBT_LIMIT[mode] -> debt_pass = false
  let debtPass = true;
  let debtFailReason = null;

  if (debtToAssets >= debtLimit) {
    debtPass = false;
    debtFailReason = `Debt-to-assets (${debtToAssets.toFixed(4)}) exceeds ${normalizedMode} limit (${debtLimit.toFixed(2)})`;
  }

  // 4. is_compliant = sector_pass AND debt_pass
  const isCompliant = sectorPass && debtPass;

  // 5. Saaf reason likho. Dono rules fail hon to dono reasons shamil karo.
  let reason;
  if (isCompliant) {
    reason = `Compliant: Sector (${rawSector}) is permissible and debt-to-assets (${debtToAssets.toFixed(4)}) is below ${normalizedMode} limit (${debtLimit.toFixed(2)}).`;
  } else {
    const reasons = [];
    if (!sectorPass && sectorFailReason) reasons.push(sectorFailReason);
    if (!debtPass && debtFailReason) reasons.push(debtFailReason);
    reason = `Non-compliant: ${reasons.join('; ')}.`;
  }

  return {
    stock_id: stock.id,
    strictness_mode: normalizedMode,
    is_compliant: isCompliant,
    sector_pass: sectorPass,
    debt_pass: debtPass,
    reason,
    debt_to_assets_used: Number(debtToAssets.toFixed(4)),
    sector_used: rawSector,
    checked_at: new Date(),
  };
};

/**
 * Step 9: Run compliance screening across all active stocks for both 'standard' and 'strict' modes
 * Upserts on (stock_id, strictness_mode) and never stops on a single stock failure
 * @returns {Promise<{ evaluated: number, compliant: number, non_compliant: number, insufficient_data: number, by_mode: object }>}
 */
export const runComplianceCheck = async () => {
  const activeStocks = await Stock.findAll({
    where: { is_active: true },
    order: [['ticker', 'ASC']],
  });

  const modes = ['standard', 'strict'];
  let evaluated = 0;
  let compliant = 0;
  let non_compliant = 0;
  let insufficient_data = 0;

  const by_mode = {
    standard: { evaluated: 0, compliant: 0, non_compliant: 0, insufficient_data: 0 },
    strict: { evaluated: 0, compliant: 0, non_compliant: 0, insufficient_data: 0 },
  };

  for (const stock of activeStocks) {
    try {
      // Fetch latest features row for this stock
      const latestFeature = await Feature.findOne({
        where: { stock_id: stock.id },
        order: [['date', 'DESC']],
      });

      const recordsToUpsert = [];

      for (const mode of modes) {
        const checkResult = evaluateStock(stock, latestFeature, mode);
        recordsToUpsert.push(checkResult);

        evaluated++;
        by_mode[mode].evaluated++;

        if (checkResult.reason === 'Insufficient data') {
          insufficient_data++;
          non_compliant++;
          by_mode[mode].insufficient_data++;
          by_mode[mode].non_compliant++;
        } else if (checkResult.is_compliant) {
          compliant++;
          by_mode[mode].compliant++;
        } else {
          non_compliant++;
          by_mode[mode].non_compliant++;
        }
      }

      await ComplianceCheck.bulkCreate(recordsToUpsert, {
        updateOnDuplicate: [
          'is_compliant',
          'sector_pass',
          'debt_pass',
          'reason',
          'debt_to_assets_used',
          'sector_used',
          'checked_at',
          'updated_at',
        ],
      });
    } catch (err) {
      console.error(`[COMPLIANCE ERROR] Failed for stock ${stock.ticker}:`, err.message);
    }
  }

  return {
    evaluated,
    compliant,
    non_compliant,
    insufficient_data,
    by_mode,
  };
};

/**
 * Step 11: GET /api/v1/stocks/:id/compliance?mode=standard
 * Returns compliance check row for stock in requested mode (default 'standard').
 * Wrong id -> 404. Never evaluated -> compliance: null (not 500).
 * @param {string} id - Stock UUID
 * @param {string} [mode='standard'] - 'standard' or 'strict'
 */
export const getStockComplianceService = async (id, mode = 'standard') => {
  const stock = await Stock.findByPk(id, {
    attributes: ['id', 'ticker', 'name', 'sector'],
  });

  if (!stock) {
    throw new ApiError(404, `Stock not found with ID: ${id}`);
  }

  const strictnessMode =
    String(mode || 'standard').trim().toLowerCase() === 'strict' ? 'strict' : 'standard';

  const checkRow = await ComplianceCheck.findOne({
    where: {
      stock_id: stock.id,
      strictness_mode: strictnessMode,
    },
    attributes: [
      'is_compliant',
      'sector_pass',
      'debt_pass',
      'reason',
      'debt_to_assets_used',
      'sector_used',
      'checked_at',
    ],
  });

  return {
    stock_id: stock.id,
    ticker: stock.ticker,
    name: stock.name,
    strictness_mode: strictnessMode,
    compliance: checkRow
      ? {
          is_compliant: checkRow.is_compliant,
          sector_pass: checkRow.sector_pass,
          debt_pass: checkRow.debt_pass,
          reason: checkRow.reason,
          debt_to_assets_used: checkRow.debt_to_assets_used,
          sector_used: checkRow.sector_used,
          checked_at: checkRow.checked_at,
        }
      : null,
  };
};

/**
 * Step 12: GET /api/v1/compliance/summary?mode=standard
 * Uses SQL GROUP BY queries to aggregate compliance counts and non-compliant breakdown by reason.
 * @param {string} [mode='standard'] - 'standard' or 'strict'
 */
export const getComplianceSummaryService = async (mode = 'standard') => {
  const strictnessMode =
    String(mode || 'standard').trim().toLowerCase() === 'strict' ? 'strict' : 'standard';

  // 1. GROUP BY status to compute total, compliant, non_compliant, and insufficient_data
  const [statusRows] = await sequelize.query(
    `
    SELECT
      CASE
        WHEN reason = 'Insufficient data' THEN 'insufficient_data'
        WHEN is_compliant = 1 THEN 'compliant'
        ELSE 'non_compliant'
      END AS status_bucket,
      COUNT(*) AS count
    FROM compliance_checks
    WHERE strictness_mode = :mode
    GROUP BY status_bucket
    `,
    { replacements: { mode: strictnessMode } }
  );

  let compliant = 0;
  let nonCompliantOnly = 0;
  let insufficientData = 0;

  for (const row of statusRows) {
    const cnt = Number(row.count) || 0;
    if (row.status_bucket === 'compliant') compliant += cnt;
    else if (row.status_bucket === 'insufficient_data') insufficientData += cnt;
    else nonCompliantOnly += cnt;
  }

  const total = compliant + nonCompliantOnly + insufficientData;
  const non_compliant = nonCompliantOnly;

  // 2. GROUP BY failure category for non-compliant stocks
  const [reasonRows] = await sequelize.query(
    `
    SELECT
      CASE
        WHEN reason = 'Insufficient data' THEN 'Insufficient data'
        WHEN sector_pass = 0 AND debt_pass = 0 THEN 'Both sector and debt ratio failed'
        WHEN sector_pass = 0 THEN 'Sector not permitted'
        WHEN debt_pass = 0 THEN 'Debt ratio exceeded'
        ELSE reason
      END AS reason,
      COUNT(*) AS count
    FROM compliance_checks
    WHERE strictness_mode = :mode AND is_compliant = 0
    GROUP BY
      CASE
        WHEN reason = 'Insufficient data' THEN 'Insufficient data'
        WHEN sector_pass = 0 AND debt_pass = 0 THEN 'Both sector and debt ratio failed'
        WHEN sector_pass = 0 THEN 'Sector not permitted'
        WHEN debt_pass = 0 THEN 'Debt ratio exceeded'
        ELSE reason
      END
    ORDER BY count DESC
    `,
    { replacements: { mode: strictnessMode } }
  );

  const by_reason = reasonRows.map((r) => ({
    reason: r.reason,
    count: Number(r.count) || 0,
  }));

  return {
    mode: strictnessMode,
    total,
    compliant,
    non_compliant,
    insufficient_data: insufficientData,
    by_reason,
  };
};

export default {
  evaluateStock,
  runComplianceCheck,
  getStockComplianceService,
  getComplianceSummaryService,
};
