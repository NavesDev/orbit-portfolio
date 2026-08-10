import type { PoolClient } from 'pg';

/**
 * One table's slice of the seed, as a strategy: `seed()` in `run.ts` holds no
 * per-table logic of its own — it just calls `run` on every strategy
 * registered in `strategies/index.ts`. A table added later is one new class
 * implementing this interface plus one line in that registry, never a change
 * to `seed()` itself.
 */
export interface SeedStrategy {
  /** The table this strategy owns — what a failure inside `run` is reported against. */
  readonly table: string;

  run(client: PoolClient): Promise<void>;
}
