import { describe, expect, it } from 'vitest';

import { TITLE_MAX_LENGTH } from '../constants/text-budgets.ts';
import {
  InvalidLocalizedTextError,
  LOCALIZED_TEXT_VIOLATIONS,
  type LocalizedTextViolation,
} from '../errors/invalid-localized-text-error.ts';
import { LocalizedText } from './localized-text.ts';

function expectViolation(
  create: () => unknown,
  violation: LocalizedTextViolation,
): void {
  expect(create).toThrow(InvalidLocalizedTextError);

  try {
    create();
  } catch (error) {
    expect((error as InvalidLocalizedTextError).violation).toBe(violation);
  }
}

describe('LocalizedText.create', () => {
  it('rejects a value that is not a plain object', () => {
    expectViolation(
      () => LocalizedText.create('Scheduling system', TITLE_MAX_LENGTH),
      LOCALIZED_TEXT_VIOLATIONS.NOT_AN_OBJECT,
    );
  });

  it('rejects an array', () => {
    expectViolation(
      () => LocalizedText.create(['Scheduling system'], TITLE_MAX_LENGTH),
      LOCALIZED_TEXT_VIOLATIONS.NOT_AN_OBJECT,
    );
  });

  it('rejects a missing en-US entry', () => {
    expectViolation(
      () =>
        LocalizedText.create({ 'pt-BR': 'Sistema de agendamento' }, TITLE_MAX_LENGTH),
      LOCALIZED_TEXT_VIOLATIONS.MISSING_DEFAULT_LOCALE,
    );
  });

  it('rejects a blank en-US entry, which would render as empty space', () => {
    expectViolation(
      () => LocalizedText.create({ 'en-US': '   ' }, TITLE_MAX_LENGTH),
      LOCALIZED_TEXT_VIOLATIONS.EMPTY_DEFAULT_LOCALE,
    );
  });

  it('rejects an unknown locale key', () => {
    expectViolation(
      () =>
        LocalizedText.create(
          { 'en-US': 'Scheduling system', en: 'Scheduling system' },
          TITLE_MAX_LENGTH,
        ),
      LOCALIZED_TEXT_VIOLATIONS.UNKNOWN_LOCALE_KEY,
    );
  });

  it('rejects a non-string value', () => {
    expectViolation(
      () => LocalizedText.create({ 'en-US': 42 }, TITLE_MAX_LENGTH),
      LOCALIZED_TEXT_VIOLATIONS.NOT_A_STRING,
    );
  });

  it('rejects a value over the budget it was given', () => {
    expectViolation(
      () =>
        LocalizedText.create(
          { 'en-US': 'a'.repeat(TITLE_MAX_LENGTH + 1) },
          TITLE_MAX_LENGTH,
        ),
      LOCALIZED_TEXT_VIOLATIONS.OVER_BUDGET,
    );
  });

  it('accepts a value exactly at the budget', () => {
    const text = LocalizedText.create(
      { 'en-US': 'a'.repeat(TITLE_MAX_LENGTH) },
      TITLE_MAX_LENGTH,
    );

    expect(text.resolve('en-US')).toHaveLength(TITLE_MAX_LENGTH);
  });
});

describe('LocalizedText.resolve', () => {
  it('returns the requested locale when it is present', () => {
    const text = LocalizedText.create(
      { 'en-US': 'Scheduling system', 'pt-BR': 'Sistema de agendamento' },
      TITLE_MAX_LENGTH,
    );

    expect(text.resolve('pt-BR')).toBe('Sistema de agendamento');
  });

  it('falls back to en-US when the requested locale is absent (FR-34)', () => {
    const text = LocalizedText.create(
      { 'en-US': 'Scheduling system' },
      TITLE_MAX_LENGTH,
    );

    expect(text.resolve('pt-BR')).toBe('Scheduling system');
  });
});

describe('LocalizedText.toJSON', () => {
  it('returns a copy, so the value object cannot be mutated through it', () => {
    const text = LocalizedText.create(
      { 'en-US': 'Scheduling system' },
      TITLE_MAX_LENGTH,
    );

    const copy = text.toJSON();
    copy['en-US'] = 'mutated';

    expect(text.resolve('en-US')).toBe('Scheduling system');
  });
});
