'use client';

import type { Locale } from '@portfolio/core';
import { useEffect, useState } from 'react';

import { useHasBeenInView } from '../../hooks/use-in-view';
import { COUNT_UP_INTERVAL_MS, figureAtStep, isCountComplete } from '../../lib/stats/count-up';
import styles from './stat-figure.module.css';

const FIRST_STEP = 0;
const NEXT_STEP = 1;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function wantsReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * A figure with no source, drawn as a placeholder (FR-22).
 *
 * The bar carries a slow idle sheen rather than a loading shimmer, and the
 * distinction is the point: on a statically generated page nothing is loading,
 * because this markup was rendered when the source could not be reached and
 * the same HTML is served until the next revalidation. It marks an absence, at
 * a pace that does not promise an arrival — and it says so to a screen reader
 * rather than leaving the stat silent.
 */
function MissingFigure({ label }: { readonly label: string }) {
  return (
    <div className={styles.missing}>
      <span className={styles.hidden}>{label}</span>
    </div>
  );
}

/**
 * One figure of the stat band, counting up the first time it is seen (FR-21).
 *
 * It starts rendered at its final value, not at zero. That is what the server
 * sends, what a visitor without JavaScript keeps, and what a visitor who asked
 * for less motion keeps — the animation is an enhancement laid over a page
 * that is already correct. Only once the component knows it will animate does
 * it drop to zero and count.
 *
 * The figure is not announced as it counts: a screen reader reading thirty-four
 * intermediate numbers is worse than reading the final one, which is what the
 * DOM settles on.
 */
export function StatFigure({
  value,
  label,
  unavailableLabel,
  locale,
}: {
  /** `null` when the figure has no source — see `MissingFigure`. */
  readonly value: number | null;
  readonly label: string;
  readonly unavailableLabel: string;
  readonly locale: Locale;
}) {
  const [ref, hasBeenInView] = useHasBeenInView<HTMLDivElement>();
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    if (value === null || !hasBeenInView || wantsReducedMotion()) {
      return;
    }

    setStep(FIRST_STEP);

    const timer = setInterval(() => {
      setStep((current) => {
        const next = (current ?? FIRST_STEP) + NEXT_STEP;

        if (isCountComplete(next)) {
          clearInterval(timer);
        }

        return next;
      });
    }, COUNT_UP_INTERVAL_MS);

    return () => {
      clearInterval(timer);
    };
  }, [hasBeenInView, value]);

  const shown = value === null || step === null ? value : figureAtStep(value, step);

  return (
    <div className={styles.stat} ref={ref}>
      {shown === null ? (
        <MissingFigure label={`${label}: ${unavailableLabel}`} />
      ) : (
        <div className={styles.figure}>{shown.toLocaleString(locale)}</div>
      )}
      <div className={styles.label}>{label}</div>
    </div>
  );
}
