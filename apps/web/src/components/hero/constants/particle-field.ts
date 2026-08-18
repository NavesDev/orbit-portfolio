import type { FieldSize } from '../../../lib/particles/field';

/**
 * What the field's canvas is set up with, as opposed to what it draws.
 *
 * The drawing's own tuning is in `lib/particles/constants/`. These are the
 * numbers of the element rather than of the simulation: how sharp to render,
 * how long to wait before rebuilding, where the transform starts.
 */

/** The cap on device pixel ratio: past 2 the cost doubles and nobody sees it. */
export const MAX_PIXEL_RATIO = 2;
export const DEFAULT_PIXEL_RATIO = 1;

export const CANVAS_ORIGIN = 0;
export const NO_SKEW = 0;

/** Rebuilding on every resize event would rebuild the field mid-drag. */
export const RESIZE_SETTLE_MS = 150;

/** The single frame drawn for a visitor who asked for less motion. */
export const FIRST_FRAME_MS = 0;

/** The size before the canvas has been measured, and what the server assumes. */
export const EMPTY_SIZE: FieldSize = { width: CANVAS_ORIGIN, height: CANVAS_ORIGIN };
