/**
 * The two locales the site is published in.
 *
 * This array is the single list. `generateStaticParams`, the negotiator, the
 * switcher and the static content record all derive from it, so adding a third
 * locale is one edit here plus one migration to `is_localized` — never a hunt
 * for hardcoded pairs. `WN-06` keeps a third out of v1.
 *
 * `en-US`, not `en`: the tag the routes, the cookie and the `jsonb` keys use is
 * one value everywhere, so nothing has to map between a short form and a long
 * one.
 */
export const LOCALES = ['en-US', 'pt-BR'] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * The **fallback**, not the default UI language.
 *
 * What renders when a field has no translation in the requested locale
 * (FR-34). The language a visitor actually gets is their browser's, negotiated
 * per request — see `stack.md` § "Two different meanings of default".
 *
 * It is `en-US` because a fallback can only be the language content is
 * guaranteed to exist in: every localized field must carry `en-US`, while
 * `pt-BR` is free to lag behind.
 */
export const DEFAULT_LOCALE: Locale = 'en-US';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
