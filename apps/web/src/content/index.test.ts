import { LOCALES } from '@portfolio/core';
import { describe, expect, it } from 'vitest';

import { getContent } from './index';

/**
 * `testing.md` records that static content itself is not tested — a test would
 * assert a constant equals itself. These assert the *relationship* between the
 * two modules, which is the thing that actually breaks.
 */
describe('getContent', () => {
  it.each(LOCALES)('answers for %s', (locale) => {
    expect(getContent(locale).nav.mark).not.toHaveLength(0);
  });

  it('returns the copy of the locale it was asked for', () => {
    expect(getContent('en-US').nav.skipToContent).not.toBe(
      getContent('pt-BR').nav.skipToContent,
    );
  });

  it('carries the same number of strip phrases in both locales', () => {
    expect(getContent('pt-BR').strip.phrases).toHaveLength(
      getContent('en-US').strip.phrases.length,
    );
  });

  it('leaves proper nouns untranslated (FR-35)', () => {
    const leads = (locale: 'en-US' | 'pt-BR') =>
      getContent(locale).strip.phrases.map((phrase) => phrase.lead);

    expect(leads('pt-BR')).toEqual(leads('en-US'));
  });

  it("names every locale in the reader's own language", () => {
    expect(getContent('en-US').languageSwitcher.localeNames['pt-BR']).toBe('Portuguese');
    expect(getContent('pt-BR').languageSwitcher.localeNames['pt-BR']).toBe('Português');
  });
});
