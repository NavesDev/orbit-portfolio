import type { Locale, SocialLinkView } from '@portfolio/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getContent } from '../../content/index';
import { ClosingSection } from './closing-section';

function view(platform: string, url: string): SocialLinkView {
  return { platform, url, iconSvg: '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>' };
}

const LINKS = [
  view('github', 'https://github.com/NavesDev'),
  view('email', 'mailto:someone@example.com'),
];

function renderIn(locale: Locale, links: readonly SocialLinkView[] = LINKS) {
  return render(<ClosingSection content={getContent(locale).closing} links={links} />);
}

describe('ClosingSection', () => {
  it.each(['pt-BR', 'en-US'] as const)('renders the headline in %s', (locale) => {
    renderIn(locale);

    const { lead, emphasis, trail } = getContent(locale).closing.headline;

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      `${lead}${emphasis}${trail}`,
    );
  });

  it.each(['pt-BR', 'en-US'] as const)(
    'points the call to action at the published e-mail link in %s',
    (locale) => {
      renderIn(locale);

      expect(
        screen.getByRole('link', { name: getContent(locale).closing.action }),
      ).toHaveAttribute('href', 'mailto:someone@example.com');
    },
  );

  /* The rule FR-09 states for a project without a repository, applied here. */
  it('omits the call to action rather than rendering a dead control', () => {
    renderIn('pt-BR', [view('github', 'https://github.com/NavesDev')]);

    expect(
      screen.queryByRole('link', { name: getContent('pt-BR').closing.action }),
    ).not.toBeInTheDocument();
  });
});
