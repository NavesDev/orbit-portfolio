import type { Locale } from '@portfolio/core';

import { STAT_IDS } from '../../content/site';
import type { SiteContent } from '../../content/types';
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
 * admit when its figures are placeholder, so it renders exactly while they
 * are. The component is told so by `isIllustrative` rather than working it out
 * from the numbers — a live count that happens to equal the placeholder proves
 * nothing either way.
 */
export function StatBand({
  content,
  figures,
  isIllustrative,
  locale,
}: {
  readonly content: SiteContent['band'];
  readonly figures: Readonly<Record<(typeof STAT_IDS)[number], number>>;
  readonly isIllustrative: boolean;
  readonly locale: Locale;
}) {
  return (
    <section id={BAND_SECTION_ID} className={styles.band} aria-label={content.label}>
      <BandBackdrop />

      <div className={styles.figures}>
        {STAT_IDS.map((id) => (
          <StatFigure key={id} value={figures[id]} label={content.statLabels[id]} locale={locale} />
        ))}
      </div>

      {isIllustrative ? <p className={styles.note}>{content.illustrativeNote}</p> : null}
    </section>
  );
}
