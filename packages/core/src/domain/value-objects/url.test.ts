import { describe, expect, it } from 'vitest';

import { InvalidUrlError, URL_VIOLATIONS } from '../errors/invalid-url-error.ts';
import * as URL_CONSTANTS from '../constants/url.ts';
import { Url } from './url.ts';

function violationOf(value: unknown): string {
  try {
    Url.create(value);
  } catch (error) {
    if (error instanceof InvalidUrlError) {
      return error.violation;
    }

    throw error;
  }

  throw new Error(`Expected ${JSON.stringify(value)} to be rejected, and it was not.`);
}

describe('Url', () => {
  it('accepts an absolute https URL', () => {
    expect(Url.create('https://github.com/NavesDev/orbit-portfolio').toString()).toBe(
      'https://github.com/NavesDev/orbit-portfolio',
    );
  });

  it('rejects a non-string', () => {
    expect(violationOf(42)).toBe(URL_VIOLATIONS.NOT_A_STRING);
  });

  it('rejects a blank string', () => {
    expect(violationOf('  ')).toBe(URL_VIOLATIONS.EMPTY);
  });

  it('rejects a URL over its budget', () => {
    const overBudget = `https://example.com/${'a'.repeat(URL_CONSTANTS.MAX_LENGTH)}`;
    expect(violationOf(overBudget)).toBe(URL_VIOLATIONS.OVER_BUDGET);
  });

  it('rejects a relative path', () => {
    expect(violationOf('/projetos/orbit-portfolio')).toBe(URL_VIOLATIONS.NOT_ABSOLUTE);
  });

  it('rejects an http URL', () => {
    expect(violationOf('http://example.com')).toBe(URL_VIOLATIONS.SCHEME_NOT_ALLOWED);
  });

  it('rejects a mailto URL', () => {
    expect(violationOf('mailto:someone@example.com')).toBe(URL_VIOLATIONS.SCHEME_NOT_ALLOWED);
  });

  it('rejects a javascript URL', () => {
    expect(violationOf('javascript:alert(1)')).toBe(URL_VIOLATIONS.SCHEME_NOT_ALLOWED);
  });

  it('two URLs of the same value are equal', () => {
    expect(Url.create('https://example.com').equals(Url.create('https://example.com'))).toBe(
      true,
    );
  });
});
