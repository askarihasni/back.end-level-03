import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config } from '../src/config/env.js';
import { runSqlFile } from './sql-runner.js';

const { Client } = pg;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(scriptDir, '..');
const seedFile = path.resolve(serverRoot, '..', 'database', '005_seed.sql');

async function main() {
  const client = new Client({
    connectionString: config.databaseUrl,
    ssl: config.dbSsl ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  try {
    const tableCheck = await client.query(`SELECT to_regclass('public.products') AS products`);
    if (!tableCheck.rows[0].products) {
      throw new Error('Schema not found. Run "npm run db:init" before seeding.');
    }

    console.log('[db-seed] Inserting development data (existing rows are preserved)...');
    await runSqlFile(client, seedFile);

    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*)::INTEGER FROM users) AS users,
        (SELECT COUNT(*)::INTEGER FROM products) AS products,
        (SELECT COUNT(*)::INTEGER FROM orders) AS orders,
        (SELECT COUNT(*)::INTEGER FROM order_items) AS order_items
    `);
    const c = counts.rows[0];
    console.log(
      `[db-seed] Done. users=${c.users}, products=${c.products}, orders=${c.orders}, order_items=${c.order_items}`
    );
    console.log('[db-seed] Development admin: admin@shop.pk / Admin@12345');
    console.log('[db-seed] Development customer: ayesha@example.com / Customer@123');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('[db-seed] Failed:', error.message);
  process.exit(1);
});
