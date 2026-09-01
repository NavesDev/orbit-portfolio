import type { TimelineEntry } from '../../domain/entities/timeline-entry.ts';

/**
 * One page of the trajectory, plus how many published entries exist in all.
 *
 * `total` rather than a `hasMore` boolean: a caller can derive "more remain"
 * from `offset + entries.length < total`, and cannot derive a count from a
 * boolean. It is the count of published rows, never of the page.
 */
export interface TimelinePage {
  readonly entries: readonly TimelineEntry[];
  readonly total: number;
}

/**
 * Persistence for the trajectory, declared here and implemented by
 * `@portfolio/db` (clean-architecture.md § 5).
 *
 * Like every repository here it takes no `Locale` — it returns entities holding
 * full `LocalizedText`, and `GetTimeline` resolves the language.
 *
 * **Ordering is part of this contract, unlike `ProjectRepository`'s.** That is
 * a deliberate difference and not an oversight. `ListFeaturedProjects` sorts in
 * the use case precisely so a fake and the real repository agree; under
 * pagination that is impossible, because sorting a page sorts whatever four
 * rows happened to arrive rather than the four that should have. So the order
 * is promised here — `started_on` descending, nulls last, then `sort_order`
 * ascending, then `id` — and `FakeTimelineRepository` implements the same rule
 * the SQL does. `id` is the last key so that two rows identical on the first
 * two cannot swap between one page and the next, which would show a visitor
 * one entry twice and another never.
 *
 * `listSkillNames` is the read side of `timeline_entry_skill` (data-model.md
 * § 6) — that join table is persisted by this aggregate root and never gets a
 * repository of its own. Names only: the timeline renders skill chips, and
 * `usage_note` belongs to the skills modal, which `SkillRepository.findUsage`
 * will serve in roadmap 3.7.
 */
export interface TimelineRepository {
  listPublished(limit: number, offset: number): Promise<TimelinePage>;
  listSkillNames(entryId: string): Promise<readonly string[]>;
}
