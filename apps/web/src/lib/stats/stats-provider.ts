import type { DeveloperStatsProvider } from '@portfolio/core';
import { GITHUB_LOGIN, GITHUB_TOKEN, GitHubDeveloperStatsProvider } from '@portfolio/infra';

import { STATS_REVALIDATE_SECONDS } from '../../content/site';

/**
 * Builds the stats adapter from the environment, or returns `null`.
 *
 * This is the composition root's job and nowhere else's: it is the only place
 * that knows both that the port exists and that GitHub is what implements it
 * today.
 *
 * The login is what decides. The token is optional: both queries answer
 * unauthenticated, and the token only raises the rate limit — so a clone
 * without secrets still shows real figures, and a build with a token shows the
 * same ones with more headroom.
 *
 * **`null` is not a failure.** With no login configured there is nobody to
 * count, and the use case treats a missing provider as "show the illustrative
 * figures and say so" (FR-22). Throwing here would mean an unset variable
 * could break a build that has a perfectly good page to render.
 *
 * Server-only by construction: neither variable carries a `NEXT_PUBLIC_`
 * prefix, so neither is inlined into the browser bundle, and this module is
 * imported only from Server Components (NFR-03).
 */
/** The shape read, not `NodeJS.ProcessEnv`: a test supplies two keys, not an environment. */
export type EnvironmentLike = Readonly<Record<string, string | undefined>>;

export function createDeveloperStatsProvider(
  env: EnvironmentLike = process.env,
): DeveloperStatsProvider | null {
  const login = env[GITHUB_LOGIN]?.trim();
  const token = env[GITHUB_TOKEN]?.trim();

  if (login === undefined || login === '') {
    return null;
  }

  return new GitHubDeveloperStatsProvider({
    login,
    revalidateSeconds: STATS_REVALIDATE_SECONDS,
    ...(token === undefined || token === '' ? {} : { token }),
  });
}
