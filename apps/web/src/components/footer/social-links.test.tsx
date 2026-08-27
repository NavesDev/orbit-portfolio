import type { SocialLinkView } from '@portfolio/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getContent } from '../../content/index';
import { SocialLinks } from './social-links';

const LABEL = getContent('pt-BR').closing.linksLabel;

function view(platform: string, url: string): SocialLinkView {
  return {
    platform,
    url,
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M0 0"/></svg>`,
  };
}

const LINKS = [
  view('github', 'https://github.com/NavesDev'),
  view('linkedin', 'https://www.linkedin.com/in/example/'),
  view('email', 'mailto:someone@example.com'),
];

describe('SocialLinks', () => {
  it('names each icon-only link by its platform (FR-24)', () => {
    render(<SocialLinks links={LINKS} label={LABEL} />);

    expect(screen.getByRole('link', { name: 'github' })).toHaveAttribute(
      'href',
      'https://github.com/NavesDev',
    );
    expect(screen.getByRole('link', { name: 'linkedin' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'email' })).toBeInTheDocument();
  });

  it('renders the links the use case gave it, in that order (FR-23)', () => {
    render(<SocialLinks links={LINKS} label={LABEL} />);

    const names = screen.getAllByRole('link').map((link) => link.getAttribute('aria-label'));

    expect(names).toEqual(['github', 'linkedin', 'email']);
  });

  /*
   * The point of storing markup rather than a URL: an <img> could not inherit
   * the anchor's hover colour. If the icon ever stopped being inlined, this is
   * the assertion that would notice.
   */
  it('inlines the icon so it can inherit currentColor', () => {
    render(<SocialLinks links={LINKS} label={LABEL} />);

    const icon = screen.getByRole('link', { name: 'github' }).querySelector('svg');

    expect(icon).not.toBeNull();
    expect(icon?.getAttribute('stroke')).toBe('currentColor');
  });

  it('gives the group of links an accessible name of its own', () => {
    render(<SocialLinks links={LINKS} label={LABEL} />);

    expect(screen.getByRole('list', { name: LABEL })).toBeInTheDocument();
  });

  it('opens a web destination in its own tab with the opener detached', () => {
    render(<SocialLinks links={LINKS} label={LABEL} />);

    const github = screen.getByRole('link', { name: 'github' });

    expect(github).toHaveAttribute('target', '_blank');
    expect(github).toHaveAttribute('rel', 'noopener noreferrer');
  });

  /* A blank tab left behind after the mail client opens is not a new window. */
  it('opens an e-mail link in place', () => {
    render(<SocialLinks links={LINKS} label={LABEL} />);

    expect(screen.getByRole('link', { name: 'email' })).not.toHaveAttribute('target');
  });

  it('renders an empty footer rather than failing when nothing is published', () => {
    render(<SocialLinks links={[]} label={LABEL} />);

    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
