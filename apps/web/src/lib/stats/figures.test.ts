import type { DeveloperStats, DeveloperStatsProvider } from '@portfolio/core';
import { DeveloperStatsUnavailableError } from '@portfolio/core';
import { describe, expect, it } from 'vitest';

import { CUPS_OF_COFFEE_PER_DAY } from '../../content/site';
import { hasMissingFigure, resolveStatFigures } from './figures';

const NOW = new Date('2026-08-15T12:00:00');
const LIVE: DeveloperStats = { publicCommits: 1847, pullRequests: 73 };

function providerReturning(stats: DeveloperStats): DeveloperStatsProvider {
  return { fetchStats: () => Promise.resolve(stats) };
}

const unreachable: DeveloperStatsProvider = {
  fetchStats: () => Promise.reject(new DeveloperStatsUnavailableError('offline')),
};

describe('resolveStatFigures', () => {
  it('shows the live counts when GitHub answers (FR-21)', async () => {
    const figures = await resolveStatFigures(NOW, providerReturning(LIVE));

    expect(figures.commits).toBe(LIVE.publicCommits);
    expect(figures.pullRequests).toBe(LIVE.pullRequests);
    expect(hasMissingFigure(figures)).toBe(false);
  });

  it('leaves the sourced figures absent when GitHub cannot be reached', async () => {
    const figures = await resolveStatFigures(NOW, unreachable);

    expect(figures.commits).toBeNull();
    expect(figures.pullRequests).toBeNull();
    expect(hasMissingFigure(figures)).toBe(true);
  });

  it('does the same with no provider configured at all', async () => {
    expect((await resolveStatFigures(NOW, null)).commits).toBeNull();
  });

  it('never invents a stand-in — an absent figure is absent, not a number', async () => {
    const figures = await resolveStatFigures(NOW, unreachable);

    expect(Object.values(figures).filter((figure) => figure !== null)).toHaveLength(2);
  });

  it('still counts the calendar figures when the source is gone', async () => {
    const figures = await resolveStatFigures(NOW, unreachable);

    expect(figures.years).toBe(4);
    expect(figures.coffee).toBe(227 * CUPS_OF_COFFEE_PER_DAY);
  });

  it('counts the coffee as two cups per day of the year, not as a constant', async () => {
    const newYearsDay = await resolveStatFigures(new Date('2026-01-01T09:00:00'), null);

    expect(newYearsDay.coffee).toBe(CUPS_OF_COFFEE_PER_DAY);
  });
});

describe('hasMissingFigure', () => {
  it('is false when every figure is a number, zero included', () => {
    expect(hasMissingFigure({ commits: 0, pullRequests: 0, coffee: 2, years: 4 })).toBe(false);
  });
});
