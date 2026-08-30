'use client';

import { useHasBeenInView } from '../../hooks/use-in-view';
import styles from './progress-bar.module.css';

/**
 * A project card's progress bar (FR-07).
 *
 * Starts at rest — `width: 0` — and animates to `percent` only once, the first
 * time it scrolls into view, the same "enhancement over an already-correct
 * page" shape `StatFigure` uses. A visitor without JavaScript, or one who
 * never scrolls the card into view, still gets a bar; it simply never fills,
 * which is a strictly worse but never broken result.
 */
export function ProgressBar({ percent, label }: { readonly percent: number; readonly label: string }) {
  const [ref, hasBeenInView] = useHasBeenInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={styles.track}
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={styles.fill}
        data-testid="progress-bar-fill"
        style={{ width: hasBeenInView ? `${percent}%` : '0%' }}
      />
    </div>
  );
}
