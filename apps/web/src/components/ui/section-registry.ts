/**
 * The sections the nav index counts, in the order they appear on the page.
 *
 * The ids are named constants rather than literals repeated in markup: the
 * index derives both its position and its total from this array, so a section
 * whose `id` attribute drifts from its entry here would be counted and never
 * found. One name, used in both places.
 *
 * Each sprint-1 task appends its own section as it lands. `hero` and `band`
 * arrive together in the hero task; the sections between them are still to
 * come, and the index reports what is actually on the page rather than the
 * prototype's fixed `/ 06`.
 *
 * Typed as `readonly string[]` rather than a `const` tuple so that adding an
 * entry is a one-line change here and nothing else.
 */
export const HERO_SECTION_ID = 'hero';
export const PROJECTS_SECTION_ID = 'projects';
export const BAND_SECTION_ID = 'band';
export const CLOSING_SECTION_ID = 'closing';

export const SECTION_IDS: readonly string[] = [
  HERO_SECTION_ID,
  PROJECTS_SECTION_ID,
  BAND_SECTION_ID,
  CLOSING_SECTION_ID,
];
