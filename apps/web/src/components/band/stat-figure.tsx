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
  locale,
}: {
  readonly value: number;
  readonly label: string;
  readonly locale: Locale;
}) {
  const [ref, hasBeenInView] = useHasBeenInView<HTMLDivElement>();
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    if (!hasBeenInView || wantsReducedMotion()) {
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
  }, [hasBeenInView]);

  const shown = step === null ? value : figureAtStep(value, step);

  return (
    <div className={styles.stat} ref={ref}>
      <div className={styles.figure}>{shown.toLocaleString(locale)}</div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
