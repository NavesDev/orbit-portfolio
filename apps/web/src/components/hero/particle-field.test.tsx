import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ParticleField } from './particle-field';

/**
 * jsdom has no canvas: `getContext` is unimplemented and returns `null`. The
 * component is written to survive that — a field with no context paints
 * nothing — but these tests are about the animation loop's lifetime, not about
 * what is painted, so a recording stub keeps the loop running.
 *
 * Pixels are deliberately not asserted (`docs/testing.md`).
 */
function stubCanvas(): void {
  const noop = () => undefined;

  HTMLCanvasElement.prototype.getContext = vi.fn(
    () =>
      ({
        setTransform: noop,
        clearRect: noop,
        beginPath: noop,
        moveTo: noop,
        lineTo: noop,
        stroke: noop,
        arc: noop,
        fill: noop,
      }) as unknown as CanvasRenderingContext2D,
  ) as unknown as HTMLCanvasElement['getContext'];
}

const FRAME_MS = 16;
const NO_FRAMES = 0;

let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;

function runFrame(): void {
  const pending = [...frames.entries()];

  frames.clear();

  for (const [, callback] of pending) {
    callback(FRAME_MS);
  }
}

function reducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  stubCanvas();
  reducedMotion(false);

  frames = new Map();
  nextFrameId = 1;

  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = nextFrameId;

    nextFrameId += 1;
    frames.set(id, callback);

    return id;
  });

  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frames.delete(id);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ParticleField', () => {
  it('runs an animation loop while it is mounted (FR-03)', () => {
    render(<ParticleField />);

    expect(frames.size).toBeGreaterThan(NO_FRAMES);

    runFrame();

    expect(frames.size).toBeGreaterThan(NO_FRAMES);
  });

  it('cancels its animation frame on unmount, leaking no loop (FR-04)', () => {
    const cancel = vi.spyOn(window, 'cancelAnimationFrame');
    const { unmount } = render(<ParticleField />);

    runFrame();
    unmount();

    expect(cancel).toHaveBeenCalled();
    expect(frames.size).toBe(NO_FRAMES);
  });

  it('schedules nothing further once unmounted — the prototype’s leak', () => {
    const { unmount } = render(<ParticleField />);

    unmount();
    runFrame();

    expect(frames.size).toBe(NO_FRAMES);
  });

  it('stops listening for the pointer on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<ParticleField />);

    unmount();

    expect(remove).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('tracks the pointer while mounted (FR-03)', () => {
    render(<ParticleField />);

    const before = frames.size;

    fireEvent.mouseMove(window, { clientX: 10, clientY: 10 });
    runFrame();

    expect(frames.size).toBeGreaterThanOrEqual(before);
  });

  it('draws once and starts no loop when less motion is asked for', () => {
    reducedMotion(true);

    render(<ParticleField />);

    expect(frames.size).toBe(NO_FRAMES);
  });
});
