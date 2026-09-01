'use client';

import type { GetTimelineOutput, Locale, TimelineEntryView } from '@portfolio/core';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import type { SiteContent } from '../../content/types';
import { subscribeToScroll } from '../../lib/scroll/scroll-store';
import { loadMoreTimeline } from '../../lib/timeline/timeline-actions';
import { computeSpineFill, isNodePassed } from '../../lib/timeline/spine';
import * as TRACK_CONSTANTS from './constants/track';
import { TimelineItem } from './timeline-item';
import { TimelineModal } from './timeline-modal';
import styles from './timeline-track.module.css';

/**
 * The spine and everything that changes on it.
 *
 * The section's only stateful piece: how many entries have been loaded, how
 * far the spine has filled, which nodes have been passed, and which entry's
 * modal is open. `TimelineSection` around it stays a Server Component.
 *
 * It subscribes to the shared scroll store rather than adding a listener of
 * its own — roadmap 3.9's consolidation, already carrying the progress bar and
 * the nav index. Node positions are read from the DOM by attribute rather than
 * through a ref per item: the alternative threads a ref array down through
 * `TimelineItem` for a measurement that is not part of what that component is
 * for, and the count of nodes changes every time a page loads.
 *
 * `loadMore` is a parameter with the real action as its default, which is what
 * lets a component test drive paging with a stub and no module mock. The
 * server never passes it, so nothing unserializable crosses the boundary.
 */
export function TimelineTrack({
  initial,
  content,
  locale,
  loadMore = loadMoreTimeline,
}: {
  readonly initial: GetTimelineOutput;
  readonly content: SiteContent['timeline'];
  readonly locale: Locale;
  readonly loadMore?: (locale: string, offset: number) => Promise<GetTimelineOutput>;
}) {
  const [entries, setEntries] = useState<readonly TimelineEntryView[]>(initial.entries);
  const [total, setTotal] = useState(initial.total);
  const [openEntry, setOpenEntry] = useState<TimelineEntryView | null>(null);
  const [isPending, startTransition] = useTransition();

  const listRef = useRef<HTMLOListElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [fill, setFill] = useState(TRACK_CONSTANTS.EMPTY_SPINE);
  const [passedCount, setPassedCount] = useState(TRACK_CONSTANTS.NOTHING_PASSED);

  useEffect(() => {
    function measure(): void {
      const list = listRef.current;

      if (list === null) {
        return;
      }

      const bounds = list.getBoundingClientRect();
      setFill(computeSpineFill(bounds.top, bounds.height, window.innerHeight));

      const nodes = [...list.querySelectorAll(TRACK_CONSTANTS.NODE_SELECTOR)];
      const passed = nodes.filter((node) => {
        const rect = node.getBoundingClientRect();

        return isNodePassed(rect.top + rect.height / TRACK_CONSTANTS.HALF, window.innerHeight);
      });

      setPassedCount(passed.length);
    }

    measure();

    return subscribeToScroll(measure);
  }, [entries.length]);

  const closeModal = useCallback(() => {
    setOpenEntry(null);
    triggerRef.current?.focus();
  }, []);

  const openDetails = useCallback((entry: TimelineEntryView, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setOpenEntry(entry);
  }, []);

  function showMore(): void {
    startTransition(async () => {
      const next = await loadMore(locale, entries.length);

      setEntries((loaded) => [...loaded, ...next.entries]);
      setTotal(next.total);
    });
  }

  const hasMore = entries.length < total;

  return (
    <div className={styles.wrap}>
      <div className={styles.track}>
        <div className={styles.spine} aria-hidden="true">
          <span className={styles.fill} style={{ transform: `scaleY(${fill})` }} />
        </div>

        <ol className={styles.items} ref={listRef}>
        {entries.map((entry, index) => (
          <TimelineItem
            key={entry.id}
            entry={entry}
            side={index % TRACK_CONSTANTS.SIDES === 0 ? 'left' : 'right'}
            isPassed={index < passedCount}
            content={content}
            onOpenDetails={openDetails}
          />
          ))}
        </ol>
      </div>

      {hasMore ? (
        <button
          type="button"
          className={styles.showMore}
          onClick={showMore}
          disabled={isPending}
          aria-busy={isPending}
        >
          {content.showMore}
        </button>
      ) : null}

      {openEntry === null ? null : (
        <TimelineModal entry={openEntry} content={content} onClose={closeModal} />
      )}
    </div>
  );
}
