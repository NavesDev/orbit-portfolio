'use client';

import type { StripPhrase } from '../../content/types';
import { useScrollOffset } from '../../hooks/use-scroll';
import styles from './marquee-strip.module.css';

/** How far the track moves per pixel scrolled — the prototype's factor. */
const SCROLL_TRANSLATION_FACTOR = 0.4;

function Phrases({ phrases }: { readonly phrases: readonly StripPhrase[] }) {
  return (
    <>
      {phrases.map((phrase) => (
        <span key={phrase.lead} className={styles.phrase}>
          <b className={styles.lead}>{phrase.lead}</b> {phrase.rest}
        </span>
      ))}
    </>
  );
}

/**
 * The strip below the hero (U-2 — OQ-03 in requirements.md).
 *
 * It is translated by scroll position rather than autoplaying, which is what
 * makes it acceptable without a pause control: nothing moves unless the
 * visitor moves it.
 *
 * The phrase list is rendered twice so the track still covers the viewport
 * once it has travelled; the second copy is `aria-hidden` so a screen reader
 * hears each phrase once.
 */
export function MarqueeStrip({
  phrases,
}: {
  readonly phrases: readonly StripPhrase[];
}) {
  const offset = useScrollOffset();

  return (
    <div className={styles.strip}>
      <div
        className={styles.track}
        style={{ transform: `translateX(${-offset * SCROLL_TRANSLATION_FACTOR}px)` }}
      >
        <Phrases phrases={phrases} />
        <span aria-hidden="true" className={styles.track}>
          <Phrases phrases={phrases} />
        </span>
      </div>
    </div>
  );
}
