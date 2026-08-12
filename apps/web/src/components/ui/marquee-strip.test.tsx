import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getContent } from '../../content/index';
import { MarqueeStrip } from './marquee-strip';

/**
 * The track renders its phrases twice so it still covers the viewport once it
 * has travelled. Text queries walk the DOM, not the accessibility tree, so
 * `ignore` is what makes these assertions ask "what would be announced?"
 * rather than "what is in the markup?".
 */
const ANNOUNCED_ONLY = {
  ignore: '[aria-hidden="true"], [aria-hidden="true"] *',
} as const;

describe('MarqueeStrip', () => {
  it('renders every phrase of the requested locale', () => {
    render(<MarqueeStrip phrases={getContent('en-US').strip.phrases} />);

    expect(screen.getByText('Claude Code', ANNOUNCED_ONLY)).toBeInTheDocument();
    expect(screen.getByText(/automation/, ANNOUNCED_ONLY)).toBeInTheDocument();
  });

  it('renders the Portuguese phrasing for pt-BR', () => {
    render(<MarqueeStrip phrases={getContent('pt-BR').strip.phrases} />);

    expect(screen.getByText(/automação/, ANNOUNCED_ONLY)).toBeInTheDocument();
  });

  it('announces each phrase once, though it is rendered twice to wrap', () => {
    render(<MarqueeStrip phrases={getContent('pt-BR').strip.phrases} />);

    expect(screen.getAllByText('Claude Code', ANNOUNCED_ONLY)).toHaveLength(1);
    expect(screen.getAllByText('Claude Code')).toHaveLength(2);
  });
});
