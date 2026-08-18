import { describe, expect, it } from 'vitest';

import type { Dot, FieldSize } from './field';
import { buildDots, isAtRest, POINTER_RADIUS, proximityAt, spacingFor, stepDots } from './field';

const DESKTOP: FieldSize = { width: 1280, height: 800 };
const PHONE: FieldSize = { width: 380, height: 700 };

/** No jitter and no phase: a field whose coordinates the assertions can name. */
const noRandom = () => 0.5;

function distanceFromOrigin(dot: Dot): number {
  return Math.hypot(dot.x - dot.originX, dot.y - dot.originY);
}

function run(dots: readonly Dot[], frames: number, pointer: Parameters<typeof stepDots>[1]) {
  for (let frame = 0; frame < frames; frame += 1) {
    stepDots(dots, pointer);
  }
}

describe('buildDots', () => {
  it('covers the field, one row and column past each edge', () => {
    const dots = buildDots(DESKTOP, noRandom);
    const spacing = spacingFor(DESKTOP);

    expect(dots.length).toBe(
      (Math.ceil(DESKTOP.width / spacing) + 1) * (Math.ceil(DESKTOP.height / spacing) + 1),
    );
  });

  it('thins the field out on a narrow viewport', () => {
    expect(spacingFor(PHONE)).toBeLessThan(spacingFor(DESKTOP));
  });

  it('starts every dot at rest, on its origin', () => {
    const dots = buildDots(DESKTOP, noRandom);

    expect(dots.every((dot) => dot.x === dot.originX && dot.y === dot.originY)).toBe(true);
    expect(isAtRest(dots)).toBe(true);
  });
});

describe('proximityAt', () => {
  it('is strongest at the pointer and nothing beyond its radius', () => {
    expect(proximityAt(0)).toBe(1);
    expect(proximityAt(POINTER_RADIUS)).toBe(0);
    expect(proximityAt(POINTER_RADIUS * 2)).toBe(0);
  });
});

describe('stepDots', () => {
  it('pushes dots away from the pointer (FR-03)', () => {
    const dots = buildDots(DESKTOP, noRandom);
    const nearest = dots[0];

    if (nearest === undefined) {
      throw new Error('the field built no dots');
    }

    run(dots, 10, { x: nearest.originX, y: nearest.originY + 1 });

    expect(distanceFromOrigin(nearest)).toBeGreaterThan(0);
  });

  it('leaves dots outside the pointer radius alone', () => {
    const dots = buildDots(DESKTOP, noRandom);
    const far = dots[0];

    if (far === undefined) {
      throw new Error('the field built no dots');
    }

    run(dots, 10, { x: far.originX + POINTER_RADIUS * 2, y: far.originY });

    expect(distanceFromOrigin(far)).toBe(0);
  });

  it('settles back to rest once the pointer leaves (FR-03)', () => {
    const dots = buildDots(DESKTOP, noRandom);
    const disturbed = dots[0];

    if (disturbed === undefined) {
      throw new Error('the field built no dots');
    }

    run(dots, 20, { x: disturbed.originX, y: disturbed.originY + 1 });
    expect(isAtRest(dots)).toBe(false);

    run(dots, 200, null);

    expect(isAtRest(dots)).toBe(true);
    expect(distanceFromOrigin(disturbed)).toBeLessThan(1);
  });
});
