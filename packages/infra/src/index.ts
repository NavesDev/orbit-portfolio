/**
 * Public surface of `@portfolio/infra`.
 *
 * The `providers/` and `config/` half of the Infrastructure layer described in
 * `docs/architecture/clean-architecture.md` — adapters that implement ports
 * declared by `@portfolio/core` and speak to something outside the process
 * that is *not* the portfolio's own database. Persistence has its own package,
 * `@portfolio/db`, and the two never import each other.
 *
 * One folder per external system under `providers/`, so the fourth service
 * this site talks to is another folder rather than another workspace package.
 */
export {
  GITHUB_API_BASE_URL,
  GitHubDeveloperStatsProvider,
  type FetchLike,
  type GitHubStatsConfig,
} from './providers/github/github-developer-stats-provider.ts';
export { GITHUB_LOGIN, GITHUB_TOKEN } from './constants/env-keys.ts';
