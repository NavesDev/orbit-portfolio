/** The prototype fills the spine against the viewport's midline. */
export const MIDLINE_RATIO = 0.5;

/**
 * How far past the midline a node still counts as passed, in pixels.
 *
 * The prototype's own 40px. Without it a card lights up exactly as its centre
 * crosses the middle of the screen, which reads as late — the eye has already
 * moved on by then.
 */
export const PASSED_LEAD = 40;

export const NO_FILL = 0;
export const FULL_FILL = 1;
