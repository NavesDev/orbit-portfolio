import { DomainError } from './domain-error.ts';

export const URL_VIOLATIONS = {
  NOT_A_STRING: 'not-a-string',
  EMPTY: 'empty',
  OVER_BUDGET: 'over-budget',
  NOT_ABSOLUTE: 'not-absolute',
  SCHEME_NOT_ALLOWED: 'scheme-not-allowed',
} as const;

export type UrlViolation = (typeof URL_VIOLATIONS)[keyof typeof URL_VIOLATIONS];

export class InvalidUrlError extends DomainError {
  readonly violation: UrlViolation;

  constructor(violation: UrlViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
