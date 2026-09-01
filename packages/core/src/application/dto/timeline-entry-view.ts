import type { TimelineKind } from '../../domain/enums/timeline-kind.ts';

/**
 * One timeline entry, ready to render (FR-12, NFR-13).
 *
 * Every field is a resolved `string` — no `LocalizedText`, no value object, no
 * `jsonb` — so a Client Component receives plain serializable data already in
 * one language.
 *
 * The period arrives as its two dates plus `isOngoing`, **not** as a formatted
 * string. Formatting it needs the words "atual" and "não expira", which are
 * copy, and copy lives in `apps/web/src/content/` where a missing translation
 * is a type error. Sending a formatted period from here would put two of the
 * site's phrases in the application layer and out of reach of that check.
 */
export interface TimelineEntryView {
  readonly id: string;
  readonly kind: TimelineKind;
  readonly title: string;
  readonly organization: string;
  readonly description: string | null;
  readonly credentialUrl: string | null;
  readonly startedOn: string | null;
  readonly endedOn: string | null;
  readonly isOngoing: boolean;
  readonly skills: readonly string[];
}
