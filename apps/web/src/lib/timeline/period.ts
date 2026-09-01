import type { TimelineEntryView, TimelineKind } from '@portfolio/core';

import * as PERIOD_CONSTANTS from './constants/period';

/**
 * A timeline entry's period, in words (FR-13).
 *
 * Years, not months: the prototype shows `2024 — atual` and `2025`, and a
 * trajectory reads as a sequence of years rather than of dates.
 *
 * The ongoing wording is passed in rather than looked up here, because it is
 * copy — one phrase per kind per locale, held in `content/[locale]/` where a
 * missing translation is a compile error. This function decides the *shape* of
 * the period and never the words.
 *
 * A closed period inside a single year collapses to that year alone: `2025 —
 * 2025` says nothing the bare year does not.
 */
export function formatPeriod(
  entry: Pick<TimelineEntryView, 'startedOn' | 'endedOn' | 'isOngoing' | 'kind'>,
  ongoing: Readonly<Record<TimelineKind, string>>,
): string {
  const ongoingWord = ongoing[entry.kind];
  const startYear = yearOf(entry.startedOn);

  /*
   * `timeline_entries.started_on` is NOT NULL, so this branch is unreachable
   * through the database. It exists because `DateRange` allows an open start —
   * it is shared with `projects`, where the column is nullable — and a period
   * that renders as a bare dash would be worse than one that renders as the
   * one fact it still has.
   */
  if (startYear === null) {
    return ongoingWord;
  }

  if (entry.isOngoing) {
    return `${startYear}${PERIOD_CONSTANTS.RANGE_SEPARATOR}${ongoingWord}`;
  }

  const endYear = yearOf(entry.endedOn);

  if (endYear === null || endYear === startYear) {
    return startYear;
  }

  return `${startYear}${PERIOD_CONSTANTS.RANGE_SEPARATOR}${endYear}`;
}

function yearOf(date: string | null): string | null {
  return date === null ? null : date.slice(0, PERIOD_CONSTANTS.YEAR_LENGTH);
}
