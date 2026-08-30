import {
  CATEGORY_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  DateRange,
  IconSvg,
  LocalizedTagList,
  LocalizedText,
  ProgressPercent,
  Project,
  Slug,
  TAGS_MAX_ITEMS,
  TAG_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  Url,
} from '@portfolio/core';

/**
 * The `projects` row, exactly as the driver returns it.
 *
 * `started_on` and `ended_on` are selected as `::text` by the repository, not
 * left as the driver's own `date` type — `pg`'s default date parser returns a
 * JS `Date` built from local-time fields, and round-tripping that through
 * `toISOString()` (UTC) can shift the calendar day. Casting in SQL sidesteps
 * the driver's date type entirely, so this mapper only ever sees the
 * `YYYY-MM-DD` string `DateRange` already expects.
 */
export interface ProjectRow {
  readonly id: string;
  readonly slug: string;
  readonly title: unknown;
  readonly category: unknown | null;
  readonly description: unknown | null;
  readonly tags: unknown | null;
  readonly repo_url: string | null;
  readonly live_url: string | null;
  readonly progress_percent: number | null;
  readonly started_on: string | null;
  readonly ended_on: string | null;
  readonly visual_svg: string | null;
  readonly is_featured: boolean;
  readonly is_published: boolean;
  readonly sort_order: number;
}

/**
 * Row ⇒ entity for `projects`. Read-only: this slice has no writer yet — the
 * seed writes `projects` directly with hand-written SQL, the same way it
 * already writes every other table, and nothing in this task needs a `save`.
 *
 * `visual_svg` passes through `IconSvg.create` here, exactly as `icon_svg`
 * does in `social-link.mapper.ts`: a row edited by hand into carrying
 * something outside the whitelist fails at this boundary, not in the browser
 * (NFR-07).
 */
export const projectMapper = {
  toDomain(row: ProjectRow): Project {
    return Project.create({
      id: row.id,
      slug: Slug.create(row.slug),
      title: LocalizedText.create(row.title, TITLE_MAX_LENGTH),
      category: row.category === null ? null : LocalizedText.create(row.category, CATEGORY_MAX_LENGTH),
      description:
        row.description === null ? null : LocalizedText.create(row.description, DESCRIPTION_MAX_LENGTH),
      tags: row.tags === null ? null : LocalizedTagList.create(row.tags, TAG_MAX_LENGTH, TAGS_MAX_ITEMS),
      repoUrl: row.repo_url === null ? null : Url.create(row.repo_url),
      liveUrl: row.live_url === null ? null : Url.create(row.live_url),
      progress: ProgressPercent.create(row.progress_percent),
      period: DateRange.create({ startedOn: row.started_on, endedOn: row.ended_on }),
      visualSvg: row.visual_svg === null ? null : IconSvg.create(row.visual_svg),
      isFeatured: row.is_featured,
      isPublished: row.is_published,
      sortOrder: row.sort_order,
    });
  },
};
