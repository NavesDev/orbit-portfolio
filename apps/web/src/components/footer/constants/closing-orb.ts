/**
 * How far the closing section's glow trails the scroll.
 *
 * The prototype drifts it on two axes at different rates, which is what keeps
 * it from reading as a background image pinned to the section. The numbers are
 * its own.
 */
export const PARALLAX_FACTOR_X = 0.05;
export const PARALLAX_FACTOR_Y = 0.12;

/** Before the element has been measured, it does not move. */
export const AT_REST = 0;
export const UNMEASURED = null;
