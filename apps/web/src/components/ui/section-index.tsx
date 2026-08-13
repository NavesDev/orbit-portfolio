'use client';

import { useScrollProgress } from '../../hooks/use-scroll';
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
 * The active section comes from scroll progress across the registry rather
 * than the prototype's per-element `getBoundingClientRect` sweep, which cannot
 * run while no section exists. The task that adds the first section is free to
 * replace this derivation with one that measures elements.
 */
export function SectionIndex() {
  const progress = useScrollProgress();

  if (SECTION_IDS.length === 0) {
    return null;
  }

  const active = Math.min(
    SECTION_IDS.length,
    Math.floor(progress * SECTION_IDS.length) + FIRST_SECTION_ORDINAL,
  );

  return (
    <span className={styles.index}>
      {format(active)}
      {INDEX_SEPARATOR}
      {format(SECTION_IDS.length)}
    </span>
  );
}
