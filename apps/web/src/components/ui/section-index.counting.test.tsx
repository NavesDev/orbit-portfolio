import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * A populated registry, in its own file: `vi.mock` is hoisted to the top of
 * the module, so one file can only hold one registry. The empty case lives in
 * `section-index.test.tsx`.
 */
vi.mock('./section-registry', () => ({ SECTION_IDS: ['hero', 'band'] }));

const route = vi.hoisted(() => ({ pathname: '/pt-BR' }));

vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }));

import { SectionIndex } from './section-index';

describe('SectionIndex with sections registered', () => {
  beforeEach(() => {
    route.pathname = '/pt-BR';
  });

  it('counts the sections that are actually on the page, not the prototype’s six', () => {
    render(<SectionIndex />);

    expect(screen.getByText(/01\s*\/\s*02/)).toBeInTheDocument();
  });

  it('renders nothing on a page the registered sections are not part of', () => {
    route.pathname = '/pt-BR/projetos/orbit-portfolio';

    const { container } = render(<SectionIndex />);

    expect(container).toBeEmptyDOMElement();
  });
});
