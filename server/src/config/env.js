import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Load project-root .env first, then an optional server/.env (server values win
// because dotenv does not override already-defined variables by default).
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(currentDir, '..', '..');
dotenv.config({ path: path.resolve(serverRoot, '..', '.env') });
dotenv.config({ path: path.resolve(serverRoot, '.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not configured. Copy .env.example to .env and set the PostgreSQL connection string.'
  );
}

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (isProduction) {
    throw new Error('JWT_SECRET is required in production and must be at least 32 characters long.');
  }
  jwtSecret = 'development-only-jwt-secret-change-me-32chars';
  if (!isTest) {
    console.warn('[config] JWT_SECRET is not set - using an insecure development fallback.');
  }
}
if (isProduction && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long in production.');
}

const sameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
if (!['lax', 'strict', 'none'].includes(sameSite)) {
  throw new Error('COOKIE_SAMESITE must be one of: lax, strict, none.');
}

const clientOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config = {
  nodeEnv,
  isProduction,
  isTest,
  port: Number(process.env.PORT || 5000),
  databaseUrl,
  clientOrigins,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtIssuer: 'smart-ecommerce-api',
  jwtAudience: 'smart-ecommerce-web',
  cookieSecure: parseBoolean(process.env.COOKIE_SECURE, isProduction),
  cookieSameSite: sameSite,
  dbSsl: parseBoolean(process.env.DB_SSL, false),
  trustProxy: process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : 0,
  authCookieName: 'se_access_token',
  csrfCookieName: 'se_csrf_token',
};
