const SEGMENT_SEPARATOR = '/';
const LOCALE_ROOT_SEGMENT_COUNT = 1;

/**
 * Whether `pathname` is a locale's home page — `/pt-BR`, and not
 * `/pt-BR/projetos/orbit-portfolio` below it.
 *
 * Counts non-empty segments rather than matching the locale itself: the
 * caller already knows the first segment is a locale (the layout 404s if it
 * is not), and a check that listed the locales would need editing every time
 * `LOCALES` grows. Tolerates a trailing slash for the same reason — it is the
 * same page.
 */
export function isLocaleRoot(pathname: string): boolean {
  return (
    pathname.split(SEGMENT_SEPARATOR).filter((segment) => segment !== '').length ===
    LOCALE_ROOT_SEGMENT_COUNT
  );
}
