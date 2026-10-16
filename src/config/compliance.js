/**
 * Shariah Compliance Screening Configuration
 * Rule: Always trim() and toLowerCase() sector & ticker strings before comparison
 */

export const DEBT_LIMIT = {
  standard: 0.33,
  strict: 0.25,
};

// Dono modes mein ban (poora sector saaf taur par haram)
export const PROHIBITED_SECTORS = [
  'Banking',
  'Financial Services',
  'Tobacco',
  'Insurance',
];

// Sirf strict mode mein extra ban
export const STRICT_EXTRA_SECTORS = [
  'Aerospace & Defense',
];

// Jo cheez sector label se pakri nahi jati
export const TICKER_BLOCKLIST = [
  // Alcohol (sector "Beverages" mein KO/PEP bhi hain, isliye sector ban nahi)
  'BUD', 'STZ', 'TAP', 'DEO',
  // Gambling (sector "Hotels, Restaurants & Leisure" mein CCL bhi hai)
  'MGM', 'LVS', 'DKNG', 'WYNN', 'CZR',
  // Defense (standard mode mein sirf ye tickers)
  'LMT', 'RTX', 'NOC', 'GD',
];

export const complianceConfig = {
  DEBT_LIMIT,
  PROHIBITED_SECTORS,
  STRICT_EXTRA_SECTORS,
  TICKER_BLOCKLIST,
};

export default complianceConfig;
