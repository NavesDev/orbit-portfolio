/**
 * Header names and status codes the request layer uses, kept out of the files
 * that use them — the same reason `packages/db/src/constants/env-keys.ts`
 * exists. A typo in a header name fails silently; a typo in an import does not.
 */
export const ACCEPT_LANGUAGE_HEADER = 'accept-language';
export const CACHE_CONTROL_HEADER = 'cache-control';

/** NFR-12: a cached `/` redirect would send every later visitor to the first visitor's language. */
export const CACHE_CONTROL_NO_STORE = 'no-store';

/** Temporary on purpose — the destination depends on who is asking. */
export const LOCALE_REDIRECT_STATUS = 307;
