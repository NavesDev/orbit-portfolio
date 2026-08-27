import {
  InvalidProgressPercentError,
  PROGRESS_PERCENT_VIOLATIONS,
} from '../errors/invalid-progress-percent-error.ts';

const MIN = 0;
const MAX = 100;

/**
 * The card's progress bar (data-model.md § 3): `smallint`, `0`–`100`, nullable
 * — a project with no reported progress renders no bar at all rather than one
 * stuck at zero.
 */
export class ProgressPercent {
  private constructor(private readonly percent: number | null) {}

  static create(value: unknown): ProgressPercent {
    if (value === null) {
      return new ProgressPercent(null);
    }

    if (typeof value !== 'number' || !Number.isInteger(value)) {
      throw new InvalidProgressPercentError(
        PROGRESS_PERCENT_VIOLATIONS.NOT_AN_INTEGER,
        'A progress percent must be an integer, or null.',
      );
    }

    if (value < MIN || value > MAX) {
      throw new InvalidProgressPercentError(
        PROGRESS_PERCENT_VIOLATIONS.OUT_OF_RANGE,
        `A progress percent must be between ${MIN} and ${MAX}.`,
      );
    }

    return new ProgressPercent(value);
  }

  get value(): number | null {
    return this.percent;
  }
}
