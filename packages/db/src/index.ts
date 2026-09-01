/**
 * Public surface of `@portfolio/db`.
 *
 * `package.json` points `main` and `types` here. Only the composition root in
 * `apps/web/src/lib/` imports it — never a Client Component, which would drag
 * the driver and the connection string into the browser bundle.
 *
 * Repository implementations are re-exported here as they land; mappers, SQL
 * and the seed stay internal.
 */

export { BaseRepository, type Queryable } from './repositories/base.repository.ts';
export { PostgresSocialLinkRepository } from './repositories/postgres-social-link.repository.ts';
export { PostgresProjectRepository } from './repositories/postgres-project.repository.ts';
export { PostgresTimelineRepository } from './repositories/postgres-timeline.repository.ts';
export { getPool, closePool } from './client.ts';
