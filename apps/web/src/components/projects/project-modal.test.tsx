import type { ProjectDetailView } from '@portfolio/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { getContent } from '../../content/index';
import { ProjectModal } from './project-modal';

const DETAIL: ProjectDetailView = {
  slug: 'orbit-portfolio',
  title: 'Orbit Portfolio',
  category: 'Personal portfolio',
  tags: ['Next.js', 'PostgreSQL'],
  progressPercent: 100,
  visualSvg: null,
  description: 'A bilingual portfolio built on persisted content.',
  repoUrl: 'https://github.com/NavesDev/orbit-portfolio',
  liveUrl: null,
  skills: [{ name: 'Next.js', usageNote: 'App Router throughout.' }],
};

function renderModal(onClose: () => void, returnFocusTo = createRef<HTMLButtonElement>()) {
  return render(
    <ProjectModal
      detail={DETAIL}
      content={getContent('en-US').projects}
      onClose={onClose}
      returnFocusTo={returnFocusTo}
    />,
  );
}

describe('ProjectModal', () => {
  it('renders the title, description, tags and applied skills', () => {
    renderModal(vi.fn());

    expect(screen.getByRole('heading', { name: 'Orbit Portfolio' })).toBeInTheDocument();
    expect(screen.getByText(DETAIL.description!)).toBeInTheDocument();
    expect(screen.getAllByText('Next.js')).toHaveLength(2); // one tag, one applied skill
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
  });

  it('links to the repository when repoUrl is present', () => {
    renderModal(vi.fn());

    expect(screen.getByRole('link', { name: getContent('en-US').projects.repoCta })).toHaveAttribute(
      'href',
      DETAIL.repoUrl,
    );
  });

  /* FR-09, the same rule ClosingSection already applies to its own action. */
  it('omits the repository control when repoUrl is absent', () => {
    render(
      <ProjectModal
        detail={{ ...DETAIL, repoUrl: null }}
        content={getContent('en-US').projects}
        onClose={vi.fn()}
        returnFocusTo={createRef<HTMLButtonElement>()}
      />,
    );

    expect(
      screen.queryByRole('link', { name: getContent('en-US').projects.repoCta }),
    ).not.toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn();
    renderModal(onClose);

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the close button is activated', async () => {
    const onClose = vi.fn();
    renderModal(onClose);

    await userEvent.click(screen.getByRole('button', { name: getContent('en-US').projects.closeModal }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  /* NFR-05 */
  it('returns focus to the trigger on unmount', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    const returnFocusTo = { current: trigger };

    const { unmount } = renderModal(vi.fn(), returnFocusTo);
    unmount();

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
