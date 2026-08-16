import type { Locale } from '@portfolio/core';

import type { StatId } from './site';

/**
 * The shape both locale modules satisfy.
 *
 * Declared as an interface rather than inferred from one of the modules so a
 * missing key is a type error rather than a blank space — the property
 * `monorepo.md` asks of this folder. Inference would instead produce a
 * literal-type mismatch on every translated string, which reports the wrong
 * problem.
 */
/**
 * The headline, split at the fragment the design sets in italic serif (FR-01).
 *
 * Three fields rather than one string with markup in it: copy that carries its
 * own `<em>` has to be parsed or injected to render, and a translator can
 * unbalance a tag. Here the emphasis is structural, so neither locale can lose
 * it.
 */
export interface Headline {
  readonly lead: string;
  readonly emphasis: string;
  readonly trail: string;
}

/**
 * The two states of the availability badge (FR-02).
 *
 * Both phrases exist in both locales at all times, so flipping
 * `AVAILABLE_FOR_WORK` never leaves a language behind.
 */
export interface AvailabilityCopy {
  readonly open: string;
  readonly closed: string;
}

export interface SiteContent {
  readonly nav: {
    /** The wordmark. A name, so it is the same in both locales (FR-35). */
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
  readonly hero: {
    readonly availability: AvailabilityCopy;
    readonly headline: Headline;
    /** Beside the animated rule at the foot of the hero. */
    readonly scrollCue: string;
  };
  readonly band: {
    /** Names the band's landmark; the section has no visible heading. */
    readonly label: string;
    /**
     * One label per figure. `Record<StatId, string>` rather than a list, so
     * adding a stat is a type error in both locales rather than a gap in one.
     */
    readonly statLabels: Readonly<Record<StatId, string>>;
    /**
     * FR-22 — rendered only while the commit and pull-request counts are
     * placeholder. With live counts nothing on the band is invented: the
     * coffee is two cups per day of the year and the years are counted from a
     * date, so a note claiming otherwise would be the only false thing there.
     */
    readonly illustrativeNote: string;
  };
}
