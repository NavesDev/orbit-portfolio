import type { ProjectCardView, ProjectDetailView } from '@portfolio/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getContent } from '../../content/index';
import { ProjectCard } from './project-card';

const CARD: ProjectCardView = {
  slug: 'orbit-portfolio',
  title: 'Orbit Portfolio',
  category: 'Personal portfolio',
  tags: ['Next.js'],
  progressPercent: 100,
  visualSvg: null,
};

const DETAIL: ProjectDetailView = {
  ...CARD,
  description: 'A bilingual portfolio.',
  repoUrl: 'https://github.com/NavesDev/orbit-portfolio',
  liveUrl: null,
  skills: [],
};

function renderCard(ordinal = 1, detail = DETAIL) {
  return render(
    <ProjectCard
      ordinal={ordinal}
      card={CARD}
      detail={detail}
      content={getContent('en-US').projects}
      locale="en-US"
    />,
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
      DETAIL.repoUrl,
    );
  });

  /* FR-09 */
  it('omits the repository control when repoUrl is absent', () => {
    renderCard(1, { ...DETAIL, repoUrl: null });

    expect(
      screen.queryByRole('link', { name: getContent('en-US').projects.repoCta }),
    ).not.toBeInTheDocument();
  });
});
