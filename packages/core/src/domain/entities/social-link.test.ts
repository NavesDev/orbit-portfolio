import { describe, expect, it } from 'vitest';

import {
  InvalidSocialLinkError,
  SOCIAL_LINK_VIOLATIONS,
} from '../errors/invalid-social-link-error.ts';
import { IconSvg } from '../value-objects/icon-svg.ts';
import { SocialLink, type SocialLinkProperties } from './social-link.ts';

const ICON = IconSvg.create('<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>');

function properties(overrides: Partial<SocialLinkProperties> = {}): SocialLinkProperties {
  return {
    id: '5f1f1f1f-1f1f-4f1f-8f1f-1f1f1f1f1f1f',
    platform: 'github',
    url: 'https://github.com/NavesDev',
    iconSvg: ICON,
    isPublished: true,
    sortOrder: 0,
    ...overrides,
  };
}

function violationOf(overrides: Partial<SocialLinkProperties>): string {
  try {
    SocialLink.create(properties(overrides));
  } catch (error) {
    if (error instanceof InvalidSocialLinkError) {
      return error.violation;
    }

    throw error;
  }

  throw new Error('Expected the link to be rejected, and it was not.');
}

describe('SocialLink', () => {
  it('holds the platform as the link’s accessible name', () => {
    expect(SocialLink.create(properties()).platform).toBe('github');
  });

  it('accepts a mailto: URL, which is how the site takes contact (WN-04)', () => {
    const link = SocialLink.create(
      properties({ platform: 'email', url: 'mailto:someone@example.com' }),
    );

    expect(link.url).toBe('mailto:someone@example.com');
  });

  it('rejects a relative URL', () => {
    expect(violationOf({ url: '/contact' })).toBe(SOCIAL_LINK_VIOLATIONS.URL_NOT_ABSOLUTE);
  });

  it('rejects a javascript: URL', () => {
    expect(violationOf({ url: 'javascript:alert(1)' })).toBe(
      SOCIAL_LINK_VIOLATIONS.URL_SCHEME_NOT_ALLOWED,
    );
  });

  it('rejects a blank platform, which would leave the anchor unnamed', () => {
    expect(violationOf({ platform: '   ' })).toBe(SOCIAL_LINK_VIOLATIONS.MISSING_PLATFORM);
  });

  it('rejects a platform over its budget', () => {
    expect(violationOf({ platform: 'p'.repeat(41) })).toBe(
      SOCIAL_LINK_VIOLATIONS.PLATFORM_OVER_BUDGET,
    );
  });

  it('rejects a fractional sort order', () => {
    expect(violationOf({ sortOrder: 1.5 })).toBe(
      SOCIAL_LINK_VIOLATIONS.SORT_ORDER_NOT_AN_INTEGER,
    );
  });
});
