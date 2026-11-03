import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { URL } from 'node:url';
import dotenv from 'dotenv';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(serverRoot, '..');

dotenv.config({ path: path.resolve(projectRoot, '.env') });
dotenv.config({ path: path.resolve(serverRoot, '.env') });

function resolveTestUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  if (!process.env.DATABASE_URL) {
    throw new Error('Set DATABASE_URL and/or TEST_DATABASE_URL in .env before running tests.');
  }
  const url = new URL(process.env.DATABASE_URL);
  const name = decodeURIComponent(url.pathname.replace(/^\//, ''));
  url.pathname = `/${name.endsWith('_test') ? name : `${name}_test`}`;
  return url.toString();
}

const testDatabaseUrl = resolveTestUrl();

console.log('[test] Preparing an isolated test database...');
const preparation = spawnSync(process.execPath, ['scripts/prepare-test-db.js'], {
  cwd: serverRoot,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'test', TEST_DATABASE_URL: testDatabaseUrl },
});

if (preparation.status !== 0) {
  console.error('[test] Test database preparation failed. Aborting.');
  process.exit(preparation.status || 1);
}

console.log('[test] Running server test suite against the test database...');
const run = spawnSync(
  process.execPath,
  ['--test', '--test-concurrency=1', 'tests/*.test.js'],
  {
    cwd: serverRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl,
      // Never let a test run fall back to the development database.
      TEST_DATABASE_URL: testDatabaseUrl,
    },
  }
);

process.exit(run.status === null ? 1 : run.status);
