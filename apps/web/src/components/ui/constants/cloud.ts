/**
 * How the cloud drawing is placed on a page.
 *
 * The drawing itself is in `cloud-path.ts`, which explains where it came from.
 * These are the two facts a caller renders it through.
 */

/** The id the sprite is defined under and every `<use>` points at. */
export const CLOUD_SPRITE_ID = 'cloud-shape';

/**
 * The ink's own bounding box, not the 512 square it was traced out of: the
 * source PNG carries 67px of empty canvas above the drawing and 68 below, and
 * a component that kept that margin would leave a gap no caller could see to
 * correct. Cropped, `width` alone sizes the cloud and the height follows at
 * the drawing's own 0.73 aspect.
 */
export const CLOUD_VIEW_BOX = '-1 67 514 377';
