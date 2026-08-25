import { DomainError } from './domain-error.ts';

export const SOCIAL_LINK_VIOLATIONS = {
  MISSING_ID: 'missing-id',
  MISSING_PLATFORM: 'missing-platform',
  PLATFORM_OVER_BUDGET: 'platform-over-budget',
  MISSING_URL: 'missing-url',
  URL_OVER_BUDGET: 'url-over-budget',
  URL_NOT_ABSOLUTE: 'url-not-absolute',
  URL_SCHEME_NOT_ALLOWED: 'url-scheme-not-allowed',
  SORT_ORDER_NOT_AN_INTEGER: 'sort-order-not-an-integer',
} as const;

export type SocialLinkViolation =
  (typeof SOCIAL_LINK_VIOLATIONS)[keyof typeof SOCIAL_LINK_VIOLATIONS];

export class InvalidSocialLinkError extends DomainError {
  readonly violation: SocialLinkViolation;

  constructor(violation: SocialLinkViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
