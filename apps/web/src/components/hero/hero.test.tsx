import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getContent } from '../../content/index';
import { Hero } from './hero';

const AVAILABLE = true;
const UNAVAILABLE = false;

describe('Hero', () => {
  it('renders the headline as the page heading, emphasis included (FR-01)', () => {
    render(<Hero content={getContent('en-US').hero} available={AVAILABLE} />);

    const heading = screen.getByRole('heading', { level: 1 });

    expect(heading).toHaveTextContent('Systems that really work, not just in the demo.');
  });

  it('renders the Portuguese headline for pt-BR', () => {
    render(<Hero content={getContent('pt-BR').hero} available={AVAILABLE} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Sistemas que funcionam de verdade, não só na demo.',
    );
  });

  it('marks the emphasised fragment up rather than baking it into the copy', () => {
    const { emphasis } = getContent('pt-BR').hero.headline;

    render(<Hero content={getContent('pt-BR').hero} available={AVAILABLE} />);

    expect(screen.getByText(emphasis).tagName).toBe('EM');
  });

  it('switches the badge on the boolean, in both directions (FR-02)', () => {
    const { availability } = getContent('en-US').hero;

    const open = render(<Hero content={getContent('en-US').hero} available={AVAILABLE} />);

    expect(screen.getByText(availability.open)).toBeInTheDocument();
    expect(screen.queryByText(availability.closed)).not.toBeInTheDocument();

    open.unmount();
    render(<Hero content={getContent('en-US').hero} available={UNAVAILABLE} />);

    expect(screen.getByText(availability.closed)).toBeInTheDocument();
    expect(screen.queryByText(availability.open)).not.toBeInTheDocument();
  });

  it('says the same in Portuguese, so flipping the boolean cannot strand a locale', () => {
    const { availability } = getContent('pt-BR').hero;

    render(<Hero content={getContent('pt-BR').hero} available={UNAVAILABLE} />);

    expect(screen.getByText(availability.closed)).toBeInTheDocument();
  });

  it('shows the scroll cue in the visitor language', () => {
    render(<Hero content={getContent('pt-BR').hero} available={AVAILABLE} />);

    expect(screen.getByText('Role para explorar')).toBeInTheDocument();
  });
});
