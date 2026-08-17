import type { DeveloperStats, DeveloperStatsProvider } from '@portfolio/core';
import { DeveloperStatsUnavailableError } from '@portfolio/core';

import {
  ACCEPT,
  API_VERSION,
  COMMIT_SEARCH_PATH,
  DEFAULT_TIMEOUT_MS,
  GITHUB_API_BASE_URL,
  ISSUE_SEARCH_PATH,
  SMALLEST_PAGE,
  USER_AGENT,
} from '../../constants/github-api.ts';

export interface GitHubStatsConfig {
  /** The account the figures are counted for. */
  readonly login: string;
  /**
   * A personal access token. Server-side only, and never logged.
   *
   * Optional, because both queries answer unauthenticated: a token raises the
   * search rate limit from 10 requests a minute to 30, and nothing else. A
   * required token would mean a clone without secrets shows placeholder
   * figures while the real ones are one anonymous request away.
   */
  readonly token?: string;
  readonly apiBaseUrl?: string;
  readonly timeoutMs?: number;
  /**
   * Seconds Next.js may serve a cached response for. Passed straight through
   * to `fetch`; a plain `fetch` ignores it, which is what makes this adapter
   * usable outside Next as well.
   */
  readonly revalidateSeconds?: number;
}

/** `fetch`, narrowed to what this adapter uses, so a test can pass a stub. */
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

interface SearchCountResponse {
  readonly total_count: number;
}

function isSearchCountResponse(body: unknown): body is SearchCountResponse {
  return (
    typeof body === 'object' &&
    body !== null &&
    'total_count' in body &&
    typeof (body as SearchCountResponse).total_count === 'number'
  );
}

/**
 * Reads the author's public counts from GitHub's search API (FR-21).
 *
 * Infrastructure: it implements a port declared by `@portfolio/core` and knows
 * about HTTP, query syntax and status codes so that nothing above it has to.
 * A `providers/` adapter in the sense of `clean-architecture.md`, sibling to
 * `SystemClock` rather than to a repository.
 * Every failure leaves here as `DeveloperStatsUnavailableError`, which is the
 * whole of the port's contract.
 *
 * The search API is used rather than the GraphQL contributions API because
 * that one answers a year at a time — an all-time total would be one request
 * per year the account has existed, and the count would still exclude
 * contributions outside the window.
 *
 * The token never appears in a message, a log or an error: this class is the
 * only code that holds it, and it only ever puts it in a header.
 */
export class GitHubDeveloperStatsProvider implements DeveloperStatsProvider {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly config: GitHubStatsConfig,
    private readonly fetchImpl: FetchLike = fetch,
  ) {
    this.baseUrl = config.apiBaseUrl ?? GITHUB_API_BASE_URL;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async fetchStats(): Promise<DeveloperStats> {
    const [publicCommits, pullRequests] = await Promise.all([
      this.count(COMMIT_SEARCH_PATH, `author:${this.config.login}`),
      this.count(ISSUE_SEARCH_PATH, `author:${this.config.login} type:pr`),
    ]);

    return { publicCommits, pullRequests };
  }

  private async count(path: string, query: string): Promise<number> {
    const url = new URL(path, this.baseUrl);

    url.searchParams.set('q', query);
    url.searchParams.set('per_page', SMALLEST_PAGE);

    const response = await this.request(url.toString());

    if (!response.ok) {
      throw new DeveloperStatsUnavailableError(
        `GitHub answered ${String(response.status)} for ${path}.`,
      );
    }

    const body: unknown = await response.json().catch((cause: unknown) => {
      throw new DeveloperStatsUnavailableError(`GitHub sent an unreadable body for ${path}.`, {
        cause,
      });
    });

    if (!isSearchCountResponse(body)) {
      throw new DeveloperStatsUnavailableError(`GitHub sent no total_count for ${path}.`);
    }

    return body.total_count;
  }

  private async request(url: string): Promise<Response> {
    try {
      return await this.fetchImpl(url, {
        signal: AbortSignal.timeout(this.timeoutMs),
        headers: {
          Accept: ACCEPT,
          'User-Agent': USER_AGENT,
          'X-GitHub-Api-Version': API_VERSION,
          ...(this.config.token === undefined
            ? {}
            : { Authorization: `Bearer ${this.config.token}` }),
        },
        ...(this.config.revalidateSeconds === undefined
          ? {}
          : { next: { revalidate: this.config.revalidateSeconds } }),
      } as RequestInit);
    } catch (cause) {
      /*
       * A timeout, a DNS failure or an offline build machine. None of them is
       * a bug in this code and none of them should reach presentation as an
       * `AbortError`.
       */
      throw new DeveloperStatsUnavailableError('GitHub could not be reached.', { cause });
    }
  }
}
