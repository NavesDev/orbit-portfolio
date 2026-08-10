import { defineConfig } from 'vitest/config';

/**
 * Unit: the parts of this package that need no database — the deterministic id
 * derivation and the seed content's own budgets. They belong in the fast suite
 * (`pnpm test`), not behind Docker.
 */
export default defineConfig({
  test: {
    name: 'db-unit',
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
