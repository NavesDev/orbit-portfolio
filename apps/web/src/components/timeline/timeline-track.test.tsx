import type { GetTimelineOutput, TimelineEntryView } from '@portfolio/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ptBR } from '../../content/pt-BR/index';
import { TimelineTrack } from './timeline-track';

const content = ptBR.timeline;

function entry(id: string, title: string): TimelineEntryView {
  return {
    id,
    kind: 'professional',
    title,
    organization: 'Sea Tecnologia',
    description: 'Portais.',
    credentialUrl: null,
    startedOn: '2025-12-01',
    endedOn: null,
    isOngoing: true,
    skills: ['Java'],
  };
}

function page(titles: readonly string[], total: number): GetTimelineOutput {
  return { entries: titles.map((title) => entry(title, title)), total };
}

function headings(): string[] {
  return screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent ?? '');
}

describe('TimelineTrack', () => {
  it('renders the page it was handed', () => {
    render(<TimelineTrack initial={page(['a', 'b'], 2)} content={content} locale="pt-BR" />);

    expect(headings()).toEqual(['a', 'b']);
  });

  it('offers no "show more" while the first page is the whole trajectory', () => {
    render(<TimelineTrack initial={page(['a', 'b'], 2)} content={content} locale="pt-BR" />);

    expect(screen.queryByRole('button', { name: 'Ver mais da trajetória' })).not.toBeInTheDocument();
  });

  it('appends the next page and asks for it from where the list ends', async () => {
    const loadMore = vi.fn().mockResolvedValue(page(['c'], 3));
    render(
      <TimelineTrack
        initial={page(['a', 'b'], 3)}
        content={content}
        locale="pt-BR"
        loadMore={loadMore}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ver mais da trajetória' }));

    expect(loadMore).toHaveBeenCalledWith('pt-BR', 2);
    expect(headings()).toEqual(['a', 'b', 'c']);
  });

  it('drops the control once every entry is on the page', async () => {
    const loadMore = vi.fn().mockResolvedValue(page(['c'], 3));
    render(
      <TimelineTrack
        initial={page(['a', 'b'], 3)}
        content={content}
        locale="pt-BR"
        loadMore={loadMore}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ver mais da trajetória' }));

    expect(screen.queryByRole('button', { name: 'Ver mais da trajetória' })).not.toBeInTheDocument();
  });

  describe('the detail modal (NFR-05)', () => {
    it('opens the entry the visitor asked for', async () => {
      render(<TimelineTrack initial={page(['a', 'b'], 2)} content={content} locale="pt-BR" />);

      await userEvent.click(screen.getByRole('button', { name: 'Ver detalhes: b' }));

      expect(screen.getByRole('dialog', { name: 'b' })).toBeInTheDocument();
    });

    it('closes and returns focus to the control that opened it', async () => {
      render(<TimelineTrack initial={page(['a', 'b'], 2)} content={content} locale="pt-BR" />);
      const trigger = screen.getByRole('button', { name: 'Ver detalhes: b' });

      await userEvent.click(trigger);
      await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));

      expect(document.querySelector('dialog')).toBeNull();
      expect(trigger).toHaveFocus();
    });

    /*
     * The regression this exists for: routing the close through React's own
     * `onClose` prop left the state set, so the dialog stayed mounted and shut
     * and the second entry rendered into a dialog nobody reopened. Asserting
     * on the `dialog` *role* missed it entirely — a closed dialog does not
     * expose one — which is why this queries the element and opens twice.
     */
    it('opens again after being closed, and shows the second entry', async () => {
      render(<TimelineTrack initial={page(['a', 'b'], 2)} content={content} locale="pt-BR" />);

      await userEvent.click(screen.getByRole('button', { name: 'Ver detalhes: a' }));
      await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
      await userEvent.click(screen.getByRole('button', { name: 'Ver detalhes: b' }));

      expect(screen.getByRole('dialog', { name: 'b' })).toBeInTheDocument();
      expect(document.querySelectorAll('dialog')).toHaveLength(1);
    });
  });
});
