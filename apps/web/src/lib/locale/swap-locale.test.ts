import { describe, expect, it } from 'vitest';

import { swapLocale } from './swap-locale';

describe('swapLocale', () => {
  it('replaces the locale segment', () => {
    expect(swapLocale('/pt-BR', 'en-US')).toBe('/en-US');
  });

  it('keeps the rest of the path, so deep links survive the switch (FR-32)', () => {
    expect(swapLocale('/pt-BR/projetos/agendamento', 'en-US')).toBe(
      '/en-US/projetos/agendamento',
    );
  });

  it('handles a path with no locale segment yet', () => {
    expect(swapLocale('/', 'en-US')).toBe('/en-US');
  });
});
