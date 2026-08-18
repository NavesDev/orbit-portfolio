import { DeveloperStatsUnavailableError } from '@portfolio/core';
import { describe, expect, it, vi } from 'vitest';

import type { FetchLike } from './github-developer-stats-provider.ts';
import { GitHubDeveloperStatsProvider } from './github-developer-stats-provider.ts';

const CONFIG = { login: 'NavesDev', token: 'a-token-that-must-never-be-logged' } as const;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

/** Answers each request by the path it asks for, so order cannot flip the counts. */
function stubFetch(byPath: Readonly<Record<string, Response | Error>>): FetchLike {
  return vi.fn((url: string) => {
    const path = new URL(url).pathname;
    const answer = byPath[path];

    if (answer === undefined) {
      throw new Error(`the test stub was not asked about ${path}`);
    }

    return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer.clone());
  });
}

const COMMITS = '/search/commits';
const PULLS = '/search/issues';

describe('GitHubDeveloperStatsProvider', () => {
  it('reads both counts from the search API (FR-21)', async () => {
    const provider = new GitHubDeveloperStatsProvider(
      CONFIG,
      stubFetch({
        [COMMITS]: jsonResponse({ total_count: 1847 }),
        [PULLS]: jsonResponse({ total_count: 73 }),
      }),
    );

    await expect(provider.fetchStats()).resolves.toEqual({
      publicCommits: 1847,
      pullRequests: 73,
    });
  });

  it('scopes each query to the configured account', async () => {
    const fetchImpl = stubFetch({
      [COMMITS]: jsonResponse({ total_count: 1 }),
      [PULLS]: jsonResponse({ total_count: 1 }),
    });

    await new GitHubDeveloperStatsProvider(CONFIG, fetchImpl).fetchStats();

    const urls = vi.mocked(fetchImpl).mock.calls.map(([url]) => url);

    expect(urls.some((url) => url.includes(`q=author%3A${CONFIG.login}&`))).toBe(true);
    expect(urls.some((url) => url.includes('type%3Apr'))).toBe(true);
  });

  it('authenticates with the token and pins the API version', async () => {
    const fetchImpl = stubFetch({
      [COMMITS]: jsonResponse({ total_count: 1 }),
      [PULLS]: jsonResponse({ total_count: 1 }),
    });

    await new GitHubDeveloperStatsProvider(CONFIG, fetchImpl).fetchStats();

    const [, init] = vi.mocked(fetchImpl).mock.calls[0] ?? [];
    const headers = init?.headers as Record<string, string>;

    expect(headers.Authorization).toBe(`Bearer ${CONFIG.token}`);
    expect(headers['X-GitHub-Api-Version']).toBe('2022-11-28');
  });

  it('sends no Authorization when no token is configured', async () => {
    const fetchImpl = stubFetch({
      [COMMITS]: jsonResponse({ total_count: 1 }),
      [PULLS]: jsonResponse({ total_count: 1 }),
    });

    await new GitHubDeveloperStatsProvider({ login: CONFIG.login }, fetchImpl).fetchStats();

    const [, init] = vi.mocked(fetchImpl).mock.calls[0] ?? [];

    expect((init?.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('translates a refused request into the port’s failure, without the token', async () => {
    const provider = new GitHubDeveloperStatsProvider(
      CONFIG,
      stubFetch({
        [COMMITS]: jsonResponse({ message: 'Bad credentials' }, 401),
        [PULLS]: jsonResponse({ total_count: 73 }),
      }),
    );

    const failure = await provider.fetchStats().catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(DeveloperStatsUnavailableError);
    expect(String(failure)).not.toContain(CONFIG.token);
  });

  it('translates an unreachable host into the same failure, keeping the cause', async () => {
    const network = new TypeError('fetch failed');
    const provider = new GitHubDeveloperStatsProvider(
      CONFIG,
      stubFetch({ [COMMITS]: network, [PULLS]: jsonResponse({ total_count: 1 }) }),
    );

    const failure = await provider.fetchStats().catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(DeveloperStatsUnavailableError);
    expect((failure as DeveloperStatsUnavailableError).cause).toBe(network);
  });

  it('refuses a body without a count rather than reading a zero out of it', async () => {
    const provider = new GitHubDeveloperStatsProvider(
      CONFIG,
      stubFetch({
        [COMMITS]: jsonResponse({ items: [] }),
        [PULLS]: jsonResponse({ total_count: 73 }),
      }),
    );

    await expect(provider.fetchStats()).rejects.toBeInstanceOf(DeveloperStatsUnavailableError);
  });

  it('passes a revalidate window through to the caller’s fetch when asked', async () => {
    const fetchImpl = stubFetch({
      [COMMITS]: jsonResponse({ total_count: 1 }),
      [PULLS]: jsonResponse({ total_count: 1 }),
    });

    await new GitHubDeveloperStatsProvider(
      { ...CONFIG, revalidateSeconds: 3600 },
      fetchImpl,
    ).fetchStats();

    const [, init] = vi.mocked(fetchImpl).mock.calls[0] ?? [];

    expect((init as { next?: { revalidate: number } }).next).toEqual({ revalidate: 3600 });
  });
});
