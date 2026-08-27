import { DEFAULT_LOCALE, isLocale, type Locale } from '../enums/locale.ts';
import {
  InvalidLocalizedTagListError,
  LOCALIZED_TAG_LIST_VIOLATIONS,
} from '../errors/invalid-localized-tag-list-error.ts';

type LocalizedTagValues = Partial<Record<Locale, readonly string[]>>;

/**
 * `projects.tags` (data-model.md § 3): one array of free labels per locale,
 * capped in count and per-item length, mirroring the database's
 * `is_localized_array`.
 *
 * A sibling of `LocalizedText` rather than a generalization of it: the two are
 * validated differently enough — an item count cap, a per-item length check
 * inside an array — that one class branching on "string vs string[]" would be
 * harder to read than two short, separately-testable ones.
 */
export class LocalizedTagList {
  private constructor(
    private readonly values: Readonly<LocalizedTagValues>,
    private readonly fallback: readonly string[],
  ) {}

  static create(values: unknown, maxItemLength: number, maxItems: number): LocalizedTagList {
    if (typeof values !== 'object' || values === null || Array.isArray(values)) {
      throw new InvalidLocalizedTagListError(
        LOCALIZED_TAG_LIST_VIOLATIONS.NOT_AN_OBJECT,
        'A localized tag list must be an object keyed by locale.',
      );
    }

    const validated: Record<string, readonly string[]> = {};

    for (const [key, entry] of Object.entries(values as Record<string, unknown>)) {
      if (!isLocale(key)) {
        throw new InvalidLocalizedTagListError(
          LOCALIZED_TAG_LIST_VIOLATIONS.UNKNOWN_LOCALE_KEY,
          `"${key}" is not a supported locale.`,
        );
      }

      if (!Array.isArray(entry)) {
        throw new InvalidLocalizedTagListError(
          LOCALIZED_TAG_LIST_VIOLATIONS.NOT_AN_ARRAY,
          `The "${key}" entry must be an array of strings.`,
        );
      }

      if (entry.length > maxItems) {
        throw new InvalidLocalizedTagListError(
          LOCALIZED_TAG_LIST_VIOLATIONS.TOO_MANY_ITEMS,
          `The "${key}" entry exceeds its cap of ${maxItems} items.`,
        );
      }

      for (const item of entry) {
        if (typeof item !== 'string') {
          throw new InvalidLocalizedTagListError(
            LOCALIZED_TAG_LIST_VIOLATIONS.ITEM_NOT_A_STRING,
            `An item of the "${key}" entry must be a string.`,
          );
        }

        if (item.length > maxItemLength) {
          throw new InvalidLocalizedTagListError(
            LOCALIZED_TAG_LIST_VIOLATIONS.ITEM_OVER_BUDGET,
            `An item of the "${key}" entry exceeds its budget of ${maxItemLength} characters.`,
          );
        }
      }

      validated[key] = entry;
    }

    const fallback = validated[DEFAULT_LOCALE];

    if (fallback === undefined) {
      throw new InvalidLocalizedTagListError(
        LOCALIZED_TAG_LIST_VIOLATIONS.MISSING_DEFAULT_LOCALE,
        `A localized tag list must carry a "${DEFAULT_LOCALE}" entry.`,
      );
    }

    return new LocalizedTagList(validated, fallback);
  }

  /** The requested locale, or `en-US` when it has no entry (FR-34). */
  resolve(locale: Locale): readonly string[] {
    return this.values[locale] ?? this.fallback;
  }

  toJSON(): LocalizedTagValues {
    return { ...this.values };
  }
}
