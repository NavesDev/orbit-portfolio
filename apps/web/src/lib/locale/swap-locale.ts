import type { Locale } from '@portfolio/core';

const SEGMENT_SEPARATOR = '/';
const LOCALE_SEGMENT_INDEX = 1;

/**
 * The same page under another locale.
 *
 * Rewrites only the first segment, so the switcher keeps working once
 * `/[locale]/projetos` exists without being edited.
 */
export function swapLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split(SEGMENT_SEPARATOR);

  if (
    segments.length <= LOCALE_SEGMENT_INDEX ||
    segments[LOCALE_SEGMENT_INDEX] === ''
  ) {
    return `${SEGMENT_SEPARATOR}${locale}`;
  }

  segments[LOCALE_SEGMENT_INDEX] = locale;

  return segments.join(SEGMENT_SEPARATOR);
}
