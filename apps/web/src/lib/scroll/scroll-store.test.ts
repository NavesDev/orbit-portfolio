import { afterEach, describe, expect, it, vi } from 'vitest';

import { getScrollMetrics, subscribeToScroll } from './scroll-store';

function scrollTo(offset: number, scrollHeight = 2000, innerHeight = 1000): void {
  Object.defineProperty(window, 'scrollY', { value: offset, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: innerHeight, configurable: true });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: scrollHeight,
    configurable: true,
  });
  window.dispatchEvent(new Event('scroll'));
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('subscribeToScroll', () => {
  it('attaches exactly one scroll listener however many subscribers there are', () => {
    const addEventListener = vi.spyOn(window, 'addEventListener');

    const first = subscribeToScroll(() => {});
    const second = subscribeToScroll(() => {});

    const scrollListeners = addEventListener.mock.calls.filter(
      ([type]) => type === 'scroll',
    );

    expect(scrollListeners).toHaveLength(1);

    first();
    second();
  });

  it('removes the listener when the last subscriber leaves', () => {
    const removeEventListener = vi.spyOn(window, 'removeEventListener');

    subscribeToScroll(() => {})();

    expect(removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('notifies subscribers when the page scrolls', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToScroll(listener);

    scrollTo(500);
    await nextFrame();

    expect(listener).toHaveBeenCalled();

    unsubscribe();
  });
});

describe('getScrollMetrics', () => {
  it('reports progress as a fraction of the scrollable distance', async () => {
    const unsubscribe = subscribeToScroll(() => {});

    scrollTo(500);
    await nextFrame();

    expect(getScrollMetrics().progress).toBeCloseTo(0.5);
    expect(getScrollMetrics().offset).toBe(500);

    unsubscribe();
  });

  it('reports no progress on a page shorter than the viewport', async () => {
    const unsubscribe = subscribeToScroll(() => {});

    scrollTo(0, 800, 1000);
    await nextFrame();

    expect(getScrollMetrics().progress).toBe(0);

    unsubscribe();
  });
});
