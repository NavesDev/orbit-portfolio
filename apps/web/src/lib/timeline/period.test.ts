import type { TimelineKind } from '@portfolio/core';
import { describe, expect, it } from 'vitest';

import { formatPeriod } from './period';

const PT_BR_ONGOING: Readonly<Record<TimelineKind, string>> = {
  professional: 'atual',
  academic: 'atual',
  certification: 'não expira',
};

const EN_US_ONGOING: Readonly<Record<TimelineKind, string>> = {
  professional: 'present',
  academic: 'present',
  certification: 'no expiry',
};

function period(
  startedOn: string | null,
  endedOn: string | null,
  kind: TimelineKind = 'professional',
) {
  return { startedOn, endedOn, isOngoing: endedOn === null, kind };
}

describe('formatPeriod', () => {
  it('renders a closed period as its two years', () => {
    expect(formatPeriod(period('2022-02-01', '2024-12-31'), PT_BR_ONGOING)).toBe('2022 — 2024');
  });

  it('collapses a period that starts and ends in one year to that year', () => {
    expect(formatPeriod(period('2025-01-10', '2025-11-30'), PT_BR_ONGOING)).toBe('2025');
  });

  describe('an entry whose period has no end (FR-13)', () => {
    it('reads "atual" for an ongoing role, in pt-BR', () => {
      expect(formatPeriod(period('2025-12-01', null, 'professional'), PT_BR_ONGOING)).toBe(
        '2025 — atual',
      );
    });

    it('reads "atual" for an ongoing degree, in pt-BR', () => {
      expect(formatPeriod(period('2025-02-01', null, 'academic'), PT_BR_ONGOING)).toBe(
        '2025 — atual',
      );
    });

    it('reads "não expira" for a certification, in pt-BR', () => {
      expect(formatPeriod(period('2026-07-25', null, 'certification'), PT_BR_ONGOING)).toBe(
        '2026 — não expira',
      );
    });

    it('reads "present" for an ongoing role, in en-US', () => {
      expect(formatPeriod(period('2025-12-01', null, 'professional'), EN_US_ONGOING)).toBe(
        '2025 — present',
      );
    });

    it('reads "no expiry" for a certification, in en-US', () => {
      expect(formatPeriod(period('2026-07-25', null, 'certification'), EN_US_ONGOING)).toBe(
        '2026 — no expiry',
      );
    });
  });

  it('falls back to the ongoing word alone when there is no start date to show', () => {
    expect(formatPeriod(period(null, null, 'certification'), PT_BR_ONGOING)).toBe('não expira');
  });
});
