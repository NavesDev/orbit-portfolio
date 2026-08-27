import type { SocialLinkView } from '@portfolio/core';
import { describe, expect, it } from 'vitest';

import { findContactUrl } from './contact-url';

function view(platform: string, url: string): SocialLinkView {
  return { platform, url, iconSvg: '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>' };
}

describe('findContactUrl', () => {
  it('picks the e-mail link out of the footer', () => {
    const url = findContactUrl([
      view('github', 'https://github.com/NavesDev'),
      view('email', 'mailto:someone@example.com'),
    ]);

    expect(url).toBe('mailto:someone@example.com');
  });

  /* The scheme decides, not the platform name — a row could be called anything. */
  it('reads the scheme rather than the platform name', () => {
    expect(findContactUrl([view('contato', 'MAILTO:someone@example.com')])).toBe(
      'MAILTO:someone@example.com',
    );
  });

  it('returns nothing when no e-mail link is published', () => {
    expect(findContactUrl([view('github', 'https://github.com/NavesDev')])).toBeNull();
  });

  it('returns nothing when there are no links at all', () => {
    expect(findContactUrl([])).toBeNull();
  });
});
