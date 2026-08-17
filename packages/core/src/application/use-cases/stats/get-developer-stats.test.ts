import { describe, expect, it } from 'vitest';

import { DeveloperStatsUnavailableError } from '../../errors/developer-stats-unavailable-error.ts';
import { FakeDeveloperStatsProvider } from '../../ports/__fakes__/fake-developer-stats-provider.ts';
import type { DeveloperStats } from '../../ports/developer-stats-provider.ts';
import { GetDeveloperStats } from './get-developer-stats.ts';

const LIVE: DeveloperStats = { publicCommits: 1847, pullRequests: 73 };

describe('GetDeveloperStats', () => {
  it('returns the source figures (FR-21)', async () => {
    const useCase = new GetDeveloperStats(new FakeDeveloperStatsProvider(LIVE));

    await expect(useCase.execute()).resolves.toEqual({ stats: LIVE });
  });

  it('returns nothing when the source is unavailable, rather than a stand-in', async () => {
    const useCase = new GetDeveloperStats(FakeDeveloperStatsProvider.unavailable());

    await expect(useCase.execute()).resolves.toEqual({ stats: null });
  });

  it('treats an unconfigured source the same way, and not as a failure', async () => {
    await expect(new GetDeveloperStats(null).execute()).resolves.toEqual({ stats: null });
  });

  it('refuses figures that are not counts rather than passing them on', async () => {
    const useCase = new GetDeveloperStats(
      new FakeDeveloperStatsProvider({ publicCommits: -1, pullRequests: 4.5 }),
    );

    await expect(useCase.execute()).resolves.toEqual({ stats: null });
  });

  it('lets an unexpected adapter failure through, rather than hiding a bug', async () => {
    const bug = new TypeError('the adapter dereferenced undefined');
    const useCase = new GetDeveloperStats(new FakeDeveloperStatsProvider(bug));

    await expect(useCase.execute()).rejects.toBe(bug);
  });

  it('declares one failure mode, so callers never branch on transport errors', () => {
    const error = new DeveloperStatsUnavailableError('unreachable', { cause: new Error('socket') });

    expect(error.name).toBe('DeveloperStatsUnavailableError');
    expect(error.cause).toBeInstanceOf(Error);
  });
});
