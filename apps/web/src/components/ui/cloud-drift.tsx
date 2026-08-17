'use client';

import { useScrollOffset } from '../../hooks/use-scroll';
import { Cloud, CloudSprite } from './cloud';
import styles from './cloud-drift.module.css';
import type { Layer } from './constants/sky';
import * as SKY_CONSTANTS from './constants/sky';

/**
 * Where a layer sits after drifting, wrapped into a single repeat.
 *
 * The modulo is what makes the band endless. Without it the track marches off
 * to the left and leaves the right-hand side of the band empty — which is
 * exactly what the first version did once the page was scrolled past the hero.
 */
export function driftOf(offset: number, depth: number): number {
  return -((offset * SKY_CONSTANTS.SCROLL_TRANSLATION_FACTOR * depth) % SKY_CONSTANTS.LAYER_WIDTH);
}

function Repeat({ layer, at }: { readonly layer: Layer; readonly at: number }) {
  return (
    <div className={styles.repeat} style={{ left: `${at * SKY_CONSTANTS.LAYER_WIDTH}px` }}>
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
 * The arrangement — how many clouds, at what depths, how far apart — is in
 * `constants/sky.ts`. This is only how it is drawn and how far it has moved.
 *
 * Wholly decorative, so the band is `aria-hidden`. The sprite goes first: the
 * clouds are `<use>` references and draw nothing until their definition
 * exists.
 */
export function CloudDrift() {
  const offset = useScrollOffset();

  return (
    <div
      className={styles.band}
      style={{ height: `${SKY_CONSTANTS.BAND_HEIGHT}px` }}
      aria-hidden="true"
    >
      <CloudSprite />

      {SKY_CONSTANTS.LAYERS.map((layer) => (
        <div
          key={layer.id}
          className={styles.layer}
          style={{
            opacity: layer.opacity,
            transform: `translateX(${driftOf(offset, layer.depth)}px)`,
          }}
        >
          {Array.from({ length: SKY_CONSTANTS.LAYER_COPIES }, (unusedValue, copy) => (
            <Repeat key={`${layer.id}-${String(copy)}`} layer={layer} at={copy} />
          ))}
        </div>
      ))}
    </div>
  );
}
