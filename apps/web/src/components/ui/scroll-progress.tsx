'use client';

import { useScrollProgress } from '../../hooks/use-scroll';
import styles from './scroll-progress.module.css';

/**
 * The scroll progress bar (U-2 — OQ-02 in requirements.md).
 *
 * `aria-hidden`: it restates what the scrollbar already conveys, so announcing
 * it costs an accessibility score rather than earning one (NFR-06).
 *
 * Scaled rather than resized — the prototype animates `width`, which lays out
 * on every frame. `transform` does not.
 */
export function ScrollProgress() {
  const progress = useScrollProgress();

  return (
    <div
      className={styles.progress}
      style={{ transform: `scaleX(${progress})` }}
      aria-hidden="true"
    />
  );
}
