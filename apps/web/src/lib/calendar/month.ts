import * as CALENDAR from './constants/calendar';

/**
 * Calendar arithmetic the stat band counts two of its figures with.
 *
 * The quantities it works from — the months, the length of a day, where a year
 * starts — are in `constants/calendar.ts`.
 */
export { MONTH } from './constants/calendar';

export type MonthNumber = (typeof CALENDAR.MONTH)[keyof typeof CALENDAR.MONTH];

/** A point on the calendar no finer than a month — a start date nobody recalls to the day. */
export interface CalendarMonth {
  readonly year: number;
  readonly month: MonthNumber;
}

/**
 * Which day of the year `now` falls on, counting 1 January as day one.
 *
 * Both instants are reduced to a UTC calendar date before subtracting. Doing
 * the arithmetic on the raw timestamps would be an hour out on the two days a
 * year the clocks change, and an hour is enough to cross a day boundary.
 */
export function dayOfYear(now: Date): number {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const yearStart = Date.UTC(
    now.getFullYear(),
    CALENDAR.FIRST_MONTH_INDEX,
    CALENDAR.FIRST_DAY_OF_MONTH,
  );

  return (today - yearStart) / CALENDAR.MS_PER_DAY + CALENDAR.FIRST_DAY_OF_YEAR;
}

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
export function fullYearsSince(start: CalendarMonth, now: Date): number {
  const startMonths = start.year * CALENDAR.MONTHS_PER_YEAR + start.month;
  const nowMonths = now.getFullYear() * CALENDAR.MONTHS_PER_YEAR + (now.getMonth() + 1);

  const elapsed = Math.floor((nowMonths - startMonths) / CALENDAR.MONTHS_PER_YEAR);

  return Math.max(CALENDAR.NO_ELAPSED_TIME, elapsed);
}
