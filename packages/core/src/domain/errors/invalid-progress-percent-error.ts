import { DomainError } from './domain-error.ts';

export const PROGRESS_PERCENT_VIOLATIONS = {
  NOT_AN_INTEGER: 'not-an-integer',
  OUT_OF_RANGE: 'out-of-range',
} as const;

export type ProgressPercentViolation =
  (typeof PROGRESS_PERCENT_VIOLATIONS)[keyof typeof PROGRESS_PERCENT_VIOLATIONS];

export class InvalidProgressPercentError extends DomainError {
  readonly violation: ProgressPercentViolation;

  constructor(violation: ProgressPercentViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
