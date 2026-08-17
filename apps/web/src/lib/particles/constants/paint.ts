/**
 * What the hero's field is painted with: colour, weight and opacity.
 *
 * Separate from `field.ts` next door, which is where it moves rather than how
 * it looks. Nothing here changes a position, and nothing there changes a
 * colour — so a change to one is never a search through the other.
 */

/**
 * `--blue` from `tokens.css`. A canvas cannot read a custom property, so the
 * value is restated here as numbers the painting can interpolate — named, and
 * pointing at the token it mirrors.
 */
export const BASE_COLOUR = { red: 37, green: 106, blue: 191 } as const;

/** How far the colour travels towards a lighter cyan as the pointer nears. */
export const PROXIMITY_COLOUR_SHIFT = { red: 25, green: 90, blue: 50 } as const;

/** A link's strength where the two dots touch, before distance fades it out. */
export const FULL_LINK_STRENGTH = 1;
export const LINK_BASE_ALPHA = 0.14;
export const LINK_PROXIMITY_ALPHA = 0.4;
export const LINK_MAX_ALPHA = 0.5;

/** Below this the line is invisible and drawing it is pure cost. */
export const LINK_MIN_VISIBLE_ALPHA = 0.012;
export const LINK_WIDTH = 1;

export const NODE_BASE_ALPHA = 0.18;
export const NODE_PROXIMITY_ALPHA = 0.55;
export const NODE_BREATHE_ALPHA = 0.05;
export const NODE_MAX_ALPHA = 0.7;
export const NODE_BASE_RADIUS = 1.4;
export const NODE_PROXIMITY_RADIUS = 2.2;

/** How fast the dots breathe, in radians per millisecond. */
export const BREATHE_RATE = 0.0012;
export const BREATHE_AMPLITUDE = 0.5;
export const BREATHE_OFFSET = 0.5;

export const MIDPOINT_DIVISOR = 2;
export const FULL_ARC_RADIANS = Math.PI * 2;
export const ARC_START_RADIANS = 0;
export const ORIGIN = 0;
export const NO_PROXIMITY = 0;
