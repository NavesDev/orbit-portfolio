import type { CSSProperties } from 'react';

import { CLOUD_PATH } from './cloud-path';

/**
 * The site's cloud.
 *
 * The drawing lives in `cloud-path.ts`, which explains where it came from and
 * why it cannot be edited by hand. This is only how it is placed on a page.
 *
 * **The path is emitted once and referenced.** It is 6 KB of traced curve, and
 * the band draws twelve clouds: inlining it in each would have put 77 KB of
 * duplicate coordinates into the HTML of a page whose entire markup is 15 KB
 * without it. `<CloudSprite />` renders the definition, and every `<Cloud />`
 * is a `<use>` pointing at it.
 *
 * The `viewBox` is the ink's own bounding box, not the 512 square it was
 * traced out of: the source PNG has 67px of empty canvas above the drawing and
 * 68 below, and a component that carried that margin would leave a gap no
 * caller could see to correct. Cropped, `width` alone sizes the cloud and the
 * height follows at the drawing's own 0.73 aspect.
 *
 * Decorative in every use so far, so `aria-hidden` is the default rather than
 * something each caller remembers. A caller with a reason to name it passes a
 * `label`.
 */
const SPRITE_ID = 'cloud-shape';
const VIEW_BOX = '-1 67 514 377';

/**
 * The definition every `<Cloud />` points at. Render it once, above the clouds
 * that use it — a `<use>` whose target is missing draws nothing at all.
 */
export function CloudSprite() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <defs>
        <path id={SPRITE_ID} d={CLOUD_PATH} fillRule="evenodd" />
      </defs>
    </svg>
  );
}

export function Cloud({
  className,
  style,
  label,
}: {
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
  readonly label?: string | undefined;
}) {
  return (
    <svg
      className={className}
      style={style}
      viewBox={VIEW_BOX}
      fill="currentColor"
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
    >
      <use href={`#${SPRITE_ID}`} />
    </svg>
  );
}
