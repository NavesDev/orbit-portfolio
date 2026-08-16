const NO_PROGRESS = 0;
const FULL_PROGRESS = 1;

/**
 * How many steps a figure counts through before it arrives.
 *
 * The prototype's `target / 34` at 20ms: the same 34 steps, expressed as the
 * count rather than as a step size, because the step size is what made the
 * prototype's small figures jump by one and its large ones by dozens.
 */
export const COUNT_UP_STEPS = 34;

/** The prototype's interval between steps — roughly 680ms end to end. */
export const COUNT_UP_INTERVAL_MS = 20;

/**
 * The figure shown at `step`, counting from zero to `target`.
 *
 * Pure, so the animation can be asserted without a timer: the component owns
 * *when* a step happens, this owns *what* it shows.
 */
export function figureAtStep(target: number, step: number): number {
  const progress = Math.min(FULL_PROGRESS, Math.max(NO_PROGRESS, step / COUNT_UP_STEPS));

  return Math.round(target * progress);
}

export function isCountComplete(step: number): boolean {
  return step >= COUNT_UP_STEPS;
}
