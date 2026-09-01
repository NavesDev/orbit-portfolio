import type { Locale, TimelineKind } from '@portfolio/core';

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
  /**
   * The featured-projects section and its detail page (FR-05–FR-10,
   * roadmap 4.2).
   *
   * `detailsCta` and `repoCta` are the card's two controls; `tagsHeading` and
   * `skillsHeading` label the two lists the detail page shows below the
   * description; `backCta` returns from it to the home page. The eyebrow's
   * ordinal (`01 —`) is not copy — it is computed from list position (U-6) —
   * so nothing here represents it.
   */
  readonly projects: {
    readonly kicker: string;
    readonly heading: string;
    readonly viewAll: string;
    readonly detailsCta: string;
    readonly repoCta: string;
    readonly tagsHeading: string;
    readonly skillsHeading: string;
    readonly backCta: string;
  };
  /**
   * The timeline section (FR-11–FR-15, roadmap 3.6).
   *
   * `kindLabels` names each kind on a card's chip; `ongoing` is FR-13's
   * wording for an entry whose period has no end — "atual" for a role or a
   * degree, "não expira" for a certification. Both are
   * `Record<TimelineKind, string>` rather than lists, so a fourth kind added
   * to the enum is a type error in both locales instead of a blank chip in
   * one.
   *
   * The wording lives here and not in the use case for the reason
   * `TimelineEntryView` records: it is copy, and copy that sits outside
   * `content/` escapes the check that a missing translation is a compile
   * error.
   *
   * `showMore` reveals the next page of entries; there is no "show less",
   * because collapsing a list a visitor deliberately opened takes away what
   * they just asked for.
   */
  readonly timeline: {
    readonly kicker: string;
    readonly heading: string;
    readonly kindLabels: Readonly<Record<TimelineKind, string>>;
    readonly ongoing: Readonly<Record<TimelineKind, string>>;
    readonly detailsCta: string;
    readonly showMore: string;
    readonly closeModal: string;
    readonly credentialCta: string;
    readonly skillsHeading: string;
  };
  /**
   * The site-wide 404 (roadmap 4.3), rendered inside `[locale]/layout.tsx` —
   * unlike `app/not-found.tsx`, this one runs with a resolved locale and the
   * page's own chrome (nav, fonts, styles) already in place.
   */
  readonly notFound: {
    readonly heading: string;
    readonly body: string;
    readonly backCta: string;
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
     * FR-22 — rendered only while a figure has no source to come from. With
     * every figure present nothing on the band is unaccounted for: the coffee
     * is two cups per day of the year and the years are counted from a date.
     */
    readonly missingNote: string;
    /**
     * What a screen reader hears in place of a missing figure. The placeholder
     * is a grey block on screen; silence would be worse than either.
     */
    readonly unavailable: string;
  };
  /**
   * The closing section (OQ-04 / U-2 — no `FR` names it; the prototype does).
   *
   * The headline reuses `Headline` rather than declaring a shape of its own:
   * it is the same figure as the hero's, one emphasized fragment in italic
   * serif, so it is the same type. The e-mail address the action points at is
   * not here — it is a `social_links` row (WN-04), so the copy names the act
   * and the database names the destination.
   */
  readonly closing: {
    readonly headline: Headline;
    /** The visible text of the mailto action. */
    readonly action: string;
    /**
     * Names the footer's list of icon-only links for a screen reader. The
     * links themselves are named by `platform` (FR-24); this names the group.
     */
    readonly linksLabel: string;
  };
}
