import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/pt-BR/projetos',
}));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: { children: ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

import { getContent } from '../../content/index';
import { LanguageSwitcher } from './language-switcher';

const ptBR = getContent('pt-BR');

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    document.cookie = `locale=; Max-Age=0; Path=/`;
  });

  it('offers a link per locale, named in the reader’s language', () => {
    render(<LanguageSwitcher locale="pt-BR" content={ptBR} />);

    expect(screen.getByRole('link', { name: 'Português' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inglês' })).toBeInTheDocument();
  });

  it('marks the current locale for assistive technology', () => {
    render(<LanguageSwitcher locale="pt-BR" content={ptBR} />);

    expect(screen.getByRole('link', { name: 'Português' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByRole('link', { name: 'Inglês' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('links to the same page under the other locale (FR-32)', () => {
    render(<LanguageSwitcher locale="pt-BR" content={ptBR} />);

    expect(screen.getByRole('link', { name: 'Inglês' })).toHaveAttribute(
      'href',
      '/en-US/projetos',
    );
  });

  it('names its landmark so the switcher is findable by role', () => {
    render(<LanguageSwitcher locale="pt-BR" content={ptBR} />);

    expect(screen.getByRole('navigation', { name: 'Idioma' })).toBeInTheDocument();
  });

  it('writes the choice to a cookie so it outranks the browser next time (FR-33)', async () => {
    render(<LanguageSwitcher locale="pt-BR" content={ptBR} />);

    await userEvent.click(screen.getByRole('link', { name: 'Inglês' }));

    expect(document.cookie).toContain('locale=en-US');
  });
});
