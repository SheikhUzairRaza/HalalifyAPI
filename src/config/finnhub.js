import { DefaultApi } from 'finnhub';

const apiKey = process.env.FINNHUB_API_KEY || '';

if (!apiKey) {
  console.warn('⚠️ FINNHUB_API_KEY is not configured in .env file. Finnhub API requests may fail.');
}

export const finnhubClient = new DefaultApi(apiKey);
export default finnhubClient;

