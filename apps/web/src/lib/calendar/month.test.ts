import { describe, expect, it } from 'vitest';

import type { CalendarMonth } from './month';
import { dayOfYear, fullYearsSince, MONTH } from './month';

const FEBRUARY_2022: CalendarMonth = { year: 2022, month: MONTH.february };

/**
 * Local time on purpose: `getMonth` reads the runner's zone, so a `Z` suffix
 * would make the month-boundary cases pass or fail depending on where the test
 * runs. Written without an offset, these are the instants the assertions name.
 */
function at(localIso: string): Date {
  return new Date(localIso);
}

describe('dayOfYear', () => {
  it('counts 1 January as day one, not day zero', () => {
    expect(dayOfYear(at('2026-01-01T00:00:00'))).toBe(1);
  });

  it('counts through a common year', () => {
    expect(dayOfYear(at('2026-08-15T12:00:00'))).toBe(227);
    expect(dayOfYear(at('2026-12-31T23:59:59'))).toBe(365);
  });

  it('counts the extra day in a leap year', () => {
    expect(dayOfYear(at('2028-03-01T00:00:00'))).toBe(61);
    expect(dayOfYear(at('2028-12-31T00:00:00'))).toBe(366);
  });

  it('is a whole number on the days the clocks change', () => {
    expect(Number.isInteger(dayOfYear(at('2026-03-29T02:30:00')))).toBe(true);
    expect(Number.isInteger(dayOfYear(at('2026-10-25T02:30:00')))).toBe(true);
  });
});

describe('fullYearsSince', () => {
  it('counts a year only once the starting month comes round again', () => {
    expect(fullYearsSince(FEBRUARY_2022, at('2023-01-31T23:59:59'))).toBe(0);
    expect(fullYearsSince(FEBRUARY_2022, at('2023-02-01T00:00:00'))).toBe(1);
  });

  it('does not round the current month up', () => {
    expect(fullYearsSince(FEBRUARY_2022, at('2026-08-15T12:00:00'))).toBe(4);
  });

  it('is zero before the start rather than negative', () => {
    expect(fullYearsSince(FEBRUARY_2022, at('2021-06-01T00:00:00'))).toBe(0);
  });
});
