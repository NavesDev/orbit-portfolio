'use client';

import { useScrollOffset } from '../../hooks/use-scroll';
import { Cloud, CloudSprite } from './cloud';
import styles from './cloud-drift.module.css';

/** How far the sky moves per pixel scrolled — the strip's factor, kept. */
const SCROLL_TRANSLATION_FACTOR = 0.4;

/**
 * The smallest the traced cloud survives being drawn.
 *
 * Its stroke is a fill, so a cloud drawn smaller cannot compensate with a
 * heavier line — it simply washes out. Measured: at 26px, 39% of the ink lands
 * below half opacity against 5% at full size; at 48px it is 27%.
 */
const SMALLEST_LEGIBLE_WIDTH = 48;

/**
 * The width of one repeat of a layer, and how many are laid end to end.
 *
 * A layer is translated by its drift **modulo** this width, so it never runs
 * out however far the page is scrolled: the next copy takes over exactly where
 * the last left off, because they are identical and precisely this far apart.
 * Four copies span 3440px, which covers a 2560px viewport plus the one repeat
 * the modulo consumes.
 */
const LAYER_WIDTH = 860;
const LAYER_COPIES = 4;

const BAND_HEIGHT = 92;

interface LayerCloud {
  readonly id: string;
  /** Left edge inside the repeat, in pixels. */
  readonly x: number;
  readonly top: number;
  readonly width: number;
}

interface Layer {
  readonly id: string;
  /** How near the layer is: it drives both its speed and how solid it looks. */
  readonly depth: number;
  readonly opacity: number;
  readonly clouds: readonly LayerCloud[];
}

/**
 * The sky, as three layers of fixed depth.
 *
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
const LAYERS: readonly Layer[] = [
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

/**
 * Where a layer sits after drifting, wrapped into a single repeat.
 *
 * The modulo is what makes the band endless. Without it the track marches off
 * to the left and leaves the right-hand side of the band empty — which is
 * exactly what the first version did once the page was scrolled past the hero.
 */
export function driftOf(offset: number, depth: number): number {
  return -((offset * SCROLL_TRANSLATION_FACTOR * depth) % LAYER_WIDTH);
}

function Repeat({ layer, at }: { readonly layer: Layer; readonly at: number }) {
  return (
    <div className={styles.repeat} style={{ left: `${at * LAYER_WIDTH}px` }}>
      {layer.clouds.map((cloud) => (
        <Cloud
          key={cloud.id}
          className={styles.cloud}
          style={{ left: `${cloud.x}px`, top: `${cloud.top}px`, width: `${cloud.width}px` }}
        />
      ))}
    </div>
  );
}

/**
 * The band below the hero (U-2 — OQ-03 in requirements.md).
 *
 * It replaces the prototype's scrolling list of technologies. The skills
 * section already names the stack, at length and from the database, so a strip
 * repeating four of them was the same claim in a worse form — and it was copy,
 * which meant maintaining it in two languages. Drawn sky says nothing, so
 * there is nothing to translate and nothing to contradict.
 *
 * Still translated by scroll position rather than autoplaying, which is what
 * makes it acceptable without a pause control: nothing moves unless the
 * visitor moves it.
 *
 * Wholly decorative, so the band is `aria-hidden`. The sprite goes first: the
 * clouds are `<use>` references and draw nothing until their definition
 * exists.
 */
export function CloudDrift() {
  const offset = useScrollOffset();

  return (
    <div className={styles.band} style={{ height: `${BAND_HEIGHT}px` }} aria-hidden="true">
      <CloudSprite />

      {LAYERS.map((layer) => (
        <div
          key={layer.id}
          className={styles.layer}
          style={{
            opacity: layer.opacity,
            transform: `translateX(${driftOf(offset, layer.depth)}px)`,
          }}
        >
          {Array.from({ length: LAYER_COPIES }, (unusedValue, copy) => (
            <Repeat key={`${layer.id}-${String(copy)}`} layer={layer} at={copy} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Exposed for the test that asserts the band neither overlaps nor empties. */
export const CLOUD_LAYERS = LAYERS;
export const CLOUD_LAYER_WIDTH = LAYER_WIDTH;
export const CLOUD_LAYER_COPIES = LAYER_COPIES;
