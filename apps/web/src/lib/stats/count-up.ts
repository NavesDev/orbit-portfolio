import {
  COUNT_UP_INTERVAL_MS,
  COUNT_UP_STEPS,
  FULL_PROGRESS,
  NO_PROGRESS,
} from './constants/count-up';

/**
 * The count-up's arithmetic. Its step count and interval are in
 * `constants/count-up.ts`.
 */
export { COUNT_UP_INTERVAL_MS, COUNT_UP_STEPS } from './constants/count-up';

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
