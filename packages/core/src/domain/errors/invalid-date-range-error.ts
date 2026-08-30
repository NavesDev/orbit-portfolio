import { DomainError } from './domain-error.ts';

export const DATE_RANGE_VIOLATIONS = {
  MALFORMED_DATE: 'malformed-date',
  END_BEFORE_START: 'end-before-start',
} as const;

export type DateRangeViolation = (typeof DATE_RANGE_VIOLATIONS)[keyof typeof DATE_RANGE_VIOLATIONS];

export class InvalidDateRangeError extends DomainError {
  readonly violation: DateRangeViolation;

  constructor(violation: DateRangeViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
