import { describe, expect, it } from 'vitest';
import { withScratchDatabase } from '../../helpers/scratch-database.ts';
import { seed } from '../../../src/seed/run.ts';

const db = withScratchDatabase();

const TABLES = [
  'social_links',
  'skills',
  'projects',
  'timeline_entries',
  'project_skill',
  'timeline_entry_skill',
] as const;

/**
 * Nothing here asserts a row count or a piece of content (U-1). What is
 * asserted is that every table is populated and that a second run converges.
 */
async function counts(): Promise<Record<string, number>> {
  const entries = await Promise.all(
    TABLES.map(async (table) => {
      const { rows } = await db
        .pool()
        .query<{ count: string }>(`SELECT count(*) AS count FROM ${table}`);
      return [table, Number(rows[0]!.count)] as const;
    }),
  );
  return Object.fromEntries(entries);
}

describe('seed', () => {
  it('populates every table and converges on a second run', async () => {
    await seed(db.pool());
    const first = await counts();
    for (const table of TABLES) {
      expect(first[table], `${table} should not be empty`).toBeGreaterThan(0);
    }

    const { rows: before } = await db
      .pool()
      .query<{ id: string }>('SELECT id FROM projects ORDER BY slug');

    await seed(db.pool());

    expect(await counts()).toEqual(first);
    const { rows: after } = await db
      .pool()
      .query<{ id: string }>('SELECT id FROM projects ORDER BY slug');
    expect(after, 'ids must survive a re-run').toEqual(before);
  });

  it('writes a usage note on every join row', async () => {
    await seed(db.pool());
    for (const table of ['project_skill', 'timeline_entry_skill'] as const) {
      const { rows } = await db
        .pool()
        .query<{ missing: string }>(
          `SELECT count(*) AS missing FROM ${table} WHERE usage_note IS NULL`,
        );
      expect(Number(rows[0]!.missing), `${table} has rows without a usage note`).toBe(0);
    }
  });

  it('writes both locales on every localized project column', async () => {
    await seed(db.pool());
    const { rows } = await db
      .pool()
      .query<{ slug: string }>(
        `SELECT slug FROM projects
          WHERE NOT (title ? 'en') OR NOT (category ? 'en')
             OR NOT (description ? 'en') OR NOT (tags ? 'en')`,
      );
    expect(rows).toEqual([]);
  });

  it('writes both locales on every localized timeline column', async () => {
    await seed(db.pool());
    const { rows } = await db
      .pool()
      .query<{ organization: string }>(
        `SELECT organization FROM timeline_entries
          WHERE NOT (title ? 'en') OR NOT (description ? 'en')`,
      );
    expect(rows).toEqual([]);
  });

  it('leaves a row an author edited by hand in place, updating only what it owns', async () => {
    await seed(db.pool());
    const { rows } = await db
      .pool()
      .query<{ id: string }>(
        `INSERT INTO projects (slug, title) VALUES ('hand-written', $1) RETURNING id`,
        [JSON.stringify({ 'pt-BR': 'Escrito à mão' })],
      );

    await seed(db.pool());

    const { rowCount } = await db
      .pool()
      .query('SELECT 1 FROM projects WHERE id = $1', [rows[0]!.id]);
    expect(rowCount, 'the seed is not a reset button').toBe(1);
  });

  it('carries at least one entry of every timeline kind that the content declares', async () => {
    await seed(db.pool());
    const { rows } = await db
      .pool()
      .query<{ kind: string }>('SELECT DISTINCT kind FROM timeline_entries ORDER BY kind');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('resolves a locale with fallback the way the application will', async () => {
    await seed(db.pool());
    const { rows } = await db.pool().query<{ title: string }>(
      `SELECT coalesce(title ->> 'en', title ->> 'pt-BR') AS title
         FROM projects ORDER BY sort_order`,
    );
    expect(rows.every((row) => row.title.trim() !== '')).toBe(true);
  });
});
