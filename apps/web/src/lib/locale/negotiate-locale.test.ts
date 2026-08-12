import { describe, expect, it } from 'vitest';

import { negotiateLocale } from './negotiate-locale';

describe('negotiateLocale', () => {
  it('picks en-US for an English browser (FR-30)', () => {
    expect(negotiateLocale('en-GB,en;q=0.9')).toBe('en-US');
  });

  it('picks pt-BR for a Portuguese browser (FR-30)', () => {
    expect(negotiateLocale('pt-BR,pt;q=0.9,en;q=0.8')).toBe('pt-BR');
  });

  it('matches a bare primary subtag to its supported locale', () => {
    expect(negotiateLocale('pt')).toBe('pt-BR');
    expect(negotiateLocale('en')).toBe('en-US');
  });

  it('falls back to en-US for an unsupported language (FR-31)', () => {
    expect(negotiateLocale('fr-FR,fr;q=0.9')).toBe('en-US');
  });

  it('falls back to en-US for an absent header (FR-31)', () => {
    expect(negotiateLocale(null)).toBe('en-US');
  });

  it('falls back to en-US for an empty header', () => {
    expect(negotiateLocale('')).toBe('en-US');
  });

  it('honours q-values rather than document order', () => {
    expect(negotiateLocale('pt-BR;q=0.3,en;q=0.9')).toBe('en-US');
  });

  it('ignores a language explicitly refused with q=0', () => {
    expect(negotiateLocale('en;q=0,pt-BR;q=0.5')).toBe('pt-BR');
  });

  it('is case-insensitive about tags', () => {
    expect(negotiateLocale('PT-br')).toBe('pt-BR');
  });

  it('ignores the wildcard rather than treating it as a match', () => {
    expect(negotiateLocale('*')).toBe('en-US');
  });
});
