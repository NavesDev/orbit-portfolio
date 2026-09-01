import type { GetTimelineOutput } from '@portfolio/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ptBR } from '../../content/pt-BR/index';
import { TimelineSection } from './timeline-section';

const initial: GetTimelineOutput = {
  entries: [
    {
      id: 'entry-1',
      kind: 'academic',
      title: 'Análise e Desenvolvimento de Sistemas',
      organization: 'Universidade Paulista (UNIP)',
      description: null,
      credentialUrl: null,
      startedOn: '2025-02-01',
      endedOn: null,
      isOngoing: true,
      skills: [],
    },
  ],
  total: 1,
};

describe('TimelineSection', () => {
  it('names its landmark with the heading, so it is listed as a region', () => {
    render(<TimelineSection content={ptBR.timeline} initial={initial} locale="pt-BR" />);

    expect(
      screen.getByRole('region', { name: 'Formação e experiência, na mesma linha do tempo.' }),
    ).toBeInTheDocument();
  });

  it('shows the kicker and renders the entries it was given', () => {
    render(<TimelineSection content={ptBR.timeline} initial={initial} locale="pt-BR" />);

    expect(screen.getByText('Trajetória')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Análise e Desenvolvimento de Sistemas' }),
    ).toBeInTheDocument();
  });
});
