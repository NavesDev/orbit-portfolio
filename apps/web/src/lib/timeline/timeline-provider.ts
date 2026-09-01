import { GetTimeline, type GetTimelineOutput, type Locale } from '@portfolio/core';
import { getPool, PostgresTimelineRepository } from '@portfolio/db';

import * as TIMELINE_CONSTANTS from './constants/timeline';

/**
 * One page of the timeline, read from the database.
 *
 * The composition root for this slice — the only module in `apps/web` that
 * knows both that `TimelineRepository` exists and that PostgreSQL implements
 * it (NFR-02), the same role `projects-provider.ts` and
 * `social-links-provider.ts` play for their sections.
 *
 * It is deliberately not the `'use server'` module: such a file may export
 * nothing but async functions, so a plain provider could not live beside the
 * action. `timeline-actions.ts` wraps this one.
 */
export async function getTimelinePage(locale: Locale, offset: number): Promise<GetTimelineOutput> {
  const useCase = new GetTimeline(new PostgresTimelineRepository(getPool()));

  return useCase.execute(locale, { limit: TIMELINE_CONSTANTS.TIMELINE_PAGE_SIZE, offset });
}
