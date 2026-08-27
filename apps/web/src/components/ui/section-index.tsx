'use client';

import { useActiveSectionIndex } from '../../hooks/use-scroll';
import styles from './section-index.module.css';
import { SECTION_IDS } from './section-registry';

const INDEX_DIGITS = 2;
const INDEX_PAD_CHARACTER = '0';
const INDEX_SEPARATOR = ' / ';
const FIRST_SECTION_ORDINAL = 1;

function format(ordinal: number): string {
  return String(ordinal).padStart(INDEX_DIGITS, INDEX_PAD_CHARACTER);
}

/**
 * The nav's section counter (U-2 — OQ-01 in requirements.md).
 *
 * Renders nothing while `SECTION_IDS` is empty: an index reading `00 / 00` is
 * noise, and hiding it here means the tasks that add sections need no
 * coordination with this component beyond appending an id.
 *
 * The active section comes from `useActiveSectionIndex`, which measures each
 * registered section's actual position against the viewport — not a fraction
 * of total scroll progress. An equal-division guess is only right while every
 * section happens to be a similar height; the projects section broke that the
 * moment it landed several cards tall between the hero and the band.
 */
export function SectionIndex() {
  const activeIndex = useActiveSectionIndex(SECTION_IDS);

  if (SECTION_IDS.length === 0) {
    return null;
  }

  const active = activeIndex + FIRST_SECTION_ORDINAL;

  return (
    <span className={styles.index}>
      {format(active)}
      {INDEX_SEPARATOR}
      {format(SECTION_IDS.length)}
    </span>
  );
}
