import { DEFAULT_LOCALE, isLocale, type Locale } from '../enums/locale.ts';
import {
  InvalidLocalizedTextError,
  LOCALIZED_TEXT_VIOLATIONS,
} from '../errors/invalid-localized-text-error.ts';

type LocalizedValues = Partial<Record<Locale, string>>;

/**
 * A text field carrying one string per locale (NFR-10, NFR-11, FR-34).
 *
 * The budget is a constructor argument rather than a subclass per column: one
 * value object serves every localized column, and a new column is a new
 * constant in `text-budgets.ts`, not new code.
 *
 * An instance never crosses into presentation — use cases resolve to `string`
 * when building output DTOs (NFR-13).
 */
export class LocalizedText {
  private constructor(
    private readonly values: Readonly<LocalizedValues>,
    private readonly fallback: string,
  ) {}

  static create(values: unknown, maxLength: number): LocalizedText {
    if (typeof values !== 'object' || values === null || Array.isArray(values)) {
      throw new InvalidLocalizedTextError(
        LOCALIZED_TEXT_VIOLATIONS.NOT_AN_OBJECT,
        'A localized value must be an object keyed by locale.',
      );
    }

    const validated: LocalizedValues = {};

    for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
      if (!isLocale(key)) {
        throw new InvalidLocalizedTextError(
          LOCALIZED_TEXT_VIOLATIONS.UNKNOWN_LOCALE_KEY,
          `"${key}" is not a supported locale.`,
        );
      }

      if (typeof value !== 'string') {
        throw new InvalidLocalizedTextError(
          LOCALIZED_TEXT_VIOLATIONS.NOT_A_STRING,
          `The "${key}" entry must be a string.`,
        );
      }

      if (value.length > maxLength) {
        throw new InvalidLocalizedTextError(
          LOCALIZED_TEXT_VIOLATIONS.OVER_BUDGET,
          `The "${key}" entry exceeds its budget of ${maxLength} characters.`,
        );
      }

      validated[key] = value;
    }

    const fallback = validated[DEFAULT_LOCALE];

    if (fallback === undefined) {
      throw new InvalidLocalizedTextError(
        LOCALIZED_TEXT_VIOLATIONS.MISSING_DEFAULT_LOCALE,
        `A localized value must carry a "${DEFAULT_LOCALE}" entry.`,
      );
    }

    if (fallback.trim().length === 0) {
      throw new InvalidLocalizedTextError(
        LOCALIZED_TEXT_VIOLATIONS.EMPTY_DEFAULT_LOCALE,
        `The "${DEFAULT_LOCALE}" entry must not be blank.`,
      );
    }

    return new LocalizedText(validated, fallback);
  }

  /**
   * The requested locale, or `en-US` when it has no translation (FR-34).
   *
   * `create` guarantees a non-blank fallback, so this never returns an empty
   * string and no call site needs a null check.
   */
  resolve(locale: Locale): string {
    return this.values[locale] ?? this.fallback;
  }

  toJSON(): LocalizedValues {
    return { ...this.values };
  }
}
