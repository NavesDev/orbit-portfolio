import { describe, expect, it } from 'vitest';

import { DATE_RANGE_VIOLATIONS, InvalidDateRangeError } from '../errors/invalid-date-range-error.ts';
import { DateRange } from './date-range.ts';

function violationOf(startedOn: unknown, endedOn: unknown): string {
  try {
    DateRange.create({ startedOn, endedOn } as never);
  } catch (error) {
    if (error instanceof InvalidDateRangeError) {
      return error.violation;
    }

    throw error;
  }

  throw new Error('Expected the range to be rejected, and it was not.');
}

describe('DateRange', () => {
  it('accepts a started date with no end — open, ongoing', () => {
    const range = DateRange.create({ startedOn: '2026-01-01', endedOn: null });

    expect(range.startedOn).toBe('2026-01-01');
    expect(range.endedOn).toBeNull();
  });

  it('accepts both dates equal — a project started and finished the same day', () => {
    expect(() =>
      DateRange.create({ startedOn: '2026-01-01', endedOn: '2026-01-01' }),
    ).not.toThrow();
  });

  it('accepts both dates null', () => {
    expect(() => DateRange.create({ startedOn: null, endedOn: null })).not.toThrow();
  });

  it('rejects an end date before the start date', () => {
    expect(violationOf('2026-02-01', '2026-01-01')).toBe(
      DATE_RANGE_VIOLATIONS.END_BEFORE_START,
    );
  });

  it('rejects a malformed started_on', () => {
    expect(violationOf('01/01/2026', null)).toBe(DATE_RANGE_VIOLATIONS.MALFORMED_DATE);
  });

  it('rejects a malformed ended_on', () => {
    expect(violationOf('2026-01-01', 'not-a-date')).toBe(DATE_RANGE_VIOLATIONS.MALFORMED_DATE);
  });

  it('rejects a non-string, non-null started_on', () => {
    expect(violationOf(20260101, null)).toBe(DATE_RANGE_VIOLATIONS.MALFORMED_DATE);
  });
});
