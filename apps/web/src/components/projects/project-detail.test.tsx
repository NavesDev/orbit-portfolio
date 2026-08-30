import type { ProjectDetailView } from '@portfolio/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getContent } from '../../content/index';
import { ProjectDetail } from './project-detail';

const DETAIL: ProjectDetailView = {
  slug: 'orbit-portfolio',
  title: 'Orbit Portfolio',
  summary: '**Bold** text and:',
  category: 'Personal portfolio',
  tags: ['Next.js', 'PostgreSQL'],
  progressPercent: 100,
  visualSvg: null,
  description: '**Bold** text and:\n\n- A first point\n- A second point',
  repoUrl: 'https://github.com/NavesDev/orbit-portfolio',
  liveUrl: null,
  skills: [{ name: 'Next.js', usageNote: 'App Router throughout.' }],
};

function renderDetail(detail: ProjectDetailView = DETAIL) {
  return render(<ProjectDetail detail={detail} content={getContent('en-US').projects} locale="en-US" />);
}

describe('ProjectDetail', () => {
  it('renders the title as the page heading', () => {
    renderDetail();

    expect(screen.getByRole('heading', { level: 1, name: 'Orbit Portfolio' })).toBeInTheDocument();
  });

  /* FR-06–FR-10, U-6 (no ordinal here — the eyebrow is only on the card) */
  it('renders the category without an ordinal', () => {
    renderDetail();

    expect(screen.getByText('Personal portfolio')).toBeInTheDocument();
  });

  it('renders markdown in the description, not raw syntax', () => {
    renderDetail();

    expect(screen.getByText('Bold').tagName).toBe('STRONG');
    expect(screen.getByText('A first point')).toBeInTheDocument();
    expect(screen.queryByText(/\*\*Bold\*\*/)).not.toBeInTheDocument();
  });

  it('renders every tag and applied skill', () => {
    renderDetail();

    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getAllByText('Next.js')).toHaveLength(2); // one tag, one applied skill
  });

  it('links to the repository when repoUrl is present', () => {
    renderDetail();

    expect(screen.getByRole('link', { name: getContent('en-US').projects.repoCta })).toHaveAttribute(
      'href',
      DETAIL.repoUrl,
    );
  });

  /* FR-09, same rule the card and (formerly) the modal already applied */
  it('omits the repository control when repoUrl is absent', () => {
    renderDetail({ ...DETAIL, repoUrl: null });

    expect(
      screen.queryByRole('link', { name: getContent('en-US').projects.repoCta }),
    ).not.toBeInTheDocument();
  });

  it('links back to the home page in the current locale', () => {
    renderDetail();

    expect(screen.getByRole('link', { name: getContent('en-US').projects.backCta })).toHaveAttribute(
      'href',
      '/en-US',
    );
  });
});
