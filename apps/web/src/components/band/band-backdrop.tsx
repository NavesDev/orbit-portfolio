'use client';

import { useEffect, useRef, useState } from 'react';

import { useScrollOffset } from '../../hooks/use-scroll';
import styles from './band-backdrop.module.css';
import { AT_REST, PARALLAX_FACTOR, UNMEASURED } from './constants/band-backdrop';

/**
 * The stat band's drifting dot grid.
 *
 * Decorative, so `aria-hidden`. It subscribes to the shared scroll store
 * rather than adding a listener of its own, and it measures its own distance
 * from the top of the document once per layout instead of calling
 * `getBoundingClientRect` on every frame the way the prototype does — the rect
 * changes with scroll, but `offsetTop` does not.
 */
export function BandBackdrop() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [documentTop, setDocumentTop] = useState<number | null>(UNMEASURED);
  const offset = useScrollOffset();

  useEffect(() => {
    function measure(): void {
      const element = ref.current;

      if (element !== null) {
        setDocumentTop(element.getBoundingClientRect().top + window.scrollY);
      }
    }

    measure();
    window.addEventListener('resize', measure);

    return () => {
      window.removeEventListener('resize', measure);
    };
  }, []);

  /*
   * Until the element has been measured it does not move — which is also what
   * the server renders, so the first client render matches it.
   */
  const shift = documentTop === UNMEASURED ? AT_REST : (documentTop - offset) * PARALLAX_FACTOR;

  return (
    <div
      ref={ref}
      className={styles.backdrop}
      style={{ transform: `translateY(${shift}px)` }}
      aria-hidden="true"
    />
  );
}
