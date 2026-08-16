import { DeveloperStatsUnavailableError } from '../../errors/developer-stats-unavailable-error.ts';
import type { DeveloperStats, DeveloperStatsProvider } from '../../ports/developer-stats-provider.ts';

/** What the caller offers to show when no real figures can be had. */
export interface GetDeveloperStatsInput {
  readonly fallback: DeveloperStats;
}

export interface GetDeveloperStatsOutput {
  readonly stats: DeveloperStats;
  /**
   * Whether what came back is placeholder. FR-22 requires the page to say so
   * whenever it is, so this travels with the figures rather than being
   * inferred from them — equal numbers prove nothing either way.
   */
  readonly isIllustrative: boolean;
}

const MINIMUM_COUNT = 0;

function isCount(value: number): boolean {
  return Number.isInteger(value) && value >= MINIMUM_COUNT;
}

/**
 * Resolves the figures the stat band shows (FR-21, FR-22).
 *
 * **The fallback is a policy, not error handling.** Deciding that an
 * unreachable source means "show the placeholder figures and admit it" is a
 * use-case decision, so it lives here instead of in a `try` around a fetch in
 * a component. Presentation asks once and renders what it gets.
 *
 * A provider of `null` is the unconfigured case — no token, no source — and it
 * is not an error: a checkout without credentials must still build a page.
 */
export class GetDeveloperStats {
  constructor(private readonly provider: DeveloperStatsProvider | null) {}

  async execute(input: GetDeveloperStatsInput): Promise<GetDeveloperStatsOutput> {
    if (this.provider === null) {
      return { stats: input.fallback, isIllustrative: true };
    }

    try {
      const stats = await this.provider.fetchStats();

      if (!isCount(stats.publicCommits) || !isCount(stats.pullRequests)) {
        throw new DeveloperStatsUnavailableError(
          'The stats provider returned something that is not a count.',
        );
      }

      return { stats, isIllustrative: false };
    } catch (error) {
      /*
       * Only the port's declared failure is absorbed. Anything else is a
       * programming error in the adapter, and swallowing it would turn a bug
       * into a page that quietly shows made-up numbers forever.
       */
      if (error instanceof DeveloperStatsUnavailableError) {
        return { stats: input.fallback, isIllustrative: true };
      }

      throw error;
    }
  }
}
