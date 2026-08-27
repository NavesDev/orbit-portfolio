import { describe, expect, it } from 'vitest';

import { InvalidSlugError, SLUG_VIOLATIONS } from '../errors/invalid-slug-error.ts';
import * as SLUG_CONSTANTS from '../constants/slug.ts';
import { Slug } from './slug.ts';

function violationOf(value: unknown): string {
  try {
    Slug.create(value);
  } catch (error) {
    if (error instanceof InvalidSlugError) {
      return error.violation;
    }

    throw error;
  }

  throw new Error(`Expected ${JSON.stringify(value)} to be rejected, and it was not.`);
}

describe('Slug', () => {
  it('accepts a lowercase, hyphenated slug', () => {
    expect(Slug.create('orbit-portfolio').toString()).toBe('orbit-portfolio');
  });

  it('accepts a slug of digits and letters with no hyphen', () => {
    expect(() => Slug.create('portfolio2')).not.toThrow();
  });

  it('rejects a non-string', () => {
    expect(violationOf(42)).toBe(SLUG_VIOLATIONS.NOT_A_STRING);
  });

  it('rejects a blank string', () => {
    expect(violationOf('   ')).toBe(SLUG_VIOLATIONS.EMPTY);
  });

  it('rejects a slug over its budget', () => {
    expect(violationOf('a'.repeat(SLUG_CONSTANTS.MAX_LENGTH + 1))).toBe(
      SLUG_VIOLATIONS.OVER_BUDGET,
    );
  });

  it('rejects uppercase letters', () => {
    expect(violationOf('Orbit-Portfolio')).toBe(SLUG_VIOLATIONS.MALFORMED);
  });

  it('rejects a space', () => {
    expect(violationOf('orbit portfolio')).toBe(SLUG_VIOLATIONS.MALFORMED);
  });

  it('rejects a leading hyphen', () => {
    expect(violationOf('-orbit')).toBe(SLUG_VIOLATIONS.MALFORMED);
  });

  it('rejects a trailing hyphen', () => {
    expect(violationOf('orbit-')).toBe(SLUG_VIOLATIONS.MALFORMED);
  });

  it('rejects a doubled hyphen', () => {
    expect(violationOf('orbit--portfolio')).toBe(SLUG_VIOLATIONS.MALFORMED);
  });

  it('rejects an underscore', () => {
    expect(violationOf('orbit_portfolio')).toBe(SLUG_VIOLATIONS.MALFORMED);
  });

  it('two slugs of the same value are equal', () => {
    expect(Slug.create('orbit-portfolio').equals(Slug.create('orbit-portfolio'))).toBe(true);
  });
});
