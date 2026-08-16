import { describe, expect, it } from 'vitest';

import { DeveloperStatsUnavailableError } from '../../errors/developer-stats-unavailable-error.ts';
import { FakeDeveloperStatsProvider } from '../../ports/__fakes__/fake-developer-stats-provider.ts';
import type { DeveloperStats } from '../../ports/developer-stats-provider.ts';
import { GetDeveloperStats } from './get-developer-stats.ts';

const FALLBACK: DeveloperStats = { publicCommits: 1230, pullRequests: 50 };
const LIVE: DeveloperStats = { publicCommits: 1847, pullRequests: 73 };

describe('GetDeveloperStats', () => {
  it('returns the source figures, not marked illustrative (FR-21)', async () => {
    const useCase = new GetDeveloperStats(new FakeDeveloperStatsProvider(LIVE));

    await expect(useCase.execute({ fallback: FALLBACK })).resolves.toEqual({
      stats: LIVE,
      isIllustrative: false,
    });
  });

  it('falls back and says so when the source is unavailable (FR-22)', async () => {
    const useCase = new GetDeveloperStats(FakeDeveloperStatsProvider.unavailable());

    await expect(useCase.execute({ fallback: FALLBACK })).resolves.toEqual({
      stats: FALLBACK,
      isIllustrative: true,
    });
  });

  it('treats an unconfigured source as illustrative, not as a failure', async () => {
    const useCase = new GetDeveloperStats(null);

    await expect(useCase.execute({ fallback: FALLBACK })).resolves.toEqual({
      stats: FALLBACK,
      isIllustrative: true,
    });
  });

  it('refuses figures that are not counts, rather than rendering them', async () => {
    const useCase = new GetDeveloperStats(
      new FakeDeveloperStatsProvider({ publicCommits: -1, pullRequests: 4.5 }),
    );

    await expect(useCase.execute({ fallback: FALLBACK })).resolves.toEqual({
      stats: FALLBACK,
      isIllustrative: true,
    });
  });

  it('lets an unexpected adapter failure through, rather than hiding a bug', async () => {
    const bug = new TypeError('the adapter dereferenced undefined');
    const useCase = new GetDeveloperStats(new FakeDeveloperStatsProvider(bug));

    await expect(useCase.execute({ fallback: FALLBACK })).rejects.toBe(bug);
  });

  it('declares one failure mode, so callers never branch on transport errors', () => {
    const error = new DeveloperStatsUnavailableError('unreachable', { cause: new Error('socket') });

    expect(error.name).toBe('DeveloperStatsUnavailableError');
    expect(error.cause).toBeInstanceOf(Error);
  });
});
