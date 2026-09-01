'use server';

import { type GetTimelineOutput, isLocale } from '@portfolio/core';

import * as TIMELINE_CONSTANTS from './constants/timeline';
import { getTimelinePage } from './timeline-provider';

/**
 * The next page of the trajectory, for the section's "show more" control.
 *
 * A Server Action rather than a route under `/api/v1`. `monorepo.md` § "The
 * HTTP surface" rule 2 rules out a content endpoint the site calls itself —
 * `/api/*` exists for other projects — and an action is not one: it has no
 * public path, no version segment, no CORS entry and no rate-limit rule of its
 * own, and the home page stays statically generated with its first page
 * prerendered.
 *
 * Both arguments are validated, not trusted. Next's own documentation is
 * explicit that an action "runs as a POST request against the page" and is
 * "reachable to anyone who can send the same POST", so the framework's CSRF
 * and body-size checks are the floor and these are the application's own: an
 * unknown locale would reach `LocalizedText.resolve` as a key that matches
 * nothing, and a negative offset would reach `OFFSET` as invalid SQL.
 */
export async function loadMoreTimeline(
  locale: string,
  offset: number,
): Promise<GetTimelineOutput> {
  if (!isLocale(locale)) {
    throw new Error(`"${locale}" is not a locale this site publishes.`);
  }

  if (!Number.isSafeInteger(offset) || offset < TIMELINE_CONSTANTS.FIRST_PAGE_OFFSET) {
    throw new Error(`"${String(offset)}" is not a position in the timeline.`);
  }

  return getTimelinePage(locale, offset);
}
