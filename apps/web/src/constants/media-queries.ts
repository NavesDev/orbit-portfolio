/**
 * Media queries this app asks JavaScript about.
 *
 * A query written twice is a query that can be misspelled once: a typo in
 * `prefers-reduced-motion` does not fail, it silently answers "no preference"
 * and the animation a visitor asked to be spared runs anyway. Naming it here
 * means the two components that honour it are honouring the same string.
 *
 * These are only for what has to be decided in JavaScript. A rule that CSS can
 * express belongs in a stylesheet, where `@media` needs no listener at all.
 */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
