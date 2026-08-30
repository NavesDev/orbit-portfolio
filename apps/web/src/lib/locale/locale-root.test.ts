import { describe, expect, it } from 'vitest';

import { isLocaleRoot } from './locale-root';

describe('isLocaleRoot', () => {
  it('accepts a locale home page', () => {
    expect(isLocaleRoot('/pt-BR')).toBe(true);
    expect(isLocaleRoot('/en-US')).toBe(true);
  });

  it('accepts one with a trailing slash — it is the same page', () => {
    expect(isLocaleRoot('/pt-BR/')).toBe(true);
  });

  it('rejects a page nested under the locale', () => {
    expect(isLocaleRoot('/pt-BR/projetos/orbit-portfolio')).toBe(false);
    expect(isLocaleRoot('/en-US/projetos')).toBe(false);
  });

  it('rejects the bare root, which only ever redirects to a locale', () => {
    expect(isLocaleRoot('/')).toBe(false);
  });
});
