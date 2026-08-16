/**
 * The *names* of the environment variables this package's configuration is
 * built from. Nothing here reads `process.env`: the composition root does that
 * and passes values in, which is what keeps the adapter testable without
 * mutating the environment.
 *
 * `GITHUB_TOKEN` is a server-only secret. It carries no `NEXT_PUBLIC_` prefix
 * for exactly that reason, and nothing in this package logs it or puts it in
 * an error message.
 */
export const GITHUB_TOKEN = 'GITHUB_TOKEN';
export const GITHUB_LOGIN = 'GITHUB_LOGIN';
