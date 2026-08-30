import * as DATE_RANGE_CONSTANTS from '../constants/date-range.ts';
import { DATE_RANGE_VIOLATIONS, InvalidDateRangeError } from '../errors/invalid-date-range-error.ts';

export interface DateRangeProperties {
  readonly startedOn: string | null;
  readonly endedOn: string | null;
}

/**
 * A period with an open end (data-model.md § Conventions).
 *
 * `ended_on IS NULL` means open — ongoing, current, or never expires — never a
 * separate `is_current` flag, so `endedOn: null` is a value in its own right,
 * not the absence of one.
 *
 * Dates are plain `YYYY-MM-DD` strings, not `Date` objects: a `date` column has
 * no time component, and a `Date` would invite a timezone to attach itself to
 * a value that never had one. `packages/db`'s mapper is what keeps this true —
 * it reads the columns as `::text`, so this value object never has to parse a
 * driver's own date type.
 */
export class DateRange {
  private constructor(
    private readonly startedOnValue: string | null,
    private readonly endedOnValue: string | null,
  ) {}

  static create(properties: DateRangeProperties): DateRange {
    requireIsoDateOrNull(properties.startedOn);
    requireIsoDateOrNull(properties.endedOn);

    if (
      properties.startedOn !== null &&
      properties.endedOn !== null &&
      properties.endedOn < properties.startedOn
    ) {
      throw new InvalidDateRangeError(
        DATE_RANGE_VIOLATIONS.END_BEFORE_START,
        `"${properties.endedOn}" ends before it starts, "${properties.startedOn}".`,
      );
    }

    return new DateRange(properties.startedOn, properties.endedOn);
  }

  get startedOn(): string | null {
    return this.startedOnValue;
  }

  get endedOn(): string | null {
    return this.endedOnValue;
  }
}

function requireIsoDateOrNull(value: string | null): void {
  if (value === null) {
    return;
  }

  if (typeof value !== 'string' || !DATE_RANGE_CONSTANTS.ISO_DATE_PATTERN.test(value)) {
    throw new InvalidDateRangeError(
      DATE_RANGE_VIOLATIONS.MALFORMED_DATE,
      `"${String(value)}" is not a "YYYY-MM-DD" date.`,
    );
  }
}
