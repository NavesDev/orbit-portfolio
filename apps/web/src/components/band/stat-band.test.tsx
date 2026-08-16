import type { Locale } from '@portfolio/core';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getContent } from '../../content/index';
import { STAT_IDS } from '../../content/site';
import { COUNT_UP_INTERVAL_MS, COUNT_UP_STEPS } from '../../lib/stats/count-up';
import { StatBand } from './stat-band';

const FIGURES = { commits: 1847, pullRequests: 73, coffee: 412, years: 4 } as const;

/** Deliberately equal to the fallback: the note must not be inferred from the numbers. */
const FALLBACK_SHAPED = { commits: 1230, pullRequests: 50, coffee: 412, years: 4 } as const;

function props(locale: Locale) {
  return {
    content: getContent(locale).band,
    figures: FIGURES,
    isIllustrative: true,
    locale,
  } as const;
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

  it('marks the figures as illustrative, in the visitor language (FR-22)', () => {
    render(<StatBand {...props('en-US')} isIllustrative />);

    expect(screen.getByText(getContent('en-US').band.illustrativeNote)).toBeInTheDocument();
    expect(screen.queryByText(getContent('pt-BR').band.illustrativeNote)).not.toBeInTheDocument();
  });

  it('says nothing once the counts are live — no figure is invented then', () => {
    render(<StatBand {...props('pt-BR')} isIllustrative={false} />);

    expect(screen.queryByText(getContent('pt-BR').band.illustrativeNote)).not.toBeInTheDocument();
  });

  it('takes the state from the caller, not from comparing figures', () => {
    render(<StatBand {...props('pt-BR')} figures={FALLBACK_SHAPED} isIllustrative={false} />);

    expect(screen.queryByText(getContent('pt-BR').band.illustrativeNote)).not.toBeInTheDocument();
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
    expect(screen.getByText('412')).toBeInTheDocument();
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
