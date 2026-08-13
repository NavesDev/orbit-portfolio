import { DomainError } from './domain-error.ts';

/**
 * Why a localized value was rejected, as a code rather than a message.
 *
 * A caller distinguishing "over budget" from "unknown locale" should not have
 * to parse prose to do it, and the messages are free to change.
 */
export const LOCALIZED_TEXT_VIOLATIONS = {
  NOT_AN_OBJECT: 'not-an-object',
  MISSING_DEFAULT_LOCALE: 'missing-default-locale',
  EMPTY_DEFAULT_LOCALE: 'empty-default-locale',
  UNKNOWN_LOCALE_KEY: 'unknown-locale-key',
  NOT_A_STRING: 'not-a-string',
  OVER_BUDGET: 'over-budget',
} as const;

export type LocalizedTextViolation =
  (typeof LOCALIZED_TEXT_VIOLATIONS)[keyof typeof LOCALIZED_TEXT_VIOLATIONS];

export class InvalidLocalizedTextError extends DomainError {
  readonly violation: LocalizedTextViolation;

  constructor(violation: LocalizedTextViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
