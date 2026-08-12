/**
 * The two locales the site is published in.
 *
 * This array is the single list. `generateStaticParams`, the negotiator, the
 * switcher and the static content record all derive from it, so adding a third
 * locale is one edit here plus one migration to `is_localized` — never a hunt
 * for hardcoded pairs. `WN-06` keeps a third out of v1.
 */
export const LOCALES = ['pt-BR', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * The **fallback**, not the default UI language.
 *
 * What renders when a field has no translation in the requested locale
 * (FR-34). The language a visitor actually gets is their browser's, negotiated
 * per request — see `stack.md` § "Two different meanings of default".
 */
export const DEFAULT_LOCALE: Locale = 'pt-BR';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
