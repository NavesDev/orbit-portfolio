import { DomainError } from './domain-error.ts';

/**
 * Violations of what every entity owes, whatever it is.
 *
 * Separate from each entity's own violations because the code is what a caller
 * matches on: an id missing on a `SocialLink` and an id missing on a `Project`
 * are one fault with one fix, and giving each entity its own name for it would
 * mean handling the same problem four times.
 */
export const ENTITY_VIOLATIONS = {
  MISSING_ID: 'missing-id',
} as const;

export type EntityViolation = (typeof ENTITY_VIOLATIONS)[keyof typeof ENTITY_VIOLATIONS];

export class InvalidEntityError extends DomainError {
  readonly violation: EntityViolation;

  constructor(violation: EntityViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
