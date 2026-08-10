import { Pool } from 'pg';

/**
 * One pool per process, reused across requests (roadmap 1.7). Next.js keeps the
 * module registry alive between requests, so creating a pool per query would
 * open a connection per render and exhaust the server long before traffic did.
 */
let sharedPool: Pool | null = null;

export function getPool(): Pool {
  sharedPool ??= createPool(requireConnectionString('DATABASE_URL'));
  return sharedPool;
}

/**
 * A pool that is not the shared one — for the migration runner against an
 * explicit target and for integration tests against their scratch database.
 * The caller owns it and must `end()` it.
 */
export function createPool(connectionString: string): Pool {
  return new Pool({ connectionString, max: 10 });
}

export async function closePool(): Promise<void> {
  if (sharedPool === null) return;
  const pool = sharedPool;
  sharedPool = null;
  await pool.end();
}

/**
 * No default on purpose: an unset variable must fail the run rather than fall
 * back to a database that happens to be reachable (testing.md).
 */
export function requireConnectionString(variable: string): string {
  const value = process.env[variable];
  if (value === undefined || value.trim() === '') {
    throw new Error(`${variable} is not set. There is no default — set it explicitly.`);
  }
  return value;
}
