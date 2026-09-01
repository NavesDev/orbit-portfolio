import type { GetTimelineOutput, Locale } from '@portfolio/core';

import type { SiteContent } from '../../content/types';
import { TIMELINE_SECTION_ID } from '../ui/section-registry';
import * as SECTION_CONSTANTS from './constants/section';
import styles from './timeline-section.module.css';
import { TimelineTrack } from './timeline-track';

/**
 * The timeline section (FR-11–FR-15, roadmap 3.6).
 *
 * A Server Component: `initial` arrives already computed by `getTimelinePage`
 * in the page's composition root, so the first page of entries is prerendered
 * with the rest of the statically generated page and only "show more" costs a
 * request.
 *
 * The heading names the landmark through `aria-labelledby`. A `<section>`
 * without an accessible name is not exposed as a region at all, so a screen
 * reader listing the page's landmarks would find the timeline missing from it.
 */
export function TimelineSection({
  content,
  initial,
  locale,
}: {
  readonly content: SiteContent['timeline'];
  readonly initial: GetTimelineOutput;
  readonly locale: Locale;
}) {
  return (
    <section
      id={TIMELINE_SECTION_ID}
      className={styles.section}
      aria-labelledby={SECTION_CONSTANTS.HEADING_ID}
    >
      <div className={styles.head}>
        <p className={styles.kicker}>{content.kicker}</p>
        <h2 className={styles.heading} id={SECTION_CONSTANTS.HEADING_ID}>
          {content.heading}
        </h2>
      </div>

      <TimelineTrack initial={initial} content={content} locale={locale} />
    </section>
  );
}
