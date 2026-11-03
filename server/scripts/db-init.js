import { URL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config } from '../src/config/env.js';
import { runSqlFile } from './sql-runner.js';

const { Client } = pg;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(scriptDir, '..');
const databaseDir = path.resolve(serverRoot, '..', 'database');

function databaseNameFromUrl(connectionString) {
  const url = new URL(connectionString);
  const name = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!name) throw new Error('DATABASE_URL does not contain a database name.');
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error('Database name may only contain letters, digits and underscores.');
  }
  return name;
}

function quoteIdentifier(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

async function ensureDatabaseExists() {
  const targetUrl = new URL(config.databaseUrl);
  const dbName = databaseNameFromUrl(config.databaseUrl);
  const adminUrl = new URL(config.databaseUrl);
  adminUrl.pathname = '/postgres';

  const admin = new Client({
    connectionString: adminUrl.toString(),
    ssl: config.dbSsl ? { rejectUnauthorized: false } : undefined,
  });
  await admin.connect();
  try {
    const existing = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (existing.rowCount === 0) {
      await admin.query(`CREATE DATABASE ${quoteIdentifier(dbName)}`);
      console.log(`[db-init] Created database "${dbName}".`);
    } else {
      console.log(`[db-init] Database "${dbName}" already exists - schema will be updated safely.`);
    }
  } finally {
    await admin.end();
  }

  return targetUrl;
}

async function main() {
  await ensureDatabaseExists();

  const client = new Client({
    connectionString: config.databaseUrl,
    ssl: config.dbSsl ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  try {
    const files = ['001_schema.sql', '002_triggers.sql', '003_views.sql', '004_analytics.sql'];
    for (const file of files) {
      const fullPath = path.join(databaseDir, file);
      console.log(`[db-init] Running ${file}...`);
      await runSqlFile(client, fullPath);
    }
    console.log('[db-init] Schema, triggers, views and analytics are ready.');
    console.log('[db-init] Run "npm run db:seed" to load development data (optional).');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('[db-init] Failed:', error.message);
  console.error('[db-init] Check DATABASE_URL, PostgreSQL availability and database CREATE privileges.');
  process.exit(1);
});
