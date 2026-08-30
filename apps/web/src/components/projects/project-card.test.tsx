import type { ProjectCardView } from '@portfolio/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getContent } from '../../content/index';
import { ProjectCard } from './project-card';

const CARD: ProjectCardView = {
  slug: 'orbit-portfolio',
  title: 'Orbit Portfolio',
  summary: 'A bilingual portfolio built on persisted content.',
  category: 'Personal portfolio',
  tags: ['Next.js'],
  progressPercent: 100,
  visualSvg: null,
  repoUrl: 'https://github.com/NavesDev/orbit-portfolio',
};

function renderCard(ordinal = 1, card = CARD) {
  return render(
    <ProjectCard ordinal={ordinal} card={card} content={getContent('en-US').projects} locale="en-US" />,
  );
}

describe('ProjectCard', () => {
  it('renders the eyebrow as a zero-padded ordinal plus the category (U-6)', () => {
    renderCard(1);

    expect(screen.getByText('01 — Personal portfolio')).toBeInTheDocument();
  });

  it('pads a two-digit ordinal without truncating it', () => {
    renderCard(12);

    expect(screen.getByText('12 — Personal portfolio')).toBeInTheDocument();
  });

  it('renders every tag', () => {
    renderCard();

    expect(screen.getByText('Next.js')).toBeInTheDocument();
  });

  /* roadmap 4.2 — "ver detalhes" navigates to the project's own page. */
  it('links "view details" to the project detail page in the current locale', () => {
    renderCard();

    expect(screen.getByRole('link', { name: getContent('en-US').projects.detailsCta })).toHaveAttribute(
      'href',
      '/en-US/projetos/orbit-portfolio',
    );
  });

  it('links to the repository when repoUrl is present', () => {
    renderCard();

    expect(screen.getByRole('link', { name: getContent('en-US').projects.repoCta })).toHaveAttribute(
      'href',
      CARD.repoUrl,
    );
  });

  /* FR-09 */
  it('omits the repository control when repoUrl is absent', () => {
    renderCard(1, { ...CARD, repoUrl: null });

    expect(
      screen.queryByRole('link', { name: getContent('en-US').projects.repoCta }),
    ).not.toBeInTheDocument();
  });

  it('shows the project’s summary line', () => {
    renderCard();

    expect(
      screen.getByText('A bilingual portfolio built on persisted content.'),
    ).toBeInTheDocument();
  });

  it('omits the summary line for a project that has none', () => {
    renderCard(1, { ...CARD, summary: null });

    expect(
      screen.queryByText('A bilingual portfolio built on persisted content.'),
    ).not.toBeInTheDocument();
  });
});
