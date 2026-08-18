import type { Locale } from '@portfolio/core';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getContent } from '../../content/index';
import { STAT_IDS } from '../../content/site';
import { COUNT_UP_INTERVAL_MS, COUNT_UP_STEPS } from '../../lib/stats/count-up';
import { StatBand } from './stat-band';

const FIGURES = { commits: 1847, pullRequests: 73, coffee: 454, years: 4 } as const;

/** What the band gets when GitHub could not be reached: the two counts absent. */
const WITHOUT_SOURCE = { commits: null, pullRequests: null, coffee: 454, years: 4 } as const;

function props(locale: Locale) {
  return { content: getContent(locale).band, figures: FIGURES, locale } as const;
}

/**
 * jsdom has no `IntersectionObserver`. This one records its observers so a
 * test can decide when the band comes into view — which is the behaviour under
 * test, and the one thing a real observer would never do on demand.
 */
let enterView: () => void;

function stubIntersectionObserver(): void {
  const callbacks: IntersectionObserverCallback[] = [];

  class TestObserver {
    constructor(callback: IntersectionObserverCallback) {
      callbacks.push(callback);
    }

    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
    root = null;
    rootMargin = '';
    thresholds = [];
  }

  vi.stubGlobal('IntersectionObserver', TestObserver);

  enterView = () => {
    for (const callback of [...callbacks]) {
      act(() => {
        callback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
      });
    }
  };
}

/** Drives the count from start to finish without waiting 680ms of real time. */
function finishCounting(): void {
  act(() => {
    vi.advanceTimersByTime(COUNT_UP_INTERVAL_MS * (COUNT_UP_STEPS + 1));
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  stubIntersectionObserver();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('StatBand', () => {
  it('labels every figure in the requested locale (FR-21)', () => {
    const { band } = getContent('pt-BR');

    render(<StatBand {...props('pt-BR')} />);

    for (const id of STAT_IDS) {
      expect(screen.getByText(band.statLabels[id])).toBeInTheDocument();
    }
  });

  it('accounts for a figure it could not read, in the visitor language (FR-22)', () => {
    render(<StatBand {...props('en-US')} figures={WITHOUT_SOURCE} />);

    expect(screen.getByText(getContent('en-US').band.missingNote)).toBeInTheDocument();
    expect(screen.queryByText(getContent('pt-BR').band.missingNote)).not.toBeInTheDocument();
  });

  it('says nothing when every figure is there', () => {
    render(<StatBand {...props('pt-BR')} />);

    expect(screen.queryByText(getContent('pt-BR').band.missingNote)).not.toBeInTheDocument();
  });

  it('draws a placeholder instead of a stand-in number (FR-22)', () => {
    render(<StatBand {...props('pt-BR')} figures={WITHOUT_SOURCE} />);

    const { statLabels, unavailable } = getContent('pt-BR').band;

    expect(screen.getByText(`${statLabels.commits}: ${unavailable}`)).toBeInTheDocument();
    expect(screen.getByText(`${statLabels.pullRequests}: ${unavailable}`)).toBeInTheDocument();
  });

  it('keeps the figures it can still work out from the calendar', () => {
    render(<StatBand {...props('pt-BR')} figures={WITHOUT_SOURCE} />);

    expect(screen.getByText('454')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('does not count up a figure that is not there', () => {
    render(<StatBand {...props('en-US')} figures={WITHOUT_SOURCE} />);

    enterView();
    finishCounting();

    expect(screen.getAllByText(/unavailable/)).toHaveLength(2);
  });

  it('names the section, which has no visible heading of its own', () => {
    render(<StatBand {...props('pt-BR')} />);

    expect(
      screen.getByRole('region', { name: getContent('pt-BR').band.label }),
    ).toBeInTheDocument();
  });

  it('renders the final figures before any animation, so no-JS keeps them', () => {
    render(<StatBand {...props('en-US')} />);

    expect(screen.getByText('1,847')).toBeInTheDocument();
  });

  it('counts up from zero when first scrolled into view, and arrives (FR-21)', () => {
    render(<StatBand {...props('en-US')} />);

    enterView();

    expect(screen.getAllByText('0').length).toBe(STAT_IDS.length);

    finishCounting();

    expect(screen.getByText('1,847')).toBeInTheDocument();
    expect(screen.getByText('454')).toBeInTheDocument();
  });

  it('counts once — a second view does not restart it', () => {
    render(<StatBand {...props('en-US')} />);

    enterView();
    finishCounting();
    enterView();

    expect(screen.getByText('1,847')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('formats the figures for the reader — 1.847 in Portuguese', () => {
    render(<StatBand {...props('pt-BR')} />);

    expect(screen.getByText('1.847')).toBeInTheDocument();
  });
});
