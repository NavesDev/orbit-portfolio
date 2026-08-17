import { DeveloperStatsUnavailableError } from '../../errors/developer-stats-unavailable-error.ts';
import type { DeveloperStats, DeveloperStatsProvider } from '../../ports/developer-stats-provider.ts';

export interface GetDeveloperStatsOutput {
  /**
   * The counts, or `null` when there are none to be had.
   *
   * `null` is the whole answer: no source configured, an unreachable one and a
   * source that answered with something that is not a count are the same fact
   * to a caller — this figure cannot be vouched for. What the page does about
   * it is presentation's business.
   */
  readonly stats: DeveloperStats | null;
}

const MINIMUM_COUNT = 0;

function isCount(value: number): boolean {
  return Number.isInteger(value) && value >= MINIMUM_COUNT;
}

/**
 * Resolves the counts the stat band shows (FR-21, FR-22).
 *
 * **It returns nothing rather than something plausible.** An earlier version
 * took a set of stand-in figures and handed those back when the source failed,
 * which meant the page's least reliable moment was also the one where it
 * claimed the most: the stand-ins were the prototype's numbers, and they ran
 * to roughly double the real ones. A figure that cannot be vouched for is
 * absent, and the band renders that absence.
 *
 * A provider of `null` is the unconfigured case — no account, no source — and
 * it is not an error: a checkout without configuration must still build.
 */
export class GetDeveloperStats {
  constructor(private readonly provider: DeveloperStatsProvider | null) {}

  async execute(): Promise<GetDeveloperStatsOutput> {
    if (this.provider === null) {
      return { stats: null };
    }

    try {
      const stats = await this.provider.fetchStats();

      if (!isCount(stats.publicCommits) || !isCount(stats.pullRequests)) {
        return { stats: null };
      }

      return { stats };
    } catch (error) {
      /*
       * Only the port's declared failure is absorbed. Anything else is a
       * programming error in the adapter, and swallowing it would hide a bug
       * behind a permanently empty band.
       */
      if (error instanceof DeveloperStatsUnavailableError) {
        return { stats: null };
      }

      throw error;
    }
  }
}
