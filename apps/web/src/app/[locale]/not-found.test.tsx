import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));

vi.mock('next/navigation', () => ({ usePathname }));

import { getContent } from '../../content/index';
import LocaleNotFound from './not-found';

describe('LocaleNotFound', () => {
  it('renders the message in the locale read from the URL', () => {
    usePathname.mockReturnValue('/pt-BR/projetos/no-such-slug');

    render(<LocaleNotFound />);

    expect(screen.getByRole('heading', { name: getContent('pt-BR').notFound.heading })).toBeInTheDocument();
  });

  it('links back to the home page in that same locale', () => {
    usePathname.mockReturnValue('/en-US/projetos/no-such-slug');

    render(<LocaleNotFound />);

    expect(
      screen.getByRole('link', { name: getContent('en-US').notFound.backCta }),
    ).toHaveAttribute('href', '/en-US');
  });

  /* Defensive only — layout.tsx already 404s any first segment that fails isLocale. */
  it('falls back to the default locale for an unrecognized first segment', () => {
    usePathname.mockReturnValue('/fr/whatever');

    render(<LocaleNotFound />);

    expect(screen.getByRole('heading', { name: getContent('en-US').notFound.heading })).toBeInTheDocument();
  });
});
