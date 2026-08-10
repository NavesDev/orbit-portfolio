import { defineConfig } from 'vitest/config';

/**
 * Integration: everything that only fails against a real PostgreSQL. Needs
 * Docker up and TEST_DATABASE_URL set. Run by `pnpm test:integration`.
 *
 * The unit level lives in `vitest.unit.config.ts` and needs neither.
 */
export default defineConfig({
  test: {
    name: 'db',
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    // Integration tests share one server; parallel files would race on schema.
    fileParallelism: false,
  },
});
