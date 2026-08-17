/**
 * The stat band's count-up, as numbers rather than as behaviour.
 *
 * The prototype counts by `target / 34` every 20ms. The step count is what is
 * named here rather than the step size, because the step size is what made its
 * small figures jump by one while its large ones jumped by dozens: every
 * figure takes the same 34 steps, so they arrive together.
 */
export const COUNT_UP_STEPS = 34;

/** The prototype's interval between steps — roughly 680ms end to end. */
export const COUNT_UP_INTERVAL_MS = 20;

export const NO_PROGRESS = 0;
export const FULL_PROGRESS = 1;
