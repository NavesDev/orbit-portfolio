/**
 * How a project's `description` (Markdown, data-model.md § 3) is read when a
 * card asks it for a one-line summary.
 */

/** A blank line — what separates one Markdown block from the next. */
export const PARAGRAPH_SEPARATOR = '\n\n';

/**
 * A bullet or ordered list item. A description that opens straight into a
 * list has no lead prose to lift, and a card showing `- **Clean architecture**
 * in a monorepo` would be printing markup at a reader.
 */
export const LIST_ITEM_PATTERN = /^\s*(?:[-*+]|\d+\.)\s/;
