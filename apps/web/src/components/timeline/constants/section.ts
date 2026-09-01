/**
 * What `aria-labelledby` on the section points at.
 *
 * A constant rather than the same literal in two attributes: if the two ever
 * disagreed the section would lose its accessible name silently, which is the
 * kind of break no page renders differently.
 */
export const HEADING_ID = 'timeline-heading';
