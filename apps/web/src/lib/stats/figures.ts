import type { DeveloperStatsProvider } from '@portfolio/core';
import { GetDeveloperStats } from '@portfolio/core';

import type { StatId } from '../../content/site';
import { CODING_SINCE, CUPS_OF_COFFEE_PER_DAY, FALLBACK_FIGURES } from '../../content/site';
import { dayOfYear, fullYearsSince } from '../calendar/month';

export interface StatBandFigures {
  readonly figures: Readonly<Record<StatId, number>>;
  /**
   * Whether the commit and pull-request counts are placeholder. When they are
   * not, nothing on the band is invented and the note disappears (FR-22) —
   * the other two figures are arithmetic on the calendar, not guesses.
   */
  readonly isIllustrative: boolean;
}

/**
 * The four figures the stat band shows (FR-21).
 *
 * Two come from the `DeveloperStatsProvider` port through its use case; the
 * other two are counted from the calendar — years from `CODING_SINCE`, coffee
 * from the day of the year. The page calls this once and
 * renders numbers; the decision about what to do when GitHub is unreachable
 * belongs to `GetDeveloperStats`, not here and not to a component.
 *
 * `now` is a parameter for the same reason the domain declares a `Clock` port:
 * a function that reads the clock itself can only be tested today.
 */
export async function resolveStatFigures(
  now: Date,
  provider: DeveloperStatsProvider | null,
): Promise<StatBandFigures> {
  /*
   * Mapped field by field rather than spread: the band calls it `commits` and
   * the port calls it `publicCommits`, and a spread would have silently passed
   * an object with neither.
   */
  const { stats, isIllustrative } = await new GetDeveloperStats(provider).execute({
    fallback: {
      publicCommits: FALLBACK_FIGURES.commits,
      pullRequests: FALLBACK_FIGURES.pullRequests,
    },
  });

  return {
    figures: {
      commits: stats.publicCommits,
      pullRequests: stats.pullRequests,
      coffee: dayOfYear(now) * CUPS_OF_COFFEE_PER_DAY,
      years: fullYearsSince(CODING_SINCE, now),
    },
    isIllustrative,
  };
}
