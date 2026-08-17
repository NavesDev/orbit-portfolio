import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './skeleton';

const A_FIGURE = { width: '2.4ch', height: '42%' } as const;

describe('Skeleton', () => {
  it('takes its size from the caller, in the caller’s units', () => {
    const { container } = render(<Skeleton width="180px" height="1.2em" />);
    const bar = container.firstElementChild as HTMLElement;

    expect(bar.style.width).toBe('180px');
    expect(bar.style.height).toBe('1.2em');
  });

  it('is a pill unless the caller asks for another radius', () => {
    const { container } = render(<Skeleton {...A_FIGURE} />);

    expect((container.firstElementChild as HTMLElement).style.borderRadius).toBe('999px');

    const squared = render(<Skeleton {...A_FIGURE} radius="4px" />);

    expect((squared.container.firstElementChild as HTMLElement).style.borderRadius).toBe('4px');
  });

  it('says what is missing when it stands in for something named', () => {
    render(<Skeleton {...A_FIGURE} label="commits públicos: indisponível" />);

    expect(screen.getByText('commits públicos: indisponível')).toBeInTheDocument();
  });

  it('leaves the accessibility tree when it stands in for nothing named', () => {
    const { container } = render(<Skeleton {...A_FIGURE} />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.textContent).toBe('');
  });

  it('does not announce itself twice — the label is the only text it has', () => {
    const { container } = render(<Skeleton {...A_FIGURE} label="indisponível" />);

    expect(container.firstElementChild).not.toHaveAttribute('aria-hidden');
    expect(container.textContent).toBe('indisponível');
  });
});
