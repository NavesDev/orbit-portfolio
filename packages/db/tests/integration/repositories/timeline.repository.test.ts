import {
  DateRange,
  DESCRIPTION_MAX_LENGTH,
  LocalizedText,
  TimelineEntry,
  type TimelineEntryProperties,
  TITLE_MAX_LENGTH,
  Url,
} from '@portfolio/core';
import type { Pool } from 'pg';
import { beforeEach, describe, expect, it } from 'vitest';

import { PostgresTimelineRepository } from '../../../src/repositories/postgres-timeline.repository.ts';
import { withScratchDatabase } from '../../helpers/scratch-database.ts';

const { pool } = withScratchDatabase();

const WHOLE_TABLE = { limit: 50, offset: 0 };

function id(suffix: number): string {
  return `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
}

function entry(overrides: Partial<TimelineEntryProperties> = {}): TimelineEntry {
  return TimelineEntry.create({
    id: id(1),
    kind: 'professional',
    title: LocalizedText.create({ 'en-US': 'Software Development Intern' }, TITLE_MAX_LENGTH),
    organization: 'Sea Tecnologia',
    description: null,
    credentialUrl: null,
    period: DateRange.create({ startedOn: '2025-12-01', endedOn: null }),
    isFeatured: true,
    isPublished: true,
    sortOrder: 0,
    ...overrides,
  });
}

async function insertEntry(client: Pool, values: TimelineEntry): Promise<void> {
  await client.query(
    `INSERT INTO timeline_entries (id, kind, title, organization, description, credential_url,
                                   started_on, ended_on, is_featured, is_published, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      values.id,
      values.kind,
      JSON.stringify(values.title.toJSON()),
      values.organization,
      values.description === null ? null : JSON.stringify(values.description.toJSON()),
      values.credentialUrl?.toString() ?? null,
      values.period.startedOn,
      values.period.endedOn,
      values.isFeatured,
      values.isPublished,
      values.sortOrder,
    ],
  );
}

async function insertSkill(client: Pool, skillId: string, name: string, sortOrder: number): Promise<void> {
  await client.query(
    `INSERT INTO skills (id, name, category, sort_order) VALUES ($1, $2, 'backend', $3)`,
    [skillId, name, sortOrder],
  );
}

async function linkSkill(client: Pool, entryId: string, skillId: string): Promise<void> {
  await client.query(
    `INSERT INTO timeline_entry_skill (timeline_entry_id, skill_id) VALUES ($1, $2)`,
    [entryId, skillId],
  );
}

function repository(): PostgresTimelineRepository {
  return new PostgresTimelineRepository(pool());
}

beforeEach(async () => {
  await pool().query('DELETE FROM timeline_entry_skill');
  await pool().query('DELETE FROM timeline_entries');
  await pool().query('DELETE FROM skills');
});

describe('PostgresTimelineRepository', () => {
  describe('listPublished', () => {
    it('returns published entries with the most recent first (FR-11)', async () => {
      await insertEntry(pool(), entry({ id: id(1), organization: 'older', period: dates('2022-02-01') }));
      await insertEntry(pool(), entry({ id: id(2), organization: 'newer', period: dates('2026-07-25') }));
      await insertEntry(pool(), entry({ id: id(3), organization: 'middle', period: dates('2025-06-01') }));

      const { entries } = await repository().listPublished(WHOLE_TABLE.limit, WHOLE_TABLE.offset);

      expect(entries.map((row) => row.organization)).toEqual(['newer', 'middle', 'older']);
    });

    it('excludes an unpublished entry from the page and from the total (FR-28)', async () => {
      await insertEntry(pool(), entry({ id: id(1), isPublished: false }));
      await insertEntry(pool(), entry({ id: id(2), organization: 'live' }));

      const { entries, total } = await repository().listPublished(WHOLE_TABLE.limit, WHOLE_TABLE.offset);

      expect(entries.map((row) => row.organization)).toEqual(['live']);
      expect(total).toBe(1);
    });

    it('returns disjoint windows carrying the same total', async () => {
      for (const [index, day] of ['2026-04-01', '2026-03-01', '2026-02-01', '2026-01-01'].entries()) {
        await insertEntry(pool(), entry({ id: id(index + 1), organization: day, period: dates(day) }));
      }

      const first = await repository().listPublished(2, 0);
      const second = await repository().listPublished(2, 2);

      expect(first.entries.map((row) => row.organization)).toEqual(['2026-04-01', '2026-03-01']);
      expect(second.entries.map((row) => row.organization)).toEqual(['2026-02-01', '2026-01-01']);
      expect([first.total, second.total]).toEqual([4, 4]);
    });

    it('reports a total of zero for an offset past the last entry', async () => {
      await insertEntry(pool(), entry());

      const { entries, total } = await repository().listPublished(2, 10);

      expect(entries).toEqual([]);
      expect(total).toBe(0);
    });

    it('breaks a tie on sort_order, then on id, so pages never overlap', async () => {
      await insertEntry(pool(), entry({ id: id(3), organization: 'third', sortOrder: 1 }));
      await insertEntry(pool(), entry({ id: id(2), organization: 'second', sortOrder: 0 }));
      await insertEntry(pool(), entry({ id: id(1), organization: 'first', sortOrder: 0 }));

      const { entries } = await repository().listPublished(WHOLE_TABLE.limit, WHOLE_TABLE.offset);

      expect(entries.map((row) => row.organization)).toEqual(['first', 'second', 'third']);
    });

    /*
     * There is no test here for an entry with no start date, and there cannot
     * be: `timeline_entries.started_on` is NOT NULL, so the row this
     * repository would have to sort does not exist. `DateRange` still allows a
     * null start because `projects.started_on` is nullable and both share the
     * value object, so the ordering rule is covered where it can be — against
     * `FakeTimelineRepository` in `get-timeline.test.ts`. `NULLS LAST` stays in
     * the SQL as the house default ordering, not as a branch this table reaches.
     */

    it('round-trips every localized and optional field through the mapper', async () => {
      const stored = entry({
        kind: 'certification',
        title: LocalizedText.create(
          { 'en-US': 'Full Stack', 'pt-BR': 'Full Stack' },
          TITLE_MAX_LENGTH,
        ),
        description: LocalizedText.create({ 'en-US': 'A course.' }, DESCRIPTION_MAX_LENGTH),
        credentialUrl: Url.create('https://example.com/credential'),
        period: DateRange.create({ startedOn: '2026-07-25', endedOn: null }),
      });
      await insertEntry(pool(), stored);

      const [found] = (await repository().listPublished(WHOLE_TABLE.limit, WHOLE_TABLE.offset)).entries;

      expect(found?.kind).toBe('certification');
      expect(found?.title.resolve('pt-BR')).toBe('Full Stack');
      expect(found?.description?.resolve('en-US')).toBe('A course.');
      expect(found?.credentialUrl?.toString()).toBe('https://example.com/credential');
      expect(found?.isOngoing).toBe(true);
    });

    it('reads started_on and ended_on as plain ISO dates, not shifted by timezone', async () => {
      await insertEntry(
        pool(),
        entry({ period: DateRange.create({ startedOn: '2026-01-01', endedOn: '2026-01-02' }) }),
      );

      const [found] = (await repository().listPublished(WHOLE_TABLE.limit, WHOLE_TABLE.offset)).entries;

      expect(found?.period.startedOn).toBe('2026-01-01');
      expect(found?.period.endedOn).toBe('2026-01-02');
    });
  });

  describe('listSkillNames', () => {
    it('returns the entry’s own skills in sort_order', async () => {
      await insertEntry(pool(), entry({ id: id(1) }));
      await insertEntry(pool(), entry({ id: id(2), organization: 'Other' }));
      await insertSkill(pool(), id(11), 'Liferay', 1);
      await insertSkill(pool(), id(12), 'Java', 0);
      await insertSkill(pool(), id(13), 'Python', 0);
      await linkSkill(pool(), id(1), id(11));
      await linkSkill(pool(), id(1), id(12));
      await linkSkill(pool(), id(2), id(13));

      expect(await repository().listSkillNames(id(1))).toEqual(['Java', 'Liferay']);
    });

    it('returns nothing for an entry with no skills attached', async () => {
      await insertEntry(pool(), entry());

      expect(await repository().listSkillNames(id(1))).toEqual([]);
    });
  });
});

function dates(startedOn: string | null): DateRange {
  return DateRange.create({ startedOn, endedOn: null });
}
