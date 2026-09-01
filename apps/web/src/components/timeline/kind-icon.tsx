import type { TimelineKind } from '@portfolio/core';
import type { ReactElement } from 'react';

/**
 * The glyph beside a card's kind label.
 *
 * Keyed by `kind` and held here rather than in the database: an icon is a
 * visual decision about a category, the same way the skills orbit's colours
 * are (`clean-architecture.md` § 3 puts both in presentation). The
 * professional and academic marks are the prototype's own; the certification
 * one is new, since the prototype has no certification entry to draw for.
 *
 * A `Record<TimelineKind, …>` rather than a `switch`, so a fourth kind added
 * to the enum fails to compile instead of rendering nothing.
 */
const GLYPHS: Readonly<Record<TimelineKind, ReactElement>> = {
  professional: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  academic: (
    <>
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
    </>
  ),
  certification: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 14.5 7 22l5-3 5 3-1.5-7.5" />
    </>
  ),
};

export function KindIcon({
  kind,
  className,
}: {
  readonly kind: TimelineKind;
  readonly className?: string | undefined;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[kind]}
    </svg>
  );
}
