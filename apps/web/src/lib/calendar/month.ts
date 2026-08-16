/**
 * Months as people write them, 1 to 12.
 *
 * `Date` counts months from zero, which is the single most reliable source of
 * off-by-one dates in JavaScript. Nothing in this app writes a bare month
 * number: it names one here, and the one conversion to `Date`'s numbering
 * happens in `fullYearsSince` below.
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

export type MonthNumber = (typeof MONTH)[keyof typeof MONTH];

/** A point on the calendar no finer than a month — a start date nobody recalls to the day. */
export interface CalendarMonth {
  readonly year: number;
  readonly month: MonthNumber;
}

const MONTHS_PER_YEAR = 12;
const NONE = 0;

/**
 * Whole years elapsed from `start` to `now`, never negative.
 *
 * Counted in months and divided, rather than subtracting years and patching
 * the result: February 2022 read from January 2026 is three years, not four,
 * and the month is what decides that.
 *
 * `now` is a parameter rather than a call to `Date.now()` inside so that the
 * rule can be tested at a chosen instant. The composition root passes the real
 * clock.
 */
const FIRST_MONTH_INDEX = MONTH.january - 1;
const FIRST_DAY_OF_MONTH = 1;
const FIRST_DAY_OF_YEAR = 1;
const MS_PER_DAY = 86_400_000;

/**
 * Which day of the year `now` falls on, counting 1 January as day one.
 *
 * Both instants are reduced to a UTC calendar date before subtracting. Doing
 * the arithmetic on the raw timestamps would be an hour out on the two days a
 * year the clocks change, and an hour is enough to cross a day boundary.
 */
export function dayOfYear(now: Date): number {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const yearStart = Date.UTC(now.getFullYear(), FIRST_MONTH_INDEX, FIRST_DAY_OF_MONTH);

  return (today - yearStart) / MS_PER_DAY + FIRST_DAY_OF_YEAR;
}

export function fullYearsSince(start: CalendarMonth, now: Date): number {
  const startMonths = start.year * MONTHS_PER_YEAR + start.month;
  const nowMonths = now.getFullYear() * MONTHS_PER_YEAR + (now.getMonth() + 1);

  return Math.max(NONE, Math.floor((nowMonths - startMonths) / MONTHS_PER_YEAR));
}
