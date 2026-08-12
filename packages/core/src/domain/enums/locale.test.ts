import { describe, expect, it } from 'vitest';

import { DEFAULT_LOCALE, isLocale, LOCALES } from './locale.ts';

describe('LOCALES', () => {
  it('lists exactly the two supported locales', () => {
    expect(LOCALES).toEqual(['en-US', 'pt-BR']);
  });

  it('makes en-US the fallback, since every field is required to carry it', () => {
    expect(DEFAULT_LOCALE).toBe('en-US');
  });
});

describe('isLocale', () => {
  it.each(LOCALES)('accepts %s', (locale) => {
    expect(isLocale(locale)).toBe(true);
  });

  it.each(['en', 'en_US', 'pt', 'fr', '', 'EN-US'])('rejects %s', (value) => {
    expect(isLocale(value)).toBe(false);
  });
});
