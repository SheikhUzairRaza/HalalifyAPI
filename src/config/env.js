import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file using dotenv package
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Environment variables validation schema
 */
const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('halalfy_db'),
  ACCESS_TOKEN_SECRET: z.string().default('default_access_secret'),
  ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().default('default_refresh_secret'),
  REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
  FIREBASE_PROJECT_ID: z.string().default('halalifyapi'),
  FIREBASE_CLIENT_EMAIL: z.string().default(''),
  FIREBASE_PRIVATE_KEY: z.string().default(''),
  FINNHUB_API_KEY: z.string().default(''),
  APCA_API_KEY_ID: z.string().optional(),
  APCA_API_SECRET_KEY: z.string().optional(),
  ALPACA_API_KEY_ID: z.string().optional(),
  ALPACA_API_SECRET_KEY: z.string().optional(),
  ALPACA_BASE_URL: z.string().default('https://paper-api.alpaca.markets'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.warn('Environment variables validation warnings:', parsed.error.issues);
}

const safeEnv = parsed.success ? parsed.data : process.env;

/**
 * Centralized Environment Configuration
 */
export const env = {
  // App & Server
  port: safeEnv.PORT || Number(process.env.PORT) || 5000,
  nodeEnv: safeEnv.NODE_ENV || process.env.NODE_ENV || 'development',
  isProduction: (safeEnv.NODE_ENV || process.env.NODE_ENV) === 'production',
  isDevelopment: (safeEnv.NODE_ENV || process.env.NODE_ENV) === 'development',

  // Database Configuration (MySQL)
  db: {
    host: safeEnv.DB_HOST || process.env.DB_HOST || '127.0.0.1',
    port: safeEnv.DB_PORT || Number(process.env.DB_PORT) || 3306,
    user: safeEnv.DB_USER || process.env.DB_USER || 'root',
    password: safeEnv.DB_PASSWORD || process.env.DB_PASSWORD || '',
    name: safeEnv.DB_NAME || process.env.DB_NAME || 'halalfy_db',
  },

  // JWT Authentication Secrets & Expirations
  jwt: {
    accessSecret: safeEnv.ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET || 'default_access_secret',
    accessExpiry: safeEnv.ACCESS_TOKEN_EXPIRY || process.env.ACCESS_TOKEN_EXPIRY || '15m',
    refreshSecret: safeEnv.REFRESH_TOKEN_SECRET || process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret',
    refreshExpiry: safeEnv.REFRESH_TOKEN_EXPIRY || process.env.REFRESH_TOKEN_EXPIRY || '7d',
  },

  // Firebase Admin SDK Credentials
  firebase: {
    projectId: safeEnv.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'halalifyapi',
    clientEmail: safeEnv.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (safeEnv.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },

  // Finnhub API Key
  finnhub: {
    apiKey: safeEnv.FINNHUB_API_KEY || process.env.FINNHUB_API_KEY || '',
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
    baseUrl: safeEnv.ALPACA_BASE_URL || process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets',
  },
};

export default env;
