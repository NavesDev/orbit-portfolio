import {
  FIRST_DAY_OF_MONTH,
  FIRST_DAY_OF_YEAR,
  FIRST_MONTH_INDEX,
  MONTH,
  MONTHS_PER_YEAR,
  MS_PER_DAY,
  NO_ELAPSED_TIME,
} from './constants/calendar';

/**
 * Calendar arithmetic the stat band counts two of its figures with.
 *
 * The quantities it works from — the months, the length of a day, where a year
 * starts — are in `constants/calendar.ts`.
 */
export { MONTH } from './constants/calendar';

export type MonthNumber = (typeof MONTH)[keyof typeof MONTH];

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
  const yearStart = Date.UTC(now.getFullYear(), FIRST_MONTH_INDEX, FIRST_DAY_OF_MONTH);

  return (today - yearStart) / MS_PER_DAY + FIRST_DAY_OF_YEAR;
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
  const startMonths = start.year * MONTHS_PER_YEAR + start.month;
  const nowMonths = now.getFullYear() * MONTHS_PER_YEAR + (now.getMonth() + 1);

  return Math.max(NO_ELAPSED_TIME, Math.floor((nowMonths - startMonths) / MONTHS_PER_YEAR));
}
