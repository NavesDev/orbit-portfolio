import { describe, expect, it } from 'vitest';

import { isTimelineKind, TIMELINE_KINDS } from './timeline-kind.ts';

describe('TIMELINE_KINDS', () => {
  it('lists the three kinds the timeline_kind enum declares', () => {
    expect(TIMELINE_KINDS).toEqual(['professional', 'academic', 'certification']);
  });
});

describe('isTimelineKind', () => {
  it.each(TIMELINE_KINDS)('accepts %s', (kind) => {
    expect(isTimelineKind(kind)).toBe(true);
  });

  it.each([['freelance'], [''], ['Professional'], [null], [undefined], [3]])(
    'rejects %s, which no migration ever added to the enum',
    (value) => {
      expect(isTimelineKind(value)).toBe(false);
    },
  );
});
