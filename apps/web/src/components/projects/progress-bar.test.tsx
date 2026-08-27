import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProgressBar } from './progress-bar';

/**
 * `IntersectionObserver` does not exist in jsdom. `useHasBeenInView` (already
 * exercised by `stat-figure.test.tsx`) treats that as "always in view", which
 * is what this test relies on to assert the filled state without simulating a
 * real observer callback.
 */
describe('ProgressBar', () => {
  it('renders a progressbar with the given value and label', () => {
    render(<ProgressBar percent={82} label="Progress: 82%" />);

    const bar = screen.getByRole('progressbar', { name: 'Progress: 82%' });
    expect(bar).toHaveAttribute('aria-valuenow', '82');
  });

  it('reaches its full width once in view', () => {
    render(<ProgressBar percent={82} label="Progress: 82%" />);

    const fill = screen.getByTestId('progress-bar-fill');
    expect(fill).toHaveStyle({ width: '82%' });
  });
});
