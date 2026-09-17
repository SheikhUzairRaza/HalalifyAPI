import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file using dotenv package
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Centralized Environment Configuration
 */
export const env = {
  // App & Server
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  // Database Configuration (MySQL)
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'halalfy_db',
  },

  // JWT Authentication Secrets & Expirations
  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET || 'default_access_secret',
    accessExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret',
    refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  },

  // Firebase Admin SDK Credentials
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'halalifyapi',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },

  // Finnhub API Key
  finnhub: {
    apiKey: process.env.FINNHUB_API_KEY || '',
    baseUrl: 'https://finnhub.io/api/v1',
  },

  // Alpaca Markets API Credentials
  alpaca: {
    apiKeyId:
      process.env.APCA_API_KEY_ID ||
      process.env['APCA-API-KEY-ID'] ||
      process.env.ALPACA_API_KEY_ID ||
      '',
    apiSecretKey:
      process.env.APCA_API_SECRET_KEY ||
      process.env['APCA-API-SECRET-KEY'] ||
      process.env.ALPACA_API_SECRET_KEY ||
      '',
    baseUrl: process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets',
  },
};

export default env;

