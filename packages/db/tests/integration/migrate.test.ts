import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { migrate } from '../../src/migrate.ts';
import { withScratchDatabase } from '../helpers/scratch-database.ts';

/**
 * Read from disk rather than hardcoded: the ledger must match the migrations
 * that exist, and a count written into the test only means the test has to be
 * edited every time one is added.
 */
const MIGRATION_FILES = readdirSync(
  fileURLToPath(new URL('../../src/migrations', import.meta.url)),
)
  .filter((file) => file.endsWith('.sql'))
  .sort();

const db = withScratchDatabase();

async function names(sql: string): Promise<string[]> {
  const { rows } = await db.pool().query<{ name: string }>(sql);
  return rows.map((row) => row.name);
}

describe('migrate', () => {
  it('creates every documented table', async () => {
    expect(
      await names(
        `SELECT tablename AS name FROM pg_tables WHERE schemaname = 'public' ORDER BY 1`,
      ),
    ).toEqual([
      'project_skill',
      'projects',
      'schema_migrations',
      'skills',
      'social_links',
      'timeline_entries',
      'timeline_entry_skill',
    ]);
  });

  it('creates both enums with their documented values', async () => {
    const { rows } = await db.pool().query<{ name: string; values: string[] }>(
      // enumlabel is `name`, not `text`; without the cast the driver hands back
      // the array's literal representation instead of parsing it.
      `SELECT t.typname AS name,
              array_agg(e.enumlabel::text ORDER BY e.enumsortorder) AS values
         FROM pg_type t
         JOIN pg_enum e ON e.enumtypid = t.oid
        GROUP BY t.typname
        ORDER BY t.typname`,
    );
    expect(rows).toEqual([
      { name: 'skill_category', values: ['frontend', 'backend', 'tooling', 'data'] },
      { name: 'timeline_kind', values: ['professional', 'academic', 'certification'] },
    ]);
  });

  it('creates both localization functions', async () => {
    expect(
      await names(
        `SELECT proname AS name FROM pg_proc
          WHERE proname IN ('is_localized', 'is_localized_array') ORDER BY 1`,
      ),
    ).toEqual(['is_localized', 'is_localized_array']);
  });

  it('creates every documented index', async () => {
    expect(
      await names(
        `SELECT indexname AS name FROM pg_indexes
          WHERE schemaname = 'public' AND indexname LIKE ANY (ARRAY['ix_%', 'ux_%'])
          ORDER BY 1`,
      ),
    ).toEqual([
      'ix_project_skill__skill',
      'ix_projects__published_featured_sort',
      'ix_skills__category',
      'ix_social_links__published_sort',
      'ix_timeline_entries__kind',
      'ix_timeline_entries__published_started',
      'ix_timeline_entry_skill__skill',
      'ux_projects__slug',
      'ux_skills__name',
    ]);
  });

  it('creates every documented check constraint', async () => {
    expect(
      await names(
        `SELECT conname AS name FROM pg_constraint
          WHERE contype = 'c' AND conname LIKE 'ck_%' ORDER BY 1`,
      ),
    ).toEqual([
      'ck_project_skill__usage_note',
      'ck_projects__category',
      'ck_projects__date_order',
      'ck_projects__description',
      'ck_projects__progress_range',
      'ck_projects__tags',
      'ck_projects__title',
      'ck_timeline_entries__date_order',
      'ck_timeline_entries__description',
      'ck_timeline_entries__title',
      'ck_timeline_entry_skill__usage_note',
    ]);
  });

  it('applies nothing on a second run', async () => {
    expect(await migrate(db.pool())).toEqual([]);
  });

  it('records every migration file in the ledger', async () => {
    const ledger = await names(
      `SELECT filename AS name FROM schema_migrations ORDER BY filename`,
    );
    expect(ledger).toEqual(MIGRATION_FILES);
    expect(ledger[0]).toBe('001_enums.sql');
  });
});
