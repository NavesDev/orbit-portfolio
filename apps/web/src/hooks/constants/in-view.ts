/**
 * How much of an element must be showing before it counts as seen.
 *
 * Two fifths rather than a sliver: FR-21 animates figures on first view, and a
 * band that starts counting when one pixel of it clears the fold has finished
 * before the visitor can read it.
 */
export const DEFAULT_VISIBLE_RATIO = 0.4;
