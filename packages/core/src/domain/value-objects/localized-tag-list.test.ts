import { describe, expect, it } from 'vitest';

import {
  InvalidLocalizedTagListError,
  LOCALIZED_TAG_LIST_VIOLATIONS,
} from '../errors/invalid-localized-tag-list-error.ts';
import { LocalizedTagList } from './localized-tag-list.ts';

const MAX_ITEM_LENGTH = 60;
const MAX_ITEMS = 8;

function violationOf(values: unknown): string {
  try {
    LocalizedTagList.create(values, MAX_ITEM_LENGTH, MAX_ITEMS);
  } catch (error) {
    if (error instanceof InvalidLocalizedTagListError) {
      return error.violation;
    }

    throw error;
  }

  throw new Error(`Expected ${JSON.stringify(values)} to be rejected, and it was not.`);
}

describe('LocalizedTagList', () => {
  it('resolves the requested locale', () => {
    const tags = LocalizedTagList.create(
      { 'en-US': ['Real-time calendar'], 'pt-BR': ['Calendário em tempo real'] },
      MAX_ITEM_LENGTH,
      MAX_ITEMS,
    );

    expect(tags.resolve('pt-BR')).toEqual(['Calendário em tempo real']);
    expect(tags.resolve('en-US')).toEqual(['Real-time calendar']);
  });

  it('falls back to en-US when the requested locale has no entry (FR-34)', () => {
    const tags = LocalizedTagList.create({ 'en-US': ['Next.js'] }, MAX_ITEM_LENGTH, MAX_ITEMS);

    expect(tags.resolve('pt-BR')).toEqual(['Next.js']);
  });

  it('rejects a non-object', () => {
    expect(violationOf('Next.js')).toBe(LOCALIZED_TAG_LIST_VIOLATIONS.NOT_AN_OBJECT);
  });

  it('rejects an array at the top level', () => {
    expect(violationOf(['Next.js'])).toBe(LOCALIZED_TAG_LIST_VIOLATIONS.NOT_AN_OBJECT);
  });

  it('rejects an unknown locale key', () => {
    expect(violationOf({ 'en-US': ['Next.js'], fr: ['Next.js'] })).toBe(
      LOCALIZED_TAG_LIST_VIOLATIONS.UNKNOWN_LOCALE_KEY,
    );
  });

  it('rejects a locale entry that is not an array', () => {
    expect(violationOf({ 'en-US': 'Next.js' })).toBe(LOCALIZED_TAG_LIST_VIOLATIONS.NOT_AN_ARRAY);
  });

  it('rejects an item that is not a string', () => {
    expect(violationOf({ 'en-US': [42] })).toBe(LOCALIZED_TAG_LIST_VIOLATIONS.ITEM_NOT_A_STRING);
  });

  it('rejects an item over its budget', () => {
    expect(violationOf({ 'en-US': ['a'.repeat(MAX_ITEM_LENGTH + 1)] })).toBe(
      LOCALIZED_TAG_LIST_VIOLATIONS.ITEM_OVER_BUDGET,
    );
  });

  it('rejects more items than the cap', () => {
    expect(violationOf({ 'en-US': Array.from({ length: MAX_ITEMS + 1 }, () => 'x') })).toBe(
      LOCALIZED_TAG_LIST_VIOLATIONS.TOO_MANY_ITEMS,
    );
  });

  it('rejects a missing en-US entry (FR-34)', () => {
    expect(violationOf({ 'pt-BR': ['Next.js'] })).toBe(
      LOCALIZED_TAG_LIST_VIOLATIONS.MISSING_DEFAULT_LOCALE,
    );
  });

  it('accepts an empty list for the required locale', () => {
    expect(() => LocalizedTagList.create({ 'en-US': [] }, MAX_ITEM_LENGTH, MAX_ITEMS)).not.toThrow();
  });
});
