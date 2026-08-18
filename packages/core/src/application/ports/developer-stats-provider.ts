/**
 * What a stats source can tell the application about the author's public work.
 *
 * Two counts and nothing else. The port names facts, not a GitHub response:
 * an adapter reading a different forge, or a cached snapshot in a table, would
 * satisfy the same interface without the application noticing.
 */
export interface DeveloperStats {
  /** Public commits attributed to the author, all-time. */
  readonly publicCommits: number;
  /** Pull requests the author has opened, all-time. */
  readonly pullRequests: number;
}

/**
 * The port behind FR-21's live figures.
 *
 * Declared here, in the application layer, and implemented by infrastructure —
 * `@portfolio/infra` provides the adapter and the composition root wires it.
 *
 * `fetchStats` throws `DeveloperStatsUnavailableError` and nothing else. It
 * never returns partial counts or a sentinel: a figure the page cannot vouch
 * for must not reach the page wearing the same type as one it can.
 */
export interface DeveloperStatsProvider {
  fetchStats(): Promise<DeveloperStats>;
}
