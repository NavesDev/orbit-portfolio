import type { TimelineEntry } from '../../../domain/entities/timeline-entry.ts';
import type { TimelinePage, TimelineRepository } from '../timeline-repository.ts';

/**
 * In-memory `TimelineRepository` for use-case tests.
 *
 * It holds unpublished entries too and drops them, so "an unpublished entry is
 * unreachable" (FR-28) is a fact a unit test can establish with no database.
 *
 * Unlike `FakeProjectRepository`, this one **sorts**, because ordering is part
 * of the port's contract here rather than the use case's — see
 * `timeline-repository.ts` for why pagination forces that. Filter, then sort,
 * then slice: the same three steps in the same order as the SQL, so a test that
 * passes against this fake is a test that describes the real repository.
 */
export class FakeTimelineRepository implements TimelineRepository {
  private readonly entries: readonly TimelineEntry[];
  private readonly skillNamesByEntryId: ReadonlyMap<string, readonly string[]>;

  constructor(
    entries: readonly TimelineEntry[] = [],
    skillNamesByEntryId: ReadonlyMap<string, readonly string[]> = new Map(),
  ) {
    this.entries = entries;
    this.skillNamesByEntryId = skillNamesByEntryId;
  }

  listPublished(limit: number, offset: number): Promise<TimelinePage> {
    const published = this.entries.filter((entry) => entry.isPublished);
    const ordered = [...published].sort(byMostRecent);

    return Promise.resolve({
      entries: ordered.slice(offset, offset + limit),
      total: published.length,
    });
  }

  listSkillNames(entryId: string): Promise<readonly string[]> {
    return Promise.resolve([...(this.skillNamesByEntryId.get(entryId) ?? [])]);
  }
}

/**
 * `started_on DESC NULLS LAST, sort_order ASC, id ASC` — FR-11's rule, with
 * `data-model.md`'s default ordering as the tiebreak.
 *
 * A null start sorts last rather than first: an entry with no start date is the
 * one thing that cannot claim to be the most recent.
 */
function byMostRecent(left: TimelineEntry, right: TimelineEntry): number {
  const leftStarted = left.period.startedOn;
  const rightStarted = right.period.startedOn;

  if (leftStarted !== rightStarted) {
    if (leftStarted === null) {
      return 1;
    }

    if (rightStarted === null) {
      return -1;
    }

    return rightStarted.localeCompare(leftStarted);
  }

  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }

  return left.id.localeCompare(right.id);
}
