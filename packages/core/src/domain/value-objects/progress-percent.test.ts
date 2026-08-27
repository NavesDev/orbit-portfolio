import { describe, expect, it } from 'vitest';

import {
  InvalidProgressPercentError,
  PROGRESS_PERCENT_VIOLATIONS,
} from '../errors/invalid-progress-percent-error.ts';
import { ProgressPercent } from './progress-percent.ts';

function violationOf(value: unknown): string {
  try {
    ProgressPercent.create(value);
  } catch (error) {
    if (error instanceof InvalidProgressPercentError) {
      return error.violation;
    }

    throw error;
  }

  throw new Error(`Expected ${JSON.stringify(value)} to be rejected, and it was not.`);
}

describe('ProgressPercent', () => {
  it('accepts null — a card renders no bar', () => {
    expect(ProgressPercent.create(null).value).toBeNull();
  });

  it('accepts 0', () => {
    expect(ProgressPercent.create(0).value).toBe(0);
  });

  it('accepts 100', () => {
    expect(ProgressPercent.create(100).value).toBe(100);
  });

  it('rejects a value below 0', () => {
    expect(violationOf(-1)).toBe(PROGRESS_PERCENT_VIOLATIONS.OUT_OF_RANGE);
  });

  it('rejects a value above 100', () => {
    expect(violationOf(150)).toBe(PROGRESS_PERCENT_VIOLATIONS.OUT_OF_RANGE);
  });

  it('rejects a non-integer', () => {
    expect(violationOf(50.5)).toBe(PROGRESS_PERCENT_VIOLATIONS.NOT_AN_INTEGER);
  });

  it('rejects a non-number, non-null value', () => {
    expect(violationOf('50')).toBe(PROGRESS_PERCENT_VIOLATIONS.NOT_AN_INTEGER);
  });
});
