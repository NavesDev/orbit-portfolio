import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/**
 * The scroll position is stubbed rather than scrolled: the store publishes
 * through `requestAnimationFrame`, which a headless browser suspends, and the
 * band's contract is "given this offset, place the sky like this" either way.
 */
const scrollOffset = vi.hoisted(() => ({ value: 0 }));

vi.mock('../../hooks/use-scroll', () => ({
  useScrollOffset: () => scrollOffset.value,
  useScrollProgress: () => 0,
}));

import { CloudDrift, driftOf } from './cloud-drift';
import { LAYER_COPIES, LAYER_WIDTH, LAYERS } from './constants/sky';

/** The widest viewport the band promises to keep covered. */
const WIDEST_SUPPORTED_VIEWPORT = 2560;

/** Far enough that a band without wrapping would have left the screen entirely. */
const A_LONG_SCROLL = 250_000;

const SMALLEST_LEGIBLE_WIDTH = 48;

function renderAt(offset: number) {
  scrollOffset.value = offset;

  const result = render(<CloudDrift />);

  scrollOffset.value = 0;

  return result;
}

function layerTransforms(container: HTMLElement): number[] {
  return [...container.querySelectorAll<HTMLElement>('[style*="translateX"]')].map((node) => {
    const match = /translateX\((-?[\d.]+)px\)/.exec(node.style.transform);

    return match === null ? Number.NaN : Number(match[1]);
  });
}

describe('CloudDrift', () => {
  it('is hidden from the accessibility tree — it says nothing to announce', () => {
    const { container } = renderAt(0);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('carries no text, so it needs no translation', () => {
    expect(renderAt(0).container.textContent).toBe('');
  });

  it('defines the shape once, however many clouds point at it', () => {
    const { container } = renderAt(0);

    expect(container.querySelectorAll('path')).toHaveLength(1);
    expect(container.querySelectorAll('use').length).toBeGreaterThan(1);
  });

  it('draws no cloud below the size the traced artwork survives', () => {
    const widths = LAYERS.flatMap((layer) => layer.clouds.map((cloud) => cloud.width));

    expect(Math.min(...widths)).toBeGreaterThanOrEqual(SMALLEST_LEGIBLE_WIDTH);
  });
});

/**
 * The two failures this arrangement exists to prevent — clouds piling onto one
 * another, and the band emptying out — both reported from a scrolled page.
 * Each is decided by the geometry rather than by what a frame happens to look
 * like, so each is asserted on the geometry.
 */
describe('CloudDrift once the page has scrolled', () => {
  it.each(LAYERS.map((layer) => [layer.id, layer] as const))(
    'never lets two clouds of the %s layer touch, at any offset',
    (unusedId, layer) => {
      const ordered = [...layer.clouds].sort((a, b) => a.x - b.x);

      for (const [index, cloud] of ordered.entries()) {
        const next = ordered[index + 1];

        if (next !== undefined) {
          expect(cloud.x + cloud.width).toBeLessThanOrEqual(next.x);
        }
      }
    },
  );

  it('keeps the last cloud of a repeat clear of the first of the next', () => {
    for (const layer of LAYERS) {
      const rightmost = Math.max(...layer.clouds.map((cloud) => cloud.x + cloud.width));

      expect(rightmost).toBeLessThanOrEqual(LAYER_WIDTH);
    }
  });

  it('wraps rather than marching off screen, however far the page scrolls', () => {
    for (const layer of LAYERS) {
      const drift = driftOf(A_LONG_SCROLL, layer.depth);

      expect(drift).toBeLessThanOrEqual(0);
      expect(drift).toBeGreaterThan(-LAYER_WIDTH);
    }
  });

  it('lays out enough repeats to cover a wide viewport at the worst offset', () => {
    const covered = LAYER_COPIES * LAYER_WIDTH - LAYER_WIDTH;

    expect(covered).toBeGreaterThanOrEqual(WIDEST_SUPPORTED_VIEWPORT);
  });

  it('still moves the near layer further than the far one — that is the parallax', () => {
    const far = LAYERS[0];
    const near = LAYERS[LAYERS.length - 1];

    if (far === undefined || near === undefined) {
      throw new Error('the sky has no layers');
    }

    expect(near.depth).toBeGreaterThan(far.depth * 2);
  });

  it('holds every layer inside one repeat in the rendered markup', () => {
    const shifts = layerTransforms(renderAt(A_LONG_SCROLL).container);

    expect(shifts).toHaveLength(LAYERS.length);

    for (const shift of shifts) {
      expect(shift).toBeLessThanOrEqual(0);
      expect(shift).toBeGreaterThan(-LAYER_WIDTH);
    }
  });

  it('sits still at the top of the page — nothing moves on its own', () => {
    expect(layerTransforms(renderAt(0).container).every((shift) => shift === 0)).toBe(true);
  });
});
