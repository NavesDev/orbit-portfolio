import { isLocale, type Locale } from '@portfolio/core';

/**
 * The visitor's own choice, outranking their browser's language (FR-33).
 *
 * One module holds the name and every attribute, read by `proxy.ts` and
 * written by the language switcher, so the two cannot drift apart. Sprint 1
 * task 2 records the values as U-4, which no document had fixed.
 */
export const LOCALE_COOKIE_NAME = 'locale';

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365;

/** A year: long enough that the choice outlasts the tab, and it is only a preference. */
export const LOCALE_COOKIE_MAX_AGE_SECONDS =
  SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_YEAR;

const LOCALE_COOKIE_PATH = '/';

/** Lax, not Strict: the cookie must be sent on the top-level navigation to `/`, which is the only read. */
const LOCALE_COOKIE_SAME_SITE = 'Lax';

const PRODUCTION_ENV = 'production';
const ATTRIBUTE_SEPARATOR = '; ';

export function readLocaleCookie(value: string | undefined): Locale | null {
  if (value === undefined || !isLocale(value)) {
    return null;
  }

  return value;
}

/**
 * The cookie as a `document.cookie` string.
 *
 * Not `HttpOnly`: the switcher is a Client Component and writes it, and a
 * language preference is not a secret.
 */
export function serializeLocaleCookie(locale: Locale): string {
  const attributes = [
    `${LOCALE_COOKIE_NAME}=${locale}`,
    `Max-Age=${LOCALE_COOKIE_MAX_AGE_SECONDS}`,
    `Path=${LOCALE_COOKIE_PATH}`,
    `SameSite=${LOCALE_COOKIE_SAME_SITE}`,
  ];

  if (process.env.NODE_ENV === PRODUCTION_ENV) {
    attributes.push('Secure');
  }

  return attributes.join(ATTRIBUTE_SEPARATOR);
}
