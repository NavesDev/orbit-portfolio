import type { Locale } from '@portfolio/core';

export interface StripPhrase {
  /** A proper noun, identical in both locales (FR-35). */
  readonly lead: string;
  readonly rest: string;
}

/**
 * The shape both locale modules satisfy.
 *
 * Declared as an interface rather than inferred from one of the modules so a
 * missing key is a type error rather than a blank space — the property
 * `monorepo.md` asks of this folder. Inference would instead produce a
 * literal-type mismatch on every translated string, which reports the wrong
 * problem.
 */
export interface SiteContent {
  readonly nav: {
    readonly mark: string;
    readonly skipToContent: string;
  };
  readonly languageSwitcher: {
    /** Names the switcher's landmark for a screen reader. */
    readonly label: string;
    /** What is shown — "EN", "PT". */
    readonly localeLabels: Readonly<Record<Locale, string>>;
    /**
     * The accessible name of each link, spelled out in the reader's language.
     *
     * It must contain the visible label from `localeLabels` — WCAG 2.5.3
     * "Label in Name". A name of "Português" on a link reading "PT" leaves a
     * voice-control user with no way to activate it.
     */
    readonly localeNames: Readonly<Record<Locale, string>>;
  };
  readonly strip: {
    readonly phrases: readonly StripPhrase[];
  };
}
