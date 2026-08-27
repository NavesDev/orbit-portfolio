'use client';

import { useSyncExternalStore } from 'react';

import { computeActiveSectionIndex } from '../lib/scroll/active-section';
import {
  getScrollMetrics,
  getServerScrollMetrics,
  subscribeToScroll,
} from '../lib/scroll/scroll-store';

const SERVER_ACTIVE_SECTION_INDEX = 0;

/**
 * Both hooks return a number rather than the metrics object:
 * `useSyncExternalStore` compares snapshots by identity, and a fresh object
 * every frame would re-render every subscriber on every frame.
 */
export function useScrollProgress(): number {
  return useSyncExternalStore(
    subscribeToScroll,
    () => getScrollMetrics().progress,
    () => getServerScrollMetrics().progress,
  );
}

export function useScrollOffset(): number {
  return useSyncExternalStore(
    subscribeToScroll,
    () => getScrollMetrics().offset,
    () => getServerScrollMetrics().offset,
  );
}

/**
 * Which of `ids`' sections is on screen right now, by actual element
 * position rather than a fraction of total document height (see
 * `computeActiveSectionIndex`'s own doc for why that distinction matters).
 */
export function useActiveSectionIndex(ids: readonly string[]): number {
  return useSyncExternalStore(
    subscribeToScroll,
    () => computeActiveSectionIndex(ids),
    () => SERVER_ACTIVE_SECTION_INDEX,
  );
}
