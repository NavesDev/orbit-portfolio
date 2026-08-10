/**
 * Shared literals for `@portfolio/db`, kept out of the files that use them.
 *
 * These are the *names* of the environment variables the package reads — not
 * their values, and nothing here touches `process.env`. `requireConnectionString`
 * still does the actual reading; it just takes one of these instead of every
 * call site retyping the string. A typo in one of five call sites would have
 * `requireConnectionString` read `process.env[undefined]` silently instead of
 * failing loudly, which is the failure this removes.
 */
export const DATABASE_URL = 'DATABASE_URL';
export const TEST_DATABASE_URL = 'TEST_DATABASE_URL';
