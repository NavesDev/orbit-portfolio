import type { TimelinePage, TimelineRepository } from '@portfolio/core';

import { timelineEntryMapper, type TimelineEntryRow } from '../mappers/timeline-entry.mapper.ts';
import { BaseRepository, type Queryable } from './base.repository.ts';

const TIMELINE_COLUMNS =
  'id, kind, title, organization, description, credential_url, ' +
  'started_on::text AS started_on, ended_on::text AS ended_on, ' +
  'is_featured, is_published, sort_order';

/** No published rows means no row to read the window function from. */
const NO_ENTRIES = 0;

interface PagedTimelineEntryRow extends TimelineEntryRow {
  readonly total_count: string;
}

interface SkillNameRow {
  readonly name: string;
}

/**
 * `TimelineRepository` over PostgreSQL (FR-11, FR-14).
 *
 * The ordering here is the port's contract and not an optimisation, which is
 * what separates this repository from `PostgresProjectRepository`: that one
 * orders in SQL while `ListFeaturedProjects` re-sorts, because both are cheap
 * and the use case owns the guarantee. Under pagination the use case cannot
 * own it — it is handed one page — so `ORDER BY` here *is* the guarantee, and
 * `FakeTimelineRepository` mirrors it exactly.
 *
 * `id` is the last sort key on purpose. Two rows tied on `started_on` and
 * `sort_order` would otherwise be free to swap between one page and the next,
 * which shows a visitor one entry twice and another never.
 *
 * The total travels with the page through `COUNT(*) OVER()` rather than in a
 * second `SELECT count(*)`: one round trip, one snapshot, and no window in
 * which a row could be published between the two queries and make the count
 * disagree with the page it describes.
 *
 * `ix_timeline_entries__published_started` on `(is_published, started_on DESC)`
 * already covers both the filter and the leading sort key.
 */
export class PostgresTimelineRepository extends BaseRepository implements TimelineRepository {
  constructor(db: Queryable) {
    super(db);
  }

  async listPublished(limit: number, offset: number): Promise<TimelinePage> {
    const rows = await this.rows<PagedTimelineEntryRow>(
      `SELECT ${TIMELINE_COLUMNS}, COUNT(*) OVER() AS total_count
         FROM timeline_entries
        WHERE is_published = true
        ORDER BY started_on DESC NULLS LAST, sort_order ASC, id ASC
        LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const [first] = rows;

    return {
      entries: rows.map((row) => timelineEntryMapper.toDomain(row)),
      /*
       * `COUNT(*) OVER()` comes back as a `bigint`, which `pg` hands over as a
       * string rather than a number — parsing it as one here is what keeps the
       * driver's type off the port's contract.
       *
       * An empty page has no row to read it from. That is not an error: an
       * offset past the end, and a table with nothing published, both land
       * here, and both mean the same thing to a caller.
       */
      total: first === undefined ? NO_ENTRIES : Number.parseInt(first.total_count, 10),
    };
  }

  async listSkillNames(entryId: string): Promise<readonly string[]> {
    const rows = await this.rows<SkillNameRow>(
      `SELECT s.name
         FROM timeline_entry_skill ts
         JOIN skills s ON s.id = ts.skill_id
        WHERE ts.timeline_entry_id = $1
        ORDER BY s.sort_order ASC, s.name ASC`,
      [entryId],
    );

    return rows.map((row) => row.name);
  }
}
