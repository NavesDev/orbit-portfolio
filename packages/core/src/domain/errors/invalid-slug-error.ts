import { DomainError } from './domain-error.ts';

export const SLUG_VIOLATIONS = {
  NOT_A_STRING: 'not-a-string',
  EMPTY: 'empty',
  OVER_BUDGET: 'over-budget',
  MALFORMED: 'malformed',
} as const;

export type SlugViolation = (typeof SLUG_VIOLATIONS)[keyof typeof SLUG_VIOLATIONS];

export class InvalidSlugError extends DomainError {
  readonly violation: SlugViolation;

  constructor(violation: SlugViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
