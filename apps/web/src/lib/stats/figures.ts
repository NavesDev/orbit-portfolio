import type { DeveloperStatsProvider } from '@portfolio/core';
import { GetDeveloperStats } from '@portfolio/core';

import type { StatId } from '../../content/site';
import { CODING_SINCE, CUPS_OF_COFFEE_PER_DAY } from '../../content/site';
import { dayOfYear, fullYearsSince } from '../calendar/month';

/**
 * A figure the band can draw, or `null` where there is none.
 *
 * The two are different states, not one with a magic value: zero commits is a
 * fact and renders as `0`, while an unreachable GitHub is an absence and
 * renders as a placeholder.
 */
export type StatFigures = Readonly<Record<StatId, number | null>>;

/**
 * The four figures the stat band shows (FR-21).
 *
 * Two come from the `DeveloperStatsProvider` port through its use case; the
 * other two are counted from the calendar — years from `CODING_SINCE`, coffee
 * from the day of the year. Those two can always be worked out, so they are
 * never `null`.
 *
 * `now` is a parameter for the same reason the domain declares a `Clock` port:
 * a function that reads the clock itself can only be tested today.
 */
export async function resolveStatFigures(
  now: Date,
  provider: DeveloperStatsProvider | null,
): Promise<StatFigures> {
  const { stats } = await new GetDeveloperStats(provider).execute();

  return {
    commits: stats?.publicCommits ?? null,
    pullRequests: stats?.pullRequests ?? null,
    coffee: dayOfYear(now) * CUPS_OF_COFFEE_PER_DAY,
    years: fullYearsSince(CODING_SINCE, now),
  };
}

/** Whether any figure is missing — what the band's note is rendered for (FR-22). */
export function hasMissingFigure(figures: StatFigures): boolean {
  return Object.values(figures).some((figure) => figure === null);
}
