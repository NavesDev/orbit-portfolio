/**
 * What a timeline entry is (data-model.md § Enums).
 *
 * The same three values as the `timeline_kind` native enum, in one list, for
 * the reason `LOCALES` is one list: the wording of "ongoing", the icon and the
 * chip label are all keyed by kind in `apps/web`, and a `Record<TimelineKind,
 * string>` built from this type makes a missing case a compile error instead of
 * a blank chip.
 *
 * A new kind is a migration plus an edit here — never free text, and never a
 * string literal typed at a call site.
 */
export const TIMELINE_KINDS = ['professional', 'academic', 'certification'] as const;

export type TimelineKind = (typeof TIMELINE_KINDS)[number];

/**
 * The guard the mapper uses instead of a cast.
 *
 * A `kind` column is constrained by the database, so a value outside this list
 * means the enum and this file have drifted apart — which is worth an error at
 * the boundary rather than a chip rendering `undefined` three layers later.
 */
export function isTimelineKind(value: unknown): value is TimelineKind {
  return typeof value === 'string' && (TIMELINE_KINDS as readonly string[]).includes(value);
}
