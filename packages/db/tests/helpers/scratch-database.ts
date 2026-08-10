import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { afterAll, beforeAll } from 'vitest';
import { createPool, requireConnectionString } from '../../src/client.ts';
import { migrate } from '../../src/migrate.ts';

/**
 * Each integration file gets a database of its own, migrated on entry and
 * dropped on exit. A failed run never leaves state that makes the next one pass
 * or fail for the wrong reason (testing.md § Database for tests).
 *
 * Integration tests never touch the development database: TEST_DATABASE_URL
 * names the server, and everything is written to a scratch database beside it.
 */
export function withScratchDatabase(): { pool: () => Pool } {
  const name = `portfolio_test_${randomUUID().replaceAll('-', '')}`;
  let scratch: Pool | null = null;

  beforeAll(async () => {
    await onMaintenanceConnection((admin) => admin.query(`CREATE DATABASE "${name}"`));
    scratch = createPool(scratchUrl(name));
    await migrate(scratch);
  });

  afterAll(async () => {
    await scratch?.end();
    scratch = null;
    await onMaintenanceConnection((admin) =>
      admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`),
    );
  });

  return {
    pool: () => {
      if (scratch === null) throw new Error('Scratch database is not open.');
      return scratch;
    },
  };
}

/** The maintenance URL with its database swapped for the scratch one. */
function scratchUrl(name: string): string {
  const url = new URL(requireConnectionString('TEST_DATABASE_URL'));
  url.pathname = `/${name}`;
  return url.toString();
}

/**
 * CREATE DATABASE and DROP DATABASE cannot run inside a transaction or against
 * the database being dropped, so they get their own short-lived pool.
 */
async function onMaintenanceConnection(
  run: (admin: Pool) => Promise<unknown>,
): Promise<void> {
  const admin = createPool(requireConnectionString('TEST_DATABASE_URL'));
  try {
    await run(admin);
  } finally {
    await admin.end();
  }
}
