import type { DeveloperStats, DeveloperStatsProvider } from '@portfolio/core';
import { DeveloperStatsUnavailableError } from '@portfolio/core';
import { describe, expect, it } from 'vitest';

import { CUPS_OF_COFFEE_PER_DAY, FALLBACK_FIGURES, STAT_IDS } from '../../content/site';
import { resolveStatFigures } from './figures';

const NOW = new Date('2026-08-15T12:00:00');
const LIVE: DeveloperStats = { publicCommits: 1847, pullRequests: 73 };

function providerReturning(stats: DeveloperStats): DeveloperStatsProvider {
  return { fetchStats: () => Promise.resolve(stats) };
}

const unreachable: DeveloperStatsProvider = {
  fetchStats: () => Promise.reject(new DeveloperStatsUnavailableError('offline')),
};

describe('resolveStatFigures', () => {
  it('carries a figure for every stat the band lays out', async () => {
    const { figures } = await resolveStatFigures(NOW, providerReturning(LIVE));

    for (const id of STAT_IDS) {
      expect(figures[id]).toBeGreaterThan(0);
    }
  });

  it('shows the live counts when GitHub answers (FR-21)', async () => {
    const { figures, isIllustrative } = await resolveStatFigures(NOW, providerReturning(LIVE));

    expect(figures.commits).toBe(LIVE.publicCommits);
    expect(figures.pullRequests).toBe(LIVE.pullRequests);
    expect(isIllustrative).toBe(false);
  });

  it('falls back to the prototype figures when GitHub cannot be reached (FR-22)', async () => {
    const { figures, isIllustrative } = await resolveStatFigures(NOW, unreachable);

    expect(figures.commits).toBe(FALLBACK_FIGURES.commits);
    expect(figures.pullRequests).toBe(FALLBACK_FIGURES.pullRequests);
    expect(isIllustrative).toBe(true);
  });

  it('does the same with no provider configured at all', async () => {
    const { figures, isIllustrative } = await resolveStatFigures(NOW, null);

    expect(figures.commits).toBe(FALLBACK_FIGURES.commits);
    expect(isIllustrative).toBe(true);
  });

  it('counts the coffee as two cups per day of the year, not as a constant', async () => {
    const newYearsDay = await resolveStatFigures(new Date('2026-01-01T09:00:00'), null);
    const august = await resolveStatFigures(NOW, null);

    expect(newYearsDay.figures.coffee).toBe(CUPS_OF_COFFEE_PER_DAY);
    expect(august.figures.coffee).toBe(227 * CUPS_OF_COFFEE_PER_DAY);
  });

  it('counts the years from the start month rather than storing them', async () => {
    const early = await resolveStatFigures(new Date('2024-03-01T00:00:00'), null);

    expect(early.figures.years).toBe(2);
    expect((await resolveStatFigures(NOW, null)).figures.years).toBe(4);
  });
});
