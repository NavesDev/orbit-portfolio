'use client';

import { useSyncExternalStore } from 'react';

import {
  getScrollMetrics,
  getServerScrollMetrics,
  subscribeToScroll,
} from '../lib/scroll/scroll-store';

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
