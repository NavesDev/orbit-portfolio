import { DomainError } from './domain-error.ts';

export const PROJECT_VIOLATIONS = {
  SORT_ORDER_NOT_AN_INTEGER: 'sort-order-not-an-integer',
} as const;

export type ProjectViolation = (typeof PROJECT_VIOLATIONS)[keyof typeof PROJECT_VIOLATIONS];

export class InvalidProjectError extends DomainError {
  readonly violation: ProjectViolation;

  constructor(violation: ProjectViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
