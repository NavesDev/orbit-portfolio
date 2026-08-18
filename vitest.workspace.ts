export default [
  'packages/core',
  // Two projects: `db-unit` needs nothing, `db` needs a real PostgreSQL.
  'packages/db/vitest.unit.config.ts',
  'packages/db/vitest.config.ts',
  'packages/infra',
  'apps/web',
];
