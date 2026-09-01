import type { TimelineEntryView } from '@portfolio/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ptBR } from '../../content/pt-BR/index';
import { TimelineModal } from './timeline-modal';

const content = ptBR.timeline;

function entry(overrides: Partial<TimelineEntryView> = {}): TimelineEntryView {
  return {
    id: 'entry-1',
    kind: 'professional',
    title: 'Estagiário de Desenvolvimento',
    organization: 'Sea Tecnologia',
    description: 'Portais de larga escala.\n\n- **Backend:** Java e Liferay.',
    credentialUrl: null,
    startedOn: '2025-12-01',
    endedOn: null,
    isOngoing: true,
    skills: ['Java', 'Liferay'],
    ...overrides,
  };
}

function renderModal(overrides: Partial<TimelineEntryView> = {}, onClose = vi.fn()) {
  render(<TimelineModal entry={entry(overrides)} content={content} onClose={onClose} />);

  return onClose;
}

describe('TimelineModal', () => {
  it('opens as a dialog named after the entry', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Estagiário de Desenvolvimento' })).toBeInTheDocument();
  });

  it('renders the description as Markdown rather than as raw text', () => {
    renderModal();

    expect(screen.getByText('Portais de larga escala.')).toBeInTheDocument();
    expect(screen.getByText('Backend:').tagName).toBe('STRONG');
  });

  it('still shows the entry’s other facts when it has no description', () => {
    renderModal({ description: null });

    expect(screen.getByRole('heading', { name: 'Estagiário de Desenvolvimento' })).toBeInTheDocument();
    expect(screen.getByText('Sea Tecnologia')).toBeInTheDocument();
    expect(screen.getByText('2025 — atual')).toBeInTheDocument();
  });

  it('links to the credential when the entry carries one', () => {
    renderModal({
      kind: 'certification',
      credentialUrl: 'https://example.com/credential',
    });

    expect(screen.getByRole('link', { name: 'Verificar credencial' })).toHaveAttribute(
      'href',
      'https://example.com/credential',
    );
  });

  it('omits the credential link rather than rendering a dead one', () => {
    renderModal({ credentialUrl: null });

    expect(screen.queryByRole('link', { name: 'Verificar credencial' })).not.toBeInTheDocument();
  });

  it('reports back when the close control shuts the dialog', async () => {
    const onClose = renderModal();

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
