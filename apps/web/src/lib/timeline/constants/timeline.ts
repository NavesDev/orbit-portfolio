/**
 * How many entries a page of the timeline carries (FR-14).
 *
 * Four, which is what the section shows before the "show more" control. It is
 * named here rather than written at the two call sites — the page's first read
 * and the Server Action's — because those two must agree: a first page of four
 * followed by an action asking for three would skip an entry silently.
 */
export const TIMELINE_PAGE_SIZE = 4;

/** Where the page's own first read starts. */
export const FIRST_PAGE_OFFSET = 0;
