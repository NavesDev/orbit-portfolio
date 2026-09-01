import { describe, expect, it } from 'vitest';

import { ORGANIZATION_MAX_LENGTH, TITLE_MAX_LENGTH } from '../constants/text-budgets.ts';
import {
  InvalidTimelineEntryError,
  TIMELINE_ENTRY_VIOLATIONS,
} from '../errors/invalid-timeline-entry-error.ts';
import { DateRange } from '../value-objects/date-range.ts';
import { LocalizedText } from '../value-objects/localized-text.ts';
import { Url } from '../value-objects/url.ts';
import { TimelineEntry, type TimelineEntryProperties } from './timeline-entry.ts';

function properties(overrides: Partial<TimelineEntryProperties> = {}): TimelineEntryProperties {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    kind: 'professional',
    title: LocalizedText.create({ 'en-US': 'Software Development Intern' }, TITLE_MAX_LENGTH),
    organization: 'Sea Tecnologia',
    description: null,
    credentialUrl: null,
    period: DateRange.create({ startedOn: '2025-12-01', endedOn: null }),
    isFeatured: true,
    isPublished: true,
    sortOrder: 0,
    ...overrides,
  };
}

function entry(overrides: Partial<TimelineEntryProperties> = {}): TimelineEntry {
  return TimelineEntry.create(properties(overrides));
}

/**
 * The violation an invalid entry produces, mirroring `social-link.test.ts` —
 * asserting on the class alone would let a rule reject for the wrong reason
 * and still pass.
 */
function violationOf(overrides: Partial<TimelineEntryProperties>): string {
  try {
    TimelineEntry.create(properties(overrides));
  } catch (error) {
    if (error instanceof InvalidTimelineEntryError) {
      return error.violation;
    }

    throw error;
  }

  throw new Error('Expected the entry to be rejected, and it was not.');
}

describe('TimelineEntry', () => {
  it('exposes every fact the timeline renders', () => {
    const created = entry({
      description: LocalizedText.create({ 'en-US': 'Portals.' }, 8000),
      credentialUrl: Url.create('https://example.com/credential'),
    });

    expect(created.kind).toBe('professional');
    expect(created.title.resolve('en-US')).toBe('Software Development Intern');
    expect(created.organization).toBe('Sea Tecnologia');
    expect(created.description?.resolve('en-US')).toBe('Portals.');
    expect(created.credentialUrl?.toString()).toBe('https://example.com/credential');
    expect(created.period.startedOn).toBe('2025-12-01');
    expect(created.isFeatured).toBe(true);
    expect(created.isPublished).toBe(true);
    expect(created.sortOrder).toBe(0);
  });

  describe('isOngoing', () => {
    it('is true while the period has no end, whatever the kind', () => {
      expect(entry({ kind: 'professional' }).isOngoing).toBe(true);
      expect(entry({ kind: 'certification' }).isOngoing).toBe(true);
    });

    it('is false once the period has closed', () => {
      const closed = entry({
        period: DateRange.create({ startedOn: '2025-06-01', endedOn: '2025-12-31' }),
      });

      expect(closed.isOngoing).toBe(false);
    });
  });

  it('rejects a blank organization', () => {
    expect(violationOf({ organization: '   ' })).toBe(
      TIMELINE_ENTRY_VIOLATIONS.MISSING_ORGANIZATION,
    );
  });

  it('rejects an organization past the column budget', () => {
    expect(violationOf({ organization: 'a'.repeat(ORGANIZATION_MAX_LENGTH + 1) })).toBe(
      TIMELINE_ENTRY_VIOLATIONS.ORGANIZATION_OVER_BUDGET,
    );
  });

  it('accepts an organization exactly at the budget', () => {
    expect(entry({ organization: 'a'.repeat(ORGANIZATION_MAX_LENGTH) }).organization).toHaveLength(
      ORGANIZATION_MAX_LENGTH,
    );
  });

  it('rejects a fractional sort order', () => {
    expect(violationOf({ sortOrder: 1.5 })).toBe(
      TIMELINE_ENTRY_VIOLATIONS.SORT_ORDER_NOT_AN_INTEGER,
    );
  });
});
