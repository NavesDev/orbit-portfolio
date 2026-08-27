/**
 * The sanitization whitelist for `icon_svg`, from `data-model.md § 1`.
 *
 * A whitelist rather than a blocklist: the set of markup a stroke icon needs is
 * small and closed, while the set of markup that can execute is not. Anything
 * unlisted is rejected, so a tag nobody thought of is refused by default
 * instead of accepted by omission (NFR-07).
 */
export const ALLOWED_TAGS: readonly string[] = [
  'svg',
  'g',
  'path',
  'circle',
  'rect',
  'line',
  'polyline',
  'polygon',
];

/**
 * Attributes an icon may carry.
 *
 * Geometry, stroke and fill, and nothing that names a target or a handler.
 * `href`, `xlink:href` and `style` are absent on purpose: the first two can
 * carry a `javascript:` URL, and the third can carry a `url()` fetch.
 */
export const ALLOWED_ATTRIBUTES: readonly string[] = [
  'xmlns',
  'viewbox',
  'width',
  'height',
  'fill',
  'fill-rule',
  'clip-rule',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'stroke-dashoffset',
  'opacity',
  'transform',
  'd',
  'points',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'aria-hidden',
  'focusable',
];

/**
 * The prefix that makes an attribute a handler.
 *
 * Checked as a prefix rather than by listing `onclick`, `onload` and the rest:
 * the list of events grows with the platform, and the one that lands next year
 * has to be rejected by the code shipped this year.
 */
export const EVENT_HANDLER_PREFIX = 'on';

/**
 * Schemes an attribute value may not name, whatever the attribute.
 *
 * Belt and braces beside the attribute whitelist — `href` is already unlisted,
 * so this catches a value that arrives through an attribute later added to it.
 */
export const DENIED_VALUE_SCHEMES: readonly string[] = ['javascript:', 'data:', 'vbscript:'];

/**
 * A budget, so a pathological string cannot be scanned character by character
 * on every render. Generous: the seeded GitHub mark is about 400 characters.
 */
export const MAX_LENGTH = 4096;

export const ROOT_TAG = 'svg';
