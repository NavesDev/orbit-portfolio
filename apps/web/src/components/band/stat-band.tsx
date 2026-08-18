import type { Locale } from '@portfolio/core';

import { STAT_IDS } from '../../content/site';
import type { SiteContent } from '../../content/types';
import type { StatFigures } from '../../lib/stats/figures';
import { hasMissingFigure } from '../../lib/stats/figures';
import { BAND_SECTION_ID } from '../ui/section-registry';
import { BandBackdrop } from './band-backdrop';
import styles from './stat-band.module.css';
import { StatFigure } from './stat-figure';

/**
 * The stat band (FR-21, FR-22).
 *
 * A Server Component: the figures are computed once, on the server, and handed
 * down as numbers. Only the counting and the drifting grid need the client,
 * and only they declare `'use client'` (NFR-02).
 *
 * The band has no visible heading — the design is four numbers — so the
 * section carries an accessible name of its own rather than appearing in the
 * landmark list as an unnamed region.
 *
 * The note is not decoration and not a footnote: FR-22 requires the band to
 * account for a figure it cannot show, so it renders exactly while one is
 * missing. Which is a question about the figures themselves — a `null` is the
 * absence — rather than a flag the caller has to remember to pass.
 */
export function StatBand({
  content,
  figures,
  locale,
}: {
  readonly content: SiteContent['band'];
  readonly figures: StatFigures;
  readonly locale: Locale;
}) {
  return (
    <section id={BAND_SECTION_ID} className={styles.band} aria-label={content.label}>
      <BandBackdrop />

      <div className={styles.figures}>
        {STAT_IDS.map((id) => (
          <StatFigure
            key={id}
            value={figures[id]}
            label={content.statLabels[id]}
            unavailableLabel={content.unavailable}
            locale={locale}
          />
        ))}
      </div>

      {hasMissingFigure(figures) ? <p className={styles.note}>{content.missingNote}</p> : null}
    </section>
  );
}
