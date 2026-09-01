import type { TimelineEntryView } from '@portfolio/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { enUS } from '../../content/en-US/index';
import { ptBR } from '../../content/pt-BR/index';
import type { SiteContent } from '../../content/types';
import { TimelineItem } from './timeline-item';

const content = ptBR.timeline;

function entry(overrides: Partial<TimelineEntryView> = {}): TimelineEntryView {
  return {
    id: 'entry-1',
    kind: 'professional',
    title: 'Estagiário de Desenvolvimento',
    organization: 'Sea Tecnologia',
    description: null,
    credentialUrl: null,
    startedOn: '2025-12-01',
    endedOn: null,
    isOngoing: true,
    skills: ['Java', 'Liferay'],
    ...overrides,
  };
}

function renderItem(
  overrides: Partial<TimelineEntryView> = {},
  onOpenDetails = vi.fn(),
  copy: SiteContent['timeline'] = content,
) {
  render(
    <ul>
      <TimelineItem
        entry={entry(overrides)}
        side="left"
        isPassed={false}
        content={copy}
        onOpenDetails={onOpenDetails}
      />
    </ul>,
  );

  return onOpenDetails;
}

describe('TimelineItem', () => {
  it('shows the kind, period, title, organization and skills (FR-12)', () => {
    renderItem();

    expect(screen.getByText('Profissional')).toBeInTheDocument();
    expect(screen.getByText('2025 — atual')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Estagiário de Desenvolvimento' })).toBeInTheDocument();
    expect(screen.getByText('Sea Tecnologia')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Habilidades' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toContain('Java');
  });

  it('names the details control after the entry it opens, keeping its visible text', () => {
    renderItem();

    expect(
      screen.getByRole('button', { name: 'Ver detalhes: Estagiário de Desenvolvimento' }),
    ).toBeInTheDocument();
  });

  it('hands the trigger back so focus can return to it', async () => {
    const onOpenDetails = renderItem();
    const trigger = screen.getByRole('button', { name: /Ver detalhes/ });

    await userEvent.click(trigger);

    expect(onOpenDetails).toHaveBeenCalledWith(expect.objectContaining({ id: 'entry-1' }), trigger);
  });

  it('renders no skills list for an entry with none rather than an empty one', () => {
    renderItem({ skills: [] });

    expect(screen.queryByRole('list', { name: 'Habilidades' })).not.toBeInTheDocument();
  });

  /*
   * FR-13 in the place a visitor meets it. `period.test.ts` already covers the
   * same four wordings against the formatter; these assert that the card
   * actually reaches for the right one, which is a different failure — a card
   * wired to `kindLabels` instead of `ongoing` would pass every formatter test.
   */
  describe('an entry whose period has no end (FR-13)', () => {
    it('reads "atual" for an ongoing role, in pt-BR', () => {
      renderItem({ kind: 'professional' }, vi.fn(), ptBR.timeline);

      expect(screen.getByText('2025 — atual')).toBeInTheDocument();
    });

    it('reads "present" for an ongoing role, in en-US', () => {
      renderItem({ kind: 'professional' }, vi.fn(), enUS.timeline);

      expect(screen.getByText('2025 — present')).toBeInTheDocument();
    });

    it('reads "não expira" for a certification, in pt-BR', () => {
      renderItem({ kind: 'certification', startedOn: '2026-07-25' }, vi.fn(), ptBR.timeline);

      expect(screen.getByText('2026 — não expira')).toBeInTheDocument();
    });

    it('reads "no expiry" for a certification, in en-US', () => {
      renderItem({ kind: 'certification', startedOn: '2026-07-25' }, vi.fn(), enUS.timeline);

      expect(screen.getByText('2026 — no expiry')).toBeInTheDocument();
    });
  });
});