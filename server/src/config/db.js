import pg from 'pg';
import { config } from './env.js';

const { Pool, types } = pg;

// BIGINT primary keys and COUNT(*) results are returned as numbers. They stay
// far below Number.MAX_SAFE_INTEGER for this application. NUMERIC money values
// remain strings from pg; services convert them explicitly at the API boundary.
types.setTypeParser(20, (value) => Number.parseInt(value, 10));
// Parse DATE as plain ISO string 'YYYY-MM-DD' to prevent timezone shifting in non-UTC environments
types.setTypeParser(1082, (value) => value);
// Parse name[] (OID 1003) as string array
types.setTypeParser(1003, (value) => (value ? value.replace(/^\{|\}$/g, '').split(',') : []));

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: config.dbSsl ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (error) => {
  console.error('[db] Unexpected idle client error:', error.message);
});

export function query(text, params) {
  return pool.query(text, params);
}

/**
 * Runs a callback with ONE checked-out connection inside a real transaction.
 * The same client is used for every statement. Any thrown error rolls back all
 * changes before the connection is returned to the pool.
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('[db] Rollback failed:', rollbackError.message);
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool.end();
}
