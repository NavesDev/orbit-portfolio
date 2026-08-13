import { DEFAULT_LOCALE, LOCALES, type Locale } from '@portfolio/core';

const RANGE_SEPARATOR = ',';
const PARAMETER_SEPARATOR = ';';
const QUALITY_PREFIX = 'q=';
const SUBTAG_SEPARATOR = '-';
const DEFAULT_QUALITY = 1;
const REFUSED_QUALITY = 0;

interface LanguageRange {
  readonly tag: string;
  readonly quality: number;
}

/**
 * The visitor's language, from `Accept-Language` (FR-30, FR-31).
 *
 * Lives in `apps/web` rather than in `@portfolio/core` deliberately: this is an
 * HTTP concern, and the domain package must not know how a request reaches it.
 *
 * The header is read to pick a language and is written nowhere (NFR-14).
 */
export function negotiateLocale(header: string | null): Locale {
  if (header === null || header.trim().length === 0) {
    return DEFAULT_LOCALE;
  }

  for (const range of parseRanges(header)) {
    const match = matchSupportedLocale(range.tag);

    if (match !== null) {
      return match;
    }
  }

  return DEFAULT_LOCALE;
}

function parseRanges(header: string): LanguageRange[] {
  return header
    .split(RANGE_SEPARATOR)
    .map(parseRange)
    .filter((range) => range.quality > REFUSED_QUALITY)
    .sort((left, right) => right.quality - left.quality);
}

function parseRange(rawRange: string): LanguageRange {
  const [rawTag, ...parameters] = rawRange.trim().split(PARAMETER_SEPARATOR);
  const tag = (rawTag ?? '').trim();

  const rawQuality = parameters
    .map((parameter) => parameter.trim())
    .find((parameter) => parameter.startsWith(QUALITY_PREFIX));

  if (rawQuality === undefined) {
    return { tag, quality: DEFAULT_QUALITY };
  }

  const quality = Number.parseFloat(rawQuality.slice(QUALITY_PREFIX.length));

  return { tag, quality: Number.isNaN(quality) ? DEFAULT_QUALITY : quality };
}

/**
 * An exact tag wins; otherwise the primary subtag does, so `en-GB` and a bare
 * `en` both reach `en-US`, and `pt` reaches `pt-BR`.
 *
 * A wildcard matches nothing — it means "any", and answering it with a guess is
 * what `DEFAULT_LOCALE` already does one line later.
 */
function matchSupportedLocale(tag: string): Locale | null {
  const normalized = tag.toLowerCase();

  const exact = LOCALES.find((locale) => locale.toLowerCase() === normalized);

  if (exact !== undefined) {
    return exact;
  }

  const primarySubtag = normalized.split(SUBTAG_SEPARATOR)[0];

  if (primarySubtag === undefined || primarySubtag.length === 0) {
    return null;
  }

  return (
    LOCALES.find(
      (locale) => locale.toLowerCase().split(SUBTAG_SEPARATOR)[0] === primarySubtag,
    ) ?? null
  );
}
