'use client';

import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import { DEFAULT_VISIBLE_RATIO } from './constants/in-view';


/**
 * Whether an element has been scrolled into view — once, and then never again.
 *
 * "Once" is the requirement, not an optimisation: FR-21 asks for figures that
 * animate on first view, and a figure that re-counts every time it scrolls
 * past reads as a glitch. The observer disconnects the moment it fires, so
 * nothing keeps observing a section the visitor has already seen.
 *
 * An `IntersectionObserver` rather than the shared scroll store: the store
 * publishes a document-wide position, and answering "is this element visible?"
 * from it would mean measuring the element on every frame.
 */
export function useHasBeenInView<T extends Element>(
  visibleRatio: number = DEFAULT_VISIBLE_RATIO,
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (element === null || hasBeenInView) {
      return;
    }

    /*
     * A browser without `IntersectionObserver` gets the figures at rest rather
     * than a section that never arrives. Fail loud is right for a programming
     * error; this is a capability check, and the fallback is the honest value.
     */
    if (typeof IntersectionObserver === 'undefined') {
      setHasBeenInView(true);

      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasBeenInView(true);
          observer.disconnect();
        }
      },
      { threshold: visibleRatio },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasBeenInView, visibleRatio]);

  return [ref, hasBeenInView];
}
