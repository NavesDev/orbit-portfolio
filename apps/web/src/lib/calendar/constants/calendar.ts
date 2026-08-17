/**
 * The calendar's own quantities.
 *
 * `MONTH` is the reason this file exists: `Date` counts months from zero,
 * which is the single most reliable source of off-by-one dates in JavaScript.
 * Nothing in this app writes a bare month number — it names one here, and the
 * one conversion to `Date`'s numbering happens in `month.ts`.
 */
export const MONTH = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
} as const;

export const MONTHS_PER_YEAR = 12;

/** `Date`'s own numbering, which starts at zero — used once, on purpose. */
export const FIRST_MONTH_INDEX = MONTH.january - 1;
export const FIRST_DAY_OF_MONTH = 1;
export const FIRST_DAY_OF_YEAR = 1;

export const MS_PER_DAY = 86_400_000;

/** A span that has not started yet is zero, never negative. */
export const NO_ELAPSED_TIME = 0;
