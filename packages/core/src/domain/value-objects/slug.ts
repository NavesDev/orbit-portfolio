import * as SLUG_CONSTANTS from '../constants/slug.ts';
import { InvalidSlugError, SLUG_VIOLATIONS } from '../errors/invalid-slug-error.ts';

/**
 * A project's URL and deep-link target (data-model.md § 3).
 *
 * Single and untranslated across locales — one project, one canonical URL.
 * Restricted to what a URL segment needs no encoding for: lowercase letters,
 * digits and single hyphens, never leading, trailing or doubled.
 */
export class Slug {
  private constructor(private readonly value: string) {}

  static create(value: unknown): Slug {
    if (typeof value !== 'string') {
      throw new InvalidSlugError(SLUG_VIOLATIONS.NOT_A_STRING, 'A slug must be a string.');
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new InvalidSlugError(SLUG_VIOLATIONS.EMPTY, 'A slug must not be blank.');
    }

    if (trimmed.length > SLUG_CONSTANTS.MAX_LENGTH) {
      throw new InvalidSlugError(
        SLUG_VIOLATIONS.OVER_BUDGET,
        `A slug exceeds its budget of ${SLUG_CONSTANTS.MAX_LENGTH} characters.`,
      );
    }

    if (!SLUG_CONSTANTS.PATTERN.test(trimmed)) {
      throw new InvalidSlugError(
        SLUG_VIOLATIONS.MALFORMED,
        'A slug must be lowercase letters, digits and single hyphens, with no leading, trailing or doubled hyphen.',
      );
    }

    return new Slug(trimmed);
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }

  equals(other: Slug): boolean {
    return this.value === other.value;
  }
}
