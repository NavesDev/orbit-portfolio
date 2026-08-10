import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';
import { createPool, requireConnectionString } from '../client.ts';
import { DATABASE_URL } from '../constants/env-keys.ts';
import { seedContent } from './data.ts';
import { SEED_STRATEGIES } from './strategies/index.ts';

/**
 * Writes `data.ts` into the database, in one transaction, upserting on the
 * deterministic id of each row.
 *
 * Re-running converges the database on the file without changing ids and
 * without deleting anything an author added by hand — the seed states what
 * these rows are, it is not a reset button.
 *
 * `seed()` itself knows nothing about tables — it runs whichever strategies
 * `strategies/index.ts` registers, in the order they are registered. See
 * `seed/strategies/` for what each one writes.
 */
export async function seed(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const strategy of SEED_STRATEGIES) {
      try {
        await strategy.run(client);
      } catch (error) {
        throw new Error(`Seeding ${strategy.table} failed: ${(error as Error).message}`, {
          cause: error,
        });
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  const pool = createPool(requireConnectionString(DATABASE_URL));
  try {
    await seed(pool);
    console.log(
      `Seeded ${seedContent.skills.length} skills, ${seedContent.projects.length} projects, ` +
        `${seedContent.timelineEntries.length} timeline entries and ` +
        `${seedContent.socialLinks.length} social links.`,
    );
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
