'use client';

import { useEffect, useRef, useState } from 'react';

import { useScrollOffset } from '../../hooks/use-scroll';
import styles from './closing-orb.module.css';
import * as CLOSING_ORB_CONSTANTS from './constants/closing-orb';

/**
 * The glow behind the closing headline.
 *
 * Decorative, so `aria-hidden`. Built the same way as the stat band's
 * backdrop: it subscribes to the shared scroll store instead of adding a
 * listener, and measures its distance from the top of the document once per
 * layout rather than calling `getBoundingClientRect` every frame the way the
 * prototype does — the rect moves with scroll, `offsetTop` does not.
 *
 * The reduced-motion rule lives in the stylesheet, where the transform is
 * simply ignored. Cheaper than branching here, and it cannot drift out of sync
 * with the media query the rest of the site honours.
 */
export function ClosingOrb() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [documentTop, setDocumentTop] = useState<number | null>(CLOSING_ORB_CONSTANTS.UNMEASURED);
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

  const distance =
    documentTop === CLOSING_ORB_CONSTANTS.UNMEASURED
      ? CLOSING_ORB_CONSTANTS.AT_REST
      : documentTop - offset;

  return (
    <div
      ref={ref}
      className={styles.orb}
      style={{
        transform: `translate(${distance * CLOSING_ORB_CONSTANTS.PARALLAX_FACTOR_X}px, ${
          distance * CLOSING_ORB_CONSTANTS.PARALLAX_FACTOR_Y
        }px)`,
      }}
      aria-hidden="true"
    />
  );
}
