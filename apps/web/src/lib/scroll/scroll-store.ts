const SCROLL_EVENT = 'scroll';
const NO_PROGRESS = 0;
const FULL_PROGRESS = 1;

export interface ScrollMetrics {
  /** Pixels scrolled from the top — what the marquee translates by. */
  readonly offset: number;
  /** How far through the document, 0 to 1 — what the progress bar scales by. */
  readonly progress: number;
}

const INITIAL_METRICS: ScrollMetrics = {
  offset: NO_PROGRESS,
  progress: NO_PROGRESS,
};

/**
 * One `scroll` listener for the whole page, however many components care.
 *
 * The prototype does all of its scroll work in a single `onScroll` function,
 * which keeps it to one listener but couples every section to one file. This
 * keeps the single listener and drops the coupling: components subscribe, and
 * the listener exists only while at least one of them is mounted.
 *
 * Roadmap 3.9 asks for exactly this consolidation.
 */
let metrics: ScrollMetrics = INITIAL_METRICS;
let listeners: (() => void)[] = [];
let frame: number | null = null;

function readMetrics(): ScrollMetrics {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;

  if (scrollable <= NO_PROGRESS) {
    return { offset: window.scrollY, progress: NO_PROGRESS };
  }

  return {
    offset: window.scrollY,
    progress: Math.min(FULL_PROGRESS, window.scrollY / scrollable),
  };
}

function publish(): void {
  frame = null;
  metrics = readMetrics();

  for (const listener of listeners) {
    listener();
  }
}

/** Coalesces a burst of scroll events into one read per frame. */
function handleScroll(): void {
  if (frame !== null) {
    return;
  }

  frame = requestAnimationFrame(publish);
}

export function subscribeToScroll(listener: () => void): () => void {
  if (listeners.length === 0) {
    window.addEventListener(SCROLL_EVENT, handleScroll, { passive: true });
  }

  listeners = [...listeners, listener];

  return () => {
    listeners = listeners.filter((registered) => registered !== listener);

    if (listeners.length === 0) {
      window.removeEventListener(SCROLL_EVENT, handleScroll);

      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
    }
  };
}

export function getScrollMetrics(): ScrollMetrics {
  return metrics;
}

/** The server has no scroll position; both values start at rest. */
export function getServerScrollMetrics(): ScrollMetrics {
  return INITIAL_METRICS;
}
