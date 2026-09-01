import { DomainError } from './domain-error.ts';

export const TIMELINE_ENTRY_VIOLATIONS = {
  MISSING_ORGANIZATION: 'missing-organization',
  ORGANIZATION_OVER_BUDGET: 'organization-over-budget',
  SORT_ORDER_NOT_AN_INTEGER: 'sort-order-not-an-integer',
} as const;

export type TimelineEntryViolation =
  (typeof TIMELINE_ENTRY_VIOLATIONS)[keyof typeof TIMELINE_ENTRY_VIOLATIONS];

export class InvalidTimelineEntryError extends DomainError {
  readonly violation: TimelineEntryViolation;

  constructor(violation: TimelineEntryViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
