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

  it('leaves the wordmark untranslated — it is a name (FR-35)', () => {
    expect(getContent('pt-BR').nav.mark).toBe(getContent('en-US').nav.mark);
  });

  it('carries a label for every stat figure in both locales', () => {
    expect(Object.keys(getContent('pt-BR').band.statLabels)).toEqual(
      Object.keys(getContent('en-US').band.statLabels),
    );
  });

  it('translates the availability badge in both directions (FR-02)', () => {
    for (const locale of LOCALES) {
      const { availability } = getContent(locale).hero;

      expect(availability.open).not.toBe(availability.closed);
    }
  });

  it("names every locale in the reader's own language, including its visible label", () => {
    expect(getContent('en-US').languageSwitcher.localeNames['pt-BR']).toBe('Portuguese (PT)');
    expect(getContent('pt-BR').languageSwitcher.localeNames['pt-BR']).toBe('Português (PT)');
  });
});
