import * as URL_CONSTANTS from '../constants/url.ts';
import { InvalidUrlError, URL_VIOLATIONS } from '../errors/invalid-url-error.ts';

const ALLOWED_SCHEMES = new Set(URL_CONSTANTS.ALLOWED_SCHEMES);

/**
 * An absolute `https` URL — `projects.repo_url` and `.live_url`.
 *
 * The generic URL check `social-link.ts`'s docstring predicted a third call
 * site would justify: `repo_url` and `live_url` make two here, both narrower
 * than `SocialLink`'s own rule (no `mailto:`), which is why that one keeps its
 * inline check rather than being widened onto this.
 */
export class Url {
  private constructor(private readonly value: string) {}

  static create(value: unknown): Url {
    if (typeof value !== 'string') {
      throw new InvalidUrlError(URL_VIOLATIONS.NOT_A_STRING, 'A URL must be a string.');
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new InvalidUrlError(URL_VIOLATIONS.EMPTY, 'A URL must not be blank.');
    }

    if (trimmed.length > URL_CONSTANTS.MAX_LENGTH) {
      throw new InvalidUrlError(
        URL_VIOLATIONS.OVER_BUDGET,
        `A URL exceeds its budget of ${URL_CONSTANTS.MAX_LENGTH} characters.`,
      );
    }

    let parsed: URL;

    try {
      parsed = new URL(trimmed);
    } catch {
      throw new InvalidUrlError(URL_VIOLATIONS.NOT_ABSOLUTE, `"${trimmed}" is not an absolute URL.`);
    }

    if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
      throw new InvalidUrlError(
        URL_VIOLATIONS.SCHEME_NOT_ALLOWED,
        `"${parsed.protocol}" is not a scheme this URL may use.`,
      );
    }

    return new Url(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Url): boolean {
    return this.value === other.value;
  }
}
