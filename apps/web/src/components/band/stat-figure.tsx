'use client';

import type { Locale } from '@portfolio/core';
import { useEffect, useState } from 'react';

import { REDUCED_MOTION_QUERY } from '../../constants/media-queries';
import { useHasBeenInView } from '../../hooks/use-in-view';
import { COUNT_UP_INTERVAL_MS, figureAtStep, isCountComplete } from '../../lib/stats/count-up';
import { Skeleton } from '../ui/skeleton';
import * as FIGURE_CONSTANTS from './constants/stat-figure';
import styles from './stat-figure.module.css';

function wantsReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * A figure with no source, drawn as a placeholder (FR-22).
 *
 * The wrapper keeps the digits' full height so the band does not shift when a
 * figure is missing — a failure that also moves the layout is two problems —
 * while the bar inside is sized against it.
 *
 * It is labelled rather than silent: this placeholder replaces a figure the
 * page has already named, so a screen reader hearing the label and nothing
 * else would be told a stat exists and never told what became of it.
 */
function MissingFigure({ label }: { readonly label: string }) {
  return (
    <div className={styles.missing}>
      <Skeleton
        width={FIGURE_CONSTANTS.MISSING_FIGURE_WIDTH}
        height={FIGURE_CONSTANTS.MISSING_FIGURE_HEIGHT}
        label={label}
      />
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

    setStep(FIGURE_CONSTANTS.FIRST_STEP);

    const timer = setInterval(() => {
      setStep((current) => {
        const next = (current ?? FIGURE_CONSTANTS.FIRST_STEP) + FIGURE_CONSTANTS.NEXT_STEP;

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
