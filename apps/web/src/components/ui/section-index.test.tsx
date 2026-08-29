import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./section-registry', () => ({ SECTION_IDS: [] }));
vi.mock('next/navigation', () => ({ usePathname: () => '/pt-BR' }));

import { SectionIndex } from './section-index';

describe('SectionIndex with an empty registry', () => {
  it('renders nothing, rather than an index of no sections', () => {
    const { container } = render(<SectionIndex />);

    expect(container).toBeEmptyDOMElement();
  });

  it('exposes no status for a screen reader to announce', () => {
    render(<SectionIndex />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
