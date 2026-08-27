import type { ListFeaturedProjectsOutput } from '@portfolio/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getContent } from '../../content/index';
import { ProjectsSection } from './projects-section';

const RESULT: ListFeaturedProjectsOutput = {
  projects: [
    {
      slug: 'first',
      title: 'First Project',
      category: 'Category A',
      tags: ['Next.js'],
      progressPercent: 50,
      visualSvg: null,
    },
    {
      slug: 'second',
      title: 'Second Project',
      category: 'Category B',
      tags: [],
      progressPercent: null,
      visualSvg: null,
    },
  ],
  details: {
    first: {
      slug: 'first',
      title: 'First Project',
      category: 'Category A',
      tags: ['Next.js'],
      progressPercent: 50,
      visualSvg: null,
      description: null,
      repoUrl: null,
      liveUrl: null,
      skills: [],
    },
    second: {
      slug: 'second',
      title: 'Second Project',
      category: 'Category B',
      tags: [],
      progressPercent: null,
      visualSvg: null,
      description: null,
      repoUrl: null,
      liveUrl: null,
      skills: [],
    },
  },
};

describe('ProjectsSection', () => {
  it('renders one card per featured project, numbered by position (U-6)', () => {
    render(<ProjectsSection content={getContent('en-US').projects} result={RESULT} locale="en-US" />);

    expect(screen.getByText('01 — Category A')).toBeInTheDocument();
    expect(screen.getByText('02 — Category B')).toBeInTheDocument();
  });

  it('links "see all projects" to the current locale', () => {
    render(<ProjectsSection content={getContent('pt-BR').projects} result={RESULT} locale="pt-BR" />);

    expect(screen.getByRole('link', { name: getContent('pt-BR').projects.viewAll })).toHaveAttribute(
      'href',
      '/pt-BR/projetos',
    );
  });

  it('renders nothing card-shaped when there are no featured projects', () => {
    render(
      <ProjectsSection
        content={getContent('en-US').projects}
        result={{ projects: [], details: {} }}
        locale="en-US"
      />,
    );

    expect(screen.queryAllByRole('button', { name: getContent('en-US').projects.detailsCta })).toHaveLength(0);
  });
});
