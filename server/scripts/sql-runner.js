import { readFile } from 'node:fs/promises';

/**
 * SQL files in this project are self-contained: most contain their own
 * BEGIN/COMMIT. On failure we issue a ROLLBACK so an aborted transaction does
 * not poison the shared client, then rethrow.
 */
export async function runSqlFile(client, filePath) {
  const sql = await readFile(filePath, 'utf8');
  try {
    await client.query(sql);
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback failure; original error is more useful
    }
    throw error;
  }
}
