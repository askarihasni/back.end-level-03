import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';
import { runSqlFile } from './sql-runner.js';

const { Client } = pg;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(scriptDir, '..');
const databaseDir = path.resolve(serverRoot, '..', 'database');

dotenv.config({ path: path.resolve(serverRoot, '..', '.env') });
dotenv.config({ path: path.resolve(serverRoot, '.env') });

function deriveTestUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  if (!process.env.DATABASE_URL) {
    throw new Error('Set DATABASE_URL and/or TEST_DATABASE_URL in .env.');
  }
  const url = new URL(process.env.DATABASE_URL);
  const name = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!name) throw new Error('DATABASE_URL has no database name.');
  url.pathname = `/${name.endsWith('_test') ? name : `${name}_test`}`;
  return url.toString();
}

function quoteIdentifier(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

async function main() {
  const testUrl = deriveTestUrl();
  const parsed = new URL(testUrl);
  const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ''));

  if (!/^[A-Za-z0-9_]+$/.test(dbName)) {
    throw new Error('Test database name may only contain letters, digits and underscores.');
  }
  if (!dbName.toLowerCase().includes('test')) {
    throw new Error('Refusing to drop a database whose name does not contain "test".');
  }

  const adminUrl = new URL(testUrl);
  adminUrl.pathname = '/postgres';
  const admin = new Client({
    connectionString: adminUrl.toString(),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  await admin.connect();
  try {
    await admin.query(
      `SELECT pg_terminate_backend(pid)
       FROM pg_stat_activity
       WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [dbName]
    );
    await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(dbName)}`);
    await admin.query(`CREATE DATABASE ${quoteIdentifier(dbName)}`);
    console.log(`[test-db] Created clean test database "${dbName}".`);
  } finally {
    await admin.end();
  }

  const client = new Client({
    connectionString: testUrl,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();
  try {
    for (const file of [
      '001_schema.sql',
      '002_triggers.sql',
      '003_views.sql',
      '004_analytics.sql',
      '005_seed.sql',
    ]) {
      console.log(`[test-db] Applying ${file}...`);
      await runSqlFile(client, path.join(databaseDir, file));
    }
  } finally {
    await client.end();
  }

  console.log('[test-db] Test database is ready.');
}

main().catch((error) => {
  console.error('[test-db] Failed:', error.message);
  process.exit(1);
});
