/**
 * What GitHub's REST API is addressed with.
 *
 * Pinned deliberately: an unpinned API version changes response shapes without
 * a deploy, and a `User-Agent` is not optional — GitHub rejects requests
 * without one and asks that it identify the caller.
 */
export const GITHUB_API_BASE_URL = 'https://api.github.com';

export const API_VERSION = '2022-11-28';
export const ACCEPT = 'application/vnd.github+json';
export const USER_AGENT = 'portfolio-stat-band';

export const COMMIT_SEARCH_PATH = '/search/commits';
export const ISSUE_SEARCH_PATH = '/search/issues';

/**
 * Only the count is wanted, never the results — one item is the smallest page
 * the API will return, and `total_count` is the same either way.
 */
export const SMALLEST_PAGE = '1';

/** A build must not hang on a slow forge. */
export const DEFAULT_TIMEOUT_MS = 8000;
