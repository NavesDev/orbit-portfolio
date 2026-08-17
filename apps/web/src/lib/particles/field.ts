/**
 * The hero's connected-network simulation (FR-03).
 *
 * Ported from the prototype's `heroField`, with three changes and no new
 * behaviour:
 *
 * - The physics live here, as data and pure functions, rather than inside an
 *   animation callback. A field that only exists while a frame is being drawn
 *   cannot be tested without pixels, which `docs/testing.md` rules out.
 * - The pointer is `null` when absent instead of parked at `-9999, -9999`.
 *   A sentinel coordinate is a magic number that happens to be far away.
 * - Randomness is injected, so a test can build a field it can predict.
 *
 * Positions are mutated in place: this runs on every animation frame for a few
 * hundred dots, and allocating a new array of objects per frame is exactly the
 * kind of garbage that shows up as jank.
 */

import {
  AT_REST_VELOCITY,
  DAMPING,
  EDGE_OVERSHOOT,
  FULL_PROXIMITY,
  FULL_TURN_RADIANS,
  JITTER_CENTRE,
  JITTER_RATIO,
  LINK_DISTANCE_NARROW,
  LINK_DISTANCE_WIDE,
  NARROW_VIEWPORT_WIDTH,
  ORIGIN,
  POINTER_RADIUS,
  REPULSION_SCALE,
  REPULSION_STRENGTH,
  ROW_OFFSET_DIVISOR,
  ROW_PARITY,
  SPACING_NARROW,
  SPACING_WIDE,
  SPRING_STIFFNESS,
  STAGGERED_ROW_REMAINDER,
} from './constants/field';

export { POINTER_RADIUS } from './constants/field';

export interface Dot {
  /** The grid slot this dot springs back to. */
  readonly originX: number;
  readonly originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Phase offset, so the dots breathe out of step with each other. */
  readonly pulse: number;
}

export interface FieldSize {
  readonly width: number;
  readonly height: number;
}

/** Where the pointer is, in canvas coordinates. `null` means it has left. */
export type Pointer = { readonly x: number; readonly y: number } | null;

/** A source of randomness, injected so tests can supply a predictable one. */
export type Random = () => number;

export function spacingFor(size: FieldSize): number {
  return size.width < NARROW_VIEWPORT_WIDTH ? SPACING_NARROW : SPACING_WIDE;
}

export function linkDistanceFor(size: FieldSize): number {
  return size.width < NARROW_VIEWPORT_WIDTH ? LINK_DISTANCE_NARROW : LINK_DISTANCE_WIDE;
}

/**
 * Lays a jittered, staggered grid of dots over the field.
 *
 * One extra column and row beyond the edge (`EDGE_OVERSHOOT`): without it the
 * jitter can pull the last dots inward and leave a visible bare margin.
 */
export function buildDots(size: FieldSize, random: Random): Dot[] {
  const spacing = spacingFor(size);
  const jitter = spacing * JITTER_RATIO;
  const columns = Math.ceil(size.width / spacing) + EDGE_OVERSHOOT;
  const rows = Math.ceil(size.height / spacing) + EDGE_OVERSHOOT;
  const dots: Dot[] = [];

  for (let column = ORIGIN; column < columns; column += 1) {
    for (let row = ORIGIN; row < rows; row += 1) {
      const stagger =
        row % ROW_PARITY === STAGGERED_ROW_REMAINDER ? spacing / ROW_OFFSET_DIVISOR : ORIGIN;
      const originX = column * spacing + stagger + (random() - JITTER_CENTRE) * jitter;
      const originY = row * spacing + (random() - JITTER_CENTRE) * jitter;

      dots.push({
        originX,
        originY,
        x: originX,
        y: originY,
        vx: ORIGIN,
        vy: ORIGIN,
        pulse: random() * FULL_TURN_RADIANS,
      });
    }
  }

  return dots;
}

/**
 * How strongly a point at `distance` feels the pointer, from 1 at the pointer
 * to 0 at the edge of its radius. Also what fades the links and brightens the
 * nodes, which is why it is exported rather than kept to the physics.
 */
export function proximityAt(distance: number): number {
  return Math.max(ORIGIN, FULL_PROXIMITY - distance / POINTER_RADIUS);
}

/**
 * Advances every dot by one frame: pushed away from the pointer, pulled back
 * to its origin, and damped so it settles instead of ringing.
 */
export function stepDots(dots: readonly Dot[], pointer: Pointer): void {
  for (const dot of dots) {
    if (pointer !== null) {
      const dx = dot.x - pointer.x;
      const dy = dot.y - pointer.y;
      const distance = Math.hypot(dx, dy);

      if (distance < POINTER_RADIUS && distance > ORIGIN) {
        const force = proximityAt(distance) * REPULSION_STRENGTH;

        dot.vx += (dx / distance) * force * REPULSION_SCALE;
        dot.vy += (dy / distance) * force * REPULSION_SCALE;
      }
    }

    dot.vx += (dot.originX - dot.x) * SPRING_STIFFNESS;
    dot.vy += (dot.originY - dot.y) * SPRING_STIFFNESS;
    dot.vx *= DAMPING;
    dot.vy *= DAMPING;
    dot.x += dot.vx;
    dot.y += dot.vy;
  }
}

/** Whether the field has stopped moving — what "settles back to rest" means in FR-03. */
export function isAtRest(dots: readonly Dot[]): boolean {
  return dots.every((dot) => Math.hypot(dot.vx, dot.vy) < AT_REST_VELOCITY);
}
