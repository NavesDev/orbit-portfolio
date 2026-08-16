import { DeveloperStatsUnavailableError } from '../../errors/developer-stats-unavailable-error.ts';
import type { DeveloperStats, DeveloperStatsProvider } from '../developer-stats-provider.ts';

/**
 * In-memory `DeveloperStatsProvider` for use-case tests.
 *
 * It is three lines long, which is the point: a fake that needs a fixture or a
 * transport to write would mean the port had leaked a delivery concern.
 */
export class FakeDeveloperStatsProvider implements DeveloperStatsProvider {
  constructor(private readonly result: DeveloperStats | Error) {}

  static unavailable(): FakeDeveloperStatsProvider {
    return new FakeDeveloperStatsProvider(
      new DeveloperStatsUnavailableError('The fake was asked to be unavailable.'),
    );
  }

  fetchStats(): Promise<DeveloperStats> {
    if (this.result instanceof Error) {
      return Promise.reject(this.result);
    }

    return Promise.resolve(this.result);
  }
}
