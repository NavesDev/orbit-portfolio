import type { Locale } from '../../../domain/enums/locale.ts';
import type { TimelineEntryView } from '../../dto/timeline-entry-view.ts';
import type { TimelineRepository } from '../../ports/timeline-repository.ts';

export interface TimelinePageRequest {
  readonly limit: number;
  readonly offset: number;
}

export interface GetTimelineOutput {
  readonly entries: readonly TimelineEntryView[];
  readonly total: number;
}

/**
 * The timeline section's data, one page at a time (FR-11–FR-14, NFR-13).
 *
 * It resolves the language and nothing else: the ordering and the window are
 * the repository's contract (see `timeline-repository.ts`), because a use case
 * handed one page cannot sort the rows it was not given.
 *
 * Skills are fetched per entry on the page rather than joined into the listing
 * query — the same N+1 shape `PostgresProjectRepository.listSkillUsage` already
 * accepts, and bounded here by the page size rather than by the table, so the
 * count of round trips does not grow as the trajectory does.
 */
export class GetTimeline {
  constructor(private readonly repository: TimelineRepository) {}

  async execute(locale: Locale, page: TimelinePageRequest): Promise<GetTimelineOutput> {
    const { entries, total } = await this.repository.listPublished(page.limit, page.offset);

    const views = await Promise.all(
      entries.map(async (entry): Promise<TimelineEntryView> => {
        const skills = await this.repository.listSkillNames(entry.id);

        return {
          id: entry.id,
          kind: entry.kind,
          title: entry.title.resolve(locale),
          organization: entry.organization,
          description: entry.description?.resolve(locale) ?? null,
          credentialUrl: entry.credentialUrl?.toString() ?? null,
          startedOn: entry.period.startedOn,
          endedOn: entry.period.endedOn,
          isOngoing: entry.isOngoing,
          skills: [...skills],
        };
      }),
    );

    return { entries: views, total };
  }
}
