import { describe, expect, it } from 'vitest';

import { DEFAULT_LOCALE, isLocale, LOCALES } from './locale.ts';

describe('LOCALES', () => {
  it('lists exactly the two supported locales', () => {
    expect(LOCALES).toEqual(['pt-BR', 'en']);
  });

  it('makes pt-BR the fallback', () => {
    expect(DEFAULT_LOCALE).toBe('pt-BR');
  });
});

describe('isLocale', () => {
  it.each(LOCALES)('accepts %s', (locale) => {
    expect(isLocale(locale)).toBe(true);
  });

  it.each(['en-US', 'pt', 'fr', '', 'PT-BR'])('rejects %s', (value) => {
    expect(isLocale(value)).toBe(false);
  });
});
