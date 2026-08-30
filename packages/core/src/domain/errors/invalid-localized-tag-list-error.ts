import { DomainError } from './domain-error.ts';

export const LOCALIZED_TAG_LIST_VIOLATIONS = {
  NOT_AN_OBJECT: 'not-an-object',
  UNKNOWN_LOCALE_KEY: 'unknown-locale-key',
  NOT_AN_ARRAY: 'not-an-array',
  ITEM_NOT_A_STRING: 'item-not-a-string',
  ITEM_OVER_BUDGET: 'item-over-budget',
  TOO_MANY_ITEMS: 'too-many-items',
  MISSING_DEFAULT_LOCALE: 'missing-default-locale',
} as const;

export type LocalizedTagListViolation =
  (typeof LOCALIZED_TAG_LIST_VIOLATIONS)[keyof typeof LOCALIZED_TAG_LIST_VIOLATIONS];

export class InvalidLocalizedTagListError extends DomainError {
  readonly violation: LocalizedTagListViolation;

  constructor(violation: LocalizedTagListViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
