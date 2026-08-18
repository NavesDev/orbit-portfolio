/**
 * Every number the hero's field is tuned by, in one table.
 *
 * They live apart from `field.ts` because they are read differently: the
 * module next door is an algorithm a reader follows once, and these are values
 * someone comes back to nudge. Mixed together, changing the damping means
 * scrolling past the physics to find it, and reading the physics means
 * scrolling past the damping.
 *
 * The values are the prototype's, unchanged. What was a literal buried in a
 * frame callback there is a named quantity here.
 */

/** Below this width the field thins out, so a phone is not drawing a solid mesh. */
export const NARROW_VIEWPORT_WIDTH = 700;

export const SPACING_NARROW = 74;
export const SPACING_WIDE = 96;

/** How far a dot may sit from its grid slot, as a share of the spacing. */
export const JITTER_RATIO = 0.28;
export const JITTER_CENTRE = 0.5;

/** Odd rows are offset by half a cell, which is what stops the grid reading as a grid. */
export const ROW_OFFSET_DIVISOR = 2;
export const STAGGERED_ROW_REMAINDER = 1;
export const ROW_PARITY = 2;

/** One column and row past each edge, so jitter cannot leave a bare margin. */
export const EDGE_OVERSHOOT = 1;

/** Proximity at the pointer itself, before distance fades it towards zero. */
export const FULL_PROXIMITY = 1;

export const LINK_DISTANCE_NARROW = 130;
export const LINK_DISTANCE_WIDE = 160;

/** How close the pointer must come before a dot feels it, in CSS pixels. */
export const POINTER_RADIUS = 220;

export const REPULSION_STRENGTH = 10;
export const REPULSION_SCALE = 0.05;

/** The pull back towards the origin, and the friction that stops it ringing. */
export const SPRING_STIFFNESS = 0.04;
export const DAMPING = 0.85;

/** Below this speed a dot counts as settled — what "returns to rest" means in FR-03. */
export const AT_REST_VELOCITY = 0.01;

export const ORIGIN = 0;
export const FULL_TURN_RADIANS = Math.PI * 2;
