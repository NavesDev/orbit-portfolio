import type { CalendarMonth } from '../lib/calendar/month';
import { MONTH } from '../lib/calendar/month';

/**
 * Static content that is the same in every language.
 *
 * It sits beside `pt-BR/` and `en-US/` rather than inside them because none of
 * it is copy: a boolean has no translation, and neither do a count or a URL.
 * Duplicating these into each locale module would make it possible for the two
 * to disagree about a fact.
 */

/**
 * Whether the availability badge reads open or closed (FR-02, U-3/OQ-07).
 *
 * FR-02 refuses free text for this: with a sentence per locale and no shared
 * state, correcting one language and forgetting the other leaves the site
 * telling half its visitors the opposite of the truth. One boolean, two
 * prepared phrases per locale, and the phrases are a type error when missing.
 *
 * A constant rather than an environment variable or a column: the page is
 * statically generated (NFR-01), so nothing here can change without a build,
 * and a value the build does not check is a value that can be misspelled.
 * Persisting it is deliberately out of scope for this task.
 */
export const AVAILABLE_FOR_WORK = true;

/** The stat band's four figures, in the order the band lays them out (FR-21). */
export const STAT_IDS = ['commits', 'pullRequests', 'coffee', 'years'] as const;

export type StatId = (typeof STAT_IDS)[number];

/** The figures the band never reads from a constant — see `lib/stats/figures.ts`. */
export type SourcedStatId = 'commits' | 'pullRequests';

/**
 * What the band shows when GitHub cannot be reached, or when no token is
 * configured (FR-21, FR-22).
 *
 * The prototype's numbers, kept for exactly that case. They are placeholder,
 * and whenever they are what renders, the band says so in the visitor's
 * language — which is the whole of FR-22.
 */
export const FALLBACK_FIGURES = {
  commits: 1230,
  pullRequests: 50,
} as const;

/**
 * The joke, made checkable: coffee is counted as two cups for every day of the
 * year so far.
 *
 * It is a claim about a habit rather than a measurement, but it is arithmetic
 * a visitor can do in their head from the date — which is the difference
 * between a joke and a made-up number. That distinction is what lets the band
 * drop its illustrative note entirely once the commit and pull-request counts
 * are live: at that point nothing on the band is invented.
 */
export const CUPS_OF_COFFEE_PER_DAY = 2;

/**
 * How long a fetched figure may be served before GitHub is asked again.
 *
 * Matched to the route's `revalidate`: asking more often than the page is
 * rebuilt buys nothing and spends rate limit.
 */
export const STATS_REVALIDATE_SECONDS = 3600;

/** Where "years coding" is counted from. */
export const CODING_SINCE: CalendarMonth = { year: 2022, month: MONTH.february };
