import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';
import { createPool, requireConnectionString } from './client.ts';
import { DATABASE_URL } from './constants/env-keys.ts';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

/**
 * The ledger is what makes a forward-only runner idempotent: the SQL files stay
 * plain declarative DDL and this table decides what has already run.
 */
const LEDGER = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename   text        NOT NULL PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`;

/**
 * Applies every migration not yet in the ledger, in filename order, each one in
 * a transaction together with its own ledger row — a file that fails halfway
 * leaves neither half a schema nor a ledger row claiming it ran.
 *
 * Returns the filenames applied. Forward-only: there is no `down`, and a file
 * that has run is never edited.
 */
export async function migrate(pool: Pool): Promise<string[]> {
  await pool.query(LEDGER);

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((file) => file.endsWith('.sql'))
    .sort();
  const { rows } = await pool.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations',
  );
  const applied = new Set(rows.map((row) => row.filename));

  const pending = files.filter((file) => !applied.has(file));
  for (const file of pending) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`, {
        cause: error,
      });
    } finally {
      client.release();
    }
  }

  return pending;
}

async function main(): Promise<void> {
  const pool = createPool(requireConnectionString(DATABASE_URL));
  try {
    const applied = await migrate(pool);
    console.log(
      applied.length === 0
        ? 'Schema is up to date; nothing to apply.'
        : `Applied ${applied.length} migration(s):\n  ${applied.join('\n  ')}`,
    );
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
