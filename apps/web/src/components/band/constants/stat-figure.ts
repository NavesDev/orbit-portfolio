/**
 * The stat figure's own quantities: where its count starts, and how large the
 * placeholder that replaces it is.
 */
export const FIRST_STEP = 0;
export const NEXT_STEP = 1;

/**
 * The bar that stands in for a figure, measured in the figure's own type:
 * `.missing` carries the digits' size and weight, so `ch` is a digit's width
 * and `em` is their size.
 *
 * Two and a half digits wide and about the height of their ink — the figures
 * run to two, three and four digits, so the placeholder sits between rather
 * than matching the longest. Taller and it reads as a redaction; much shorter
 * and it stops belonging to the number it replaces.
 */
export const MISSING_FIGURE_WIDTH = '2.5ch';
export const MISSING_FIGURE_HEIGHT = '0.7em';
