import { ORGANIZATION_MAX_LENGTH } from '../constants/text-budgets.ts';
import type { TimelineKind } from '../enums/timeline-kind.ts';
import {
  InvalidTimelineEntryError,
  TIMELINE_ENTRY_VIOLATIONS,
} from '../errors/invalid-timeline-entry-error.ts';
import type { DateRange } from '../value-objects/date-range.ts';
import type { LocalizedText } from '../value-objects/localized-text.ts';
import type { Url } from '../value-objects/url.ts';
import { Entity, type EntityProperties } from './entity.ts';

export interface TimelineEntryProperties extends EntityProperties {
  readonly kind: TimelineKind;
  readonly title: LocalizedText;
  /** Employer, institution or issuer. A proper noun, so a plain string. */
  readonly organization: string;
  readonly description: LocalizedText | null;
  /** Verification link. Only ever meaningful when `kind` is `certification`. */
  readonly credentialUrl: Url | null;
  readonly period: DateRange;
  readonly isFeatured: boolean;
  readonly isPublished: boolean;
  readonly sortOrder: number;
}

/**
 * One step of the trajectory — a role, a degree or a certification (FR-11–FR-15).
 *
 * A single entity with a `kind`, mirroring the single table, exactly as
 * `clean-architecture.md` § 4 argues: per-kind invariants would turn it into an
 * abstract root with three subtypes, and none exist yet.
 *
 * `organization` stays a `string` and does not become a value object. It is a
 * proper noun with a length budget and no other rule — nothing resolves it, no
 * locale reaches it, nothing parses it — so a wrapper class would add a type
 * without adding an invariant a second reader could name. The budget is checked
 * here, where every other field of this entity is checked.
 *
 * Skills are referenced through `TimelineRepository.listSkillNames`, never
 * nested here: `timeline_entry_skill` is persisted by this aggregate root and
 * read as a projection, the same separation `Project` keeps from
 * `project_skill`.
 */
export class TimelineEntry extends Entity<TimelineEntryProperties> {
  private constructor(properties: TimelineEntryProperties) {
    super(properties);
  }

  static create(properties: TimelineEntryProperties): TimelineEntry {
    const organization = properties.organization;

    if (typeof organization !== 'string' || organization.trim().length === 0) {
      throw new InvalidTimelineEntryError(
        TIMELINE_ENTRY_VIOLATIONS.MISSING_ORGANIZATION,
        'A timeline entry needs an organization — it is half of what identifies it.',
      );
    }

    if (organization.length > ORGANIZATION_MAX_LENGTH) {
      throw new InvalidTimelineEntryError(
        TIMELINE_ENTRY_VIOLATIONS.ORGANIZATION_OVER_BUDGET,
        `An organization may not exceed ${ORGANIZATION_MAX_LENGTH} characters.`,
      );
    }

    if (!Number.isInteger(properties.sortOrder)) {
      throw new InvalidTimelineEntryError(
        TIMELINE_ENTRY_VIOLATIONS.SORT_ORDER_NOT_AN_INTEGER,
        'A sort order must be an integer.',
      );
    }

    return new TimelineEntry(properties);
  }

  get kind(): TimelineKind {
    return this.properties.kind;
  }

  get title(): LocalizedText {
    return this.properties.title;
  }

  get organization(): string {
    return this.properties.organization;
  }

  get description(): LocalizedText | null {
    return this.properties.description;
  }

  get credentialUrl(): Url | null {
    return this.properties.credentialUrl;
  }

  get period(): DateRange {
    return this.properties.period;
  }

  get isFeatured(): boolean {
    return this.properties.isFeatured;
  }

  get isPublished(): boolean {
    return this.properties.isPublished;
  }

  get sortOrder(): number {
    return this.properties.sortOrder;
  }

  /**
   * FR-13's condition, and the whole of it.
   *
   * An open period means ongoing — a role still held, a degree still being
   * read, a certification that never expires. It is a null test and not a
   * comparison against the current date, which is why this slice needs no
   * `Clock`: the fact lives in the row, not in the calendar.
   *
   * It is a getter here rather than an `endedOn === null` written in a
   * component so that presentation asks the domain the question instead of
   * re-deriving the answer. How the three kinds *word* being ongoing is
   * presentation's business; whether an entry is ongoing is this entity's.
   */
  get isOngoing(): boolean {
    return this.properties.period.endedOn === null;
  }
}
