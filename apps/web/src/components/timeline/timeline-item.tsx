'use client';

import type { TimelineEntryView } from '@portfolio/core';

import type { SiteContent } from '../../content/types';
import { formatPeriod } from '../../lib/timeline/period';
import { KindIcon } from './kind-icon';
import styles from './timeline-item.module.css';

/**
 * One entry on the spine (FR-12).
 *
 * `side` is a prop and not a `:nth-child` rule, which is the part of the
 * prototype that could not survive this section. It alternates its cards in
 * CSS, which works only while the list is one fixed block of markup; here
 * entries arrive in pages, so parity is a fact about position in the
 * accumulated list — something the component knows and a stylesheet does not.
 *
 * `isPassed` comes from the same measurement that fills the spine, so a card
 * and its dot light together (FR-15).
 *
 * The details control names the entry it opens rather than reading "view
 * details" four times over: identical accessible names on four buttons leave a
 * screen-reader user choosing between four identical options. The visible text
 * is still contained in that name, which is what WCAG 2.5.3 requires so a
 * voice-control user can say what they see.
 */
export function TimelineItem({
  entry,
  side,
  isPassed,
  content,
  onOpenDetails,
}: {
  readonly entry: TimelineEntryView;
  readonly side: 'left' | 'right';
  readonly isPassed: boolean;
  readonly content: SiteContent['timeline'];
  readonly onOpenDetails: (entry: TimelineEntryView, trigger: HTMLButtonElement) => void;
}) {
  return (
    <li className={styles.item} data-side={side} data-passed={isPassed}>
      <article className={styles.card}>
        <p className={styles.kind}>
          <KindIcon kind={entry.kind} className={styles.kindIcon} />
          {content.kindLabels[entry.kind]}
        </p>

        <p className={styles.period}>{formatPeriod(entry, content.ongoing)}</p>
        <h3 className={styles.title}>{entry.title}</h3>
        <p className={styles.organization}>{entry.organization}</p>

        {entry.skills.length === 0 ? null : (
          <ul className={styles.skills} aria-label={content.skillsHeading}>
            {entry.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className={styles.details}
          aria-label={`${content.detailsCta}: ${entry.title}`}
          onClick={(event) => {
            onOpenDetails(entry, event.currentTarget);
          }}
        >
          {content.detailsCta}
        </button>
      </article>

      <span className={styles.node} data-timeline-node="" aria-hidden="true">
        <span className={styles.dot} />
      </span>
    </li>
  );
}
