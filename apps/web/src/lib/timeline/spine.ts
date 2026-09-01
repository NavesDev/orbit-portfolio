import * as SPINE_CONSTANTS from './constants/spine';

/**
 * How much of the spine is filled, `0` to `1` (FR-15).
 *
 * The prototype's rule, extracted from its scroll handler so it can be tested
 * against plain numbers instead of against a scrolled browser — the same move
 * `lib/scroll/active-section.ts` already makes.
 *
 * The measure is how far the section's wrapper has crossed the viewport's
 * midline, as a fraction of the wrapper's own height: nothing while the
 * section is still below the middle of the screen, full once its bottom has
 * passed it.
 */
export function computeSpineFill(
  wrapTop: number,
  wrapHeight: number,
  viewportHeight: number,
): number {
  if (wrapHeight <= SPINE_CONSTANTS.NO_FILL) {
    return SPINE_CONSTANTS.NO_FILL;
  }

  const midline = viewportHeight * SPINE_CONSTANTS.MIDLINE_RATIO;
  const crossed = (midline - wrapTop) / wrapHeight;

  return Math.min(SPINE_CONSTANTS.FULL_FILL, Math.max(SPINE_CONSTANTS.NO_FILL, crossed));
}

/**
 * Whether a node's centre has been scrolled past, which is what lights its
 * card and its dot.
 */
export function isNodePassed(nodeCenter: number, viewportHeight: number): boolean {
  return nodeCenter < viewportHeight * SPINE_CONSTANTS.MIDLINE_RATIO + SPINE_CONSTANTS.PASSED_LEAD;
}
