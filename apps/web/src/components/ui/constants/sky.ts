/**
 * The sky the band drifts, as data.
 *
 * The whole arrangement is here rather than in the component because it *is*
 * the design: six clouds, three depths, and the distances that keep them from
 * ever touching. A reader adjusting the sky should not have to read a render
 * function, and a reader following the render should not have to scroll past
 * six coordinates.
 */

/** How far the sky moves per pixel scrolled — the strip's factor, kept. */
export const SCROLL_TRANSLATION_FACTOR = 0.4;

/**
 * The smallest the traced cloud survives being drawn.
 *
 * Its stroke is a fill, so a cloud drawn smaller cannot compensate with a
 * heavier line — it simply washes out. Measured: at 26px, 39% of the ink lands
 * below half opacity against 5% at full size; at 48px it is 27%.
 */
export const SMALLEST_LEGIBLE_WIDTH = 48;

/**
 * The width of one repeat of a layer, and how many are laid end to end.
 *
 * A layer is translated by its drift **modulo** this width, so it never runs
 * out however far the page is scrolled: the next copy takes over exactly where
 * the last left off, because they are identical and precisely this far apart.
 * Four copies span 3440px, which covers a 2560px viewport plus the one repeat
 * the modulo consumes.
 */
export const LAYER_WIDTH = 860;
export const LAYER_COPIES = 4;

export const BAND_HEIGHT = 92;

export interface LayerCloud {
  readonly id: string;
  /** Left edge inside the repeat, in pixels. */
  readonly x: number;
  readonly top: number;
  readonly width: number;
}

export interface Layer {
  readonly id: string;
  /** How near the layer is: it drives both its speed and how solid it looks. */
  readonly depth: number;
  readonly opacity: number;
  readonly clouds: readonly LayerCloud[];
}

/**
 * **Depth belongs to a layer, never to a single cloud.** An earlier version
 * gave every cloud its own speed inside one flex row, which looked right until
 * the page scrolled: neighbours closed the gap between them at the difference
 * of their speeds and eventually overlapped. Clouds that share a speed hold
 * their spacing forever, so the arrangement written here is the arrangement at
 * every scroll position.
 *
 * Positions are absolute within the repeat, which is also what lets a layer
 * wrap: every cloud ends before `LAYER_WIDTH`, so none can collide with the
 * first cloud of the next repeat.
 *
 * Six clouds to a repeat, spread so the three layers do not share a phase: it
 * works out at thirteen or so across a 1920px viewport, near the density of
 * the strip this replaced, and no stretch of empty band wider than about a
 * third of a screen. A denser sky competes with the hero above it instead of
 * separating it from the band below.
 */
export const LAYERS: readonly Layer[] = [
  {
    id: 'far',
    depth: 0.45,
    opacity: 0.28,
    clouds: [
      { id: 'far-a', x: 120, top: 30, width: SMALLEST_LEGIBLE_WIDTH },
      { id: 'far-b', x: 700, top: 26, width: 52 },
    ],
  },
  {
    id: 'mid',
    depth: 0.78,
    opacity: 0.4,
    clouds: [
      { id: 'mid-a', x: 40, top: 14, width: 58 },
      { id: 'mid-b', x: 520, top: 20, width: 54 },
    ],
  },
  {
    id: 'near',
    depth: 1.2,
    opacity: 0.52,
    clouds: [
      { id: 'near-a', x: 250, top: 2, width: 72 },
      { id: 'near-b', x: 640, top: 8, width: 64 },
    ],
  },
];
