import {
  DateRange,
  DESCRIPTION_MAX_LENGTH,
  isTimelineKind,
  LocalizedText,
  TimelineEntry,
  TITLE_MAX_LENGTH,
  Url,
} from '@portfolio/core';

/**
 * The `timeline_entries` row, exactly as the driver returns it.
 *
 * `started_on` and `ended_on` are selected as `::text` by the repository for
 * the reason `project.mapper.ts` records: `pg` parses a `date` into a JS `Date`
 * built from local-time fields, and round-tripping that through UTC can shift
 * the calendar day. Casting in SQL means this mapper only ever sees the
 * `YYYY-MM-DD` string `DateRange` already expects.
 */
export interface TimelineEntryRow {
  readonly id: string;
  readonly kind: string;
  readonly title: unknown;
  readonly organization: string;
  readonly description: unknown | null;
  readonly credential_url: string | null;
  readonly started_on: string | null;
  readonly ended_on: string | null;
  readonly is_featured: boolean;
  readonly is_published: boolean;
  readonly sort_order: number;
}

/**
 * Row ⇒ entity for `timeline_entries`. Read-only: the seed writes these rows
 * with its own SQL, the same way it writes every other table, so this slice
 * has no `save` to implement.
 *
 * `kind` goes through `isTimelineKind` rather than a cast. The column is a
 * native enum, so a value outside the list means the enum and
 * `domain/enums/timeline-kind.ts` have drifted — a migration landed that this
 * code has not caught up with. Failing here names that; a cast would let it
 * surface as an undefined icon three layers away.
 */
export const timelineEntryMapper = {
  toDomain(row: TimelineEntryRow): TimelineEntry {
    if (!isTimelineKind(row.kind)) {
      throw new Error(
        `"${row.kind}" is not a timeline kind — the native enum and the domain have drifted apart.`,
      );
    }

    return TimelineEntry.create({
      id: row.id,
      kind: row.kind,
      title: LocalizedText.create(row.title, TITLE_MAX_LENGTH),
      organization: row.organization,
      description:
        row.description === null
          ? null
          : LocalizedText.create(row.description, DESCRIPTION_MAX_LENGTH),
      credentialUrl: row.credential_url === null ? null : Url.create(row.credential_url),
      period: DateRange.create({ startedOn: row.started_on, endedOn: row.ended_on }),
      isFeatured: row.is_featured,
      isPublished: row.is_published,
      sortOrder: row.sort_order,
    });
  },
};
