/** How a node marks itself for measurement, written once for both sides. */
export const NODE_SELECTOR = '[data-timeline-node]';

/** Cards alternate, so parity is over two. */
export const SIDES = 2;

/** A rectangle's centre is its top plus half its height. */
export const HALF = 2;

export const EMPTY_SPINE = 0;
export const NOTHING_PASSED = 0;

/**
 * Ties the failure message to the control it belongs to, so the button
 * describes itself as broken instead of leaving the message floating.
 */
export const ERROR_ID = 'timeline-show-more-error';
