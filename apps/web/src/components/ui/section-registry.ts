/**
 * The sections the nav index counts, in the order they appear on the page.
 *
 * **Empty on purpose.** The prototype hardcodes
 * `['hero','work','timeline','skills','band','cta']` and the literal `' / 06'`,
 * and every one of those sections arrives in a later sprint-1 task. Each of
 * those tasks appends its own id here, and the index derives both its position
 * and its total from this array — so the count can never disagree with what is
 * actually on the page.
 *
 * Typed as `readonly string[]` rather than a `const` tuple so that adding an
 * entry is a one-line change here and nothing else.
 */
export const SECTION_IDS: readonly string[] = [];
