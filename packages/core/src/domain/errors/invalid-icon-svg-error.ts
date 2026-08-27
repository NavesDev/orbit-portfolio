import { DomainError } from './domain-error.ts';

/**
 * Why an icon was rejected, as a code rather than a message.
 *
 * This is the one value object where the reason is worth naming precisely: a
 * rejection here is a sanitization failure (NFR-07), and a log that says which
 * rule caught it is the difference between a fixed typo and an unnoticed
 * attempt.
 */
export const ICON_SVG_VIOLATIONS = {
  NOT_A_STRING: 'not-a-string',
  EMPTY: 'empty',
  OVER_BUDGET: 'over-budget',
  NOT_ROOTED_IN_SVG: 'not-rooted-in-svg',
  DISALLOWED_TAG: 'disallowed-tag',
  DISALLOWED_ATTRIBUTE: 'disallowed-attribute',
  EVENT_HANDLER: 'event-handler',
  DENIED_SCHEME: 'denied-scheme',
  MALFORMED: 'malformed',
} as const;

export type IconSvgViolation = (typeof ICON_SVG_VIOLATIONS)[keyof typeof ICON_SVG_VIOLATIONS];

export class InvalidIconSvgError extends DomainError {
  readonly violation: IconSvgViolation;

  constructor(violation: IconSvgViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
