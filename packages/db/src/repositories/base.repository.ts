import type { QueryResultRow } from 'pg';

/**
 * What a repository runs its SQL against.
 *
 * A `Pool` and a `PoolClient` both satisfy it, which is the point: a
 * repository written against this can be handed a pool in production and a
 * transaction's client in a test or in a multi-statement write, without
 * knowing which it got.
 *
 * One structural interface rather than the `Pool | PoolClient` union, for two
 * reasons. The union is not callable — `pg` types `query` as a set of
 * overloads, and TypeScript will not call across two members whose signatures
 * differ. And naming the one signature a repository actually uses is what
 * keeps the rest of `pg`'s surface, streaming and all, out of reach.
 */
export interface Queryable {
  query<Row extends QueryResultRow>(
    sql: string,
    parameters?: readonly unknown[],
  ): Promise<{ rows: Row[] }>;
}

/**
 * What every Postgres repository shares.
 *
 * Deliberately thin. It owns the connection and two ways of running a
 * statement, and nothing else — no query builder, no generic `findAll`, no
 * table name in a protected field. Repositories differ in their SQL and in the
 * shape they return, so a base class that tried to own those would have to be
 * widened by every repository that inherited it, which is the opposite of what
 * a base class is for.
 *
 * `rows` and `execute` exist because the two are read differently at the call
 * site: one is a query whose result matters, the other a write whose result is
 * that it did not throw.
 */
export abstract class BaseRepository {
  protected constructor(private readonly db: Queryable) {}

  protected async rows<Row extends QueryResultRow>(
    sql: string,
    parameters: readonly unknown[] = [],
  ): Promise<Row[]> {
    const result = await this.db.query<Row>(sql, parameters);
    return result.rows;
  }

  protected async execute(sql: string, parameters: readonly unknown[] = []): Promise<void> {
    await this.db.query(sql, parameters);
  }
}
