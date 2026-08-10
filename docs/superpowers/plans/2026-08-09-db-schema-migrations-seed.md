# Persisted Portfolio Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring an empty PostgreSQL to the full content schema and the author's real portfolio content with `pnpm db:migrate && pnpm db:seed`, proven by integration tests.

**Architecture:** Eight declarative SQL migrations (already written) applied by a forty-line forward-only runner that records what it applied in a `schema_migrations` ledger and wraps each file in a transaction with its own ledger row. A seed split into pure content (`data.ts`) and an executor (`run.ts`) that upserts on deterministic UUIDv5 ids, so a second run converges instead of duplicating. Integration tests migrate into a scratch database created per run and dropped afterwards.

**Tech Stack:** PostgreSQL 16, `pg` (the only new dependency — no ORM, no migration framework), Node 24 native TypeScript stripping, Vitest project `db`.

## Global Constraints

- Migrations are **forward-only and idempotent**; never edit one that has run. There is no `down`.
- Migration order is fixed by `docs/domain/data-model.md § Migration order`: enums → localization functions → `social_links` → `skills` → `projects` → `timeline_entries` → `project_skill` → `timeline_entry_skill`.
- `packages/db` may import `@portfolio/core` and nothing else from the workspace.
- `TEST_DATABASE_URL` and `DATABASE_URL` have **no defaults**. Unset must fail the run.
- Integration tests never run against the development database or production.
- `packages/db` runs with `fileParallelism: false` — integration tests share one server.
- Localized columns are `jsonb`; every one carries `pt-BR`, and this seed also carries `en`. Length budgets: title 160, `projects.category` 40, tag item 60 × ≤ 8 items, `usage_note` 240, description 8000.
- **No test asserts a row count or a specific piece of seed content** (U-1). Assert on convergence and on constraint behaviour.
- TypeScript: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`. Nullable columns map to `T | null`.
- Conventional Commits scoped by package: `feat(db): …`, `test(db): …`, `docs(db): …`.
- `main` is never committed to directly. Work stays on `feat/2-db-schema-migrations-seed`.
- Local Node is 22 by default; run every command under Node 24 with `source ~/.nvm/nvm.sh && nvm use 24`.

## File Structure

| File | Responsibility |
| --- | --- |
| `packages/db/package.json` | Adds `pg` / `@types/pg`, the `migrate` and `seed` scripts. |
| `packages/db/tsconfig.json` | Allows `.ts` import specifiers, which Node's type stripping requires. |
| `packages/db/src/client.ts` | Pools and `requireConnectionString`. **Already written — do not change.** |
| `packages/db/src/migrations/*.sql` | The schema. **Already written — do not change.** |
| `packages/db/src/migrate.ts` | Ledger, `migrate(pool)`, CLI entrypoint. |
| `packages/db/src/testing/scratch-database.ts` | Creates, migrates and drops a scratch database for a test file. |
| `packages/db/src/migrate.test.ts` | Migrations produce the schema; the second run is a no-op. |
| `packages/db/src/schema-constraints.test.ts` | Every documented rejection. |
| `packages/db/src/seed/ids.ts` | Deterministic UUIDv5 over a fixed project namespace. |
| `packages/db/src/seed/ids.test.ts` | Known-answer test for the UUIDv5 implementation. |
| `packages/db/src/seed/data.ts` | The content. Types + literals, no SQL, no I/O. |
| `packages/db/src/seed/run.ts` | Transactional upsert of `data.ts`, CLI entrypoint. |
| `packages/db/src/seed/run.test.ts` | Seed populates all six tables and converges on re-run. |
| `docs/domain/data-model.md` | Its seed section is rewritten from prototype placeholder to real content. |

---

### Task 1: Dependencies and the migration runner

**Files:**
- Modify: `packages/db/package.json`
- Modify: `packages/db/tsconfig.json`
- Create: `packages/db/src/migrate.ts`
- Create: `packages/db/src/testing/scratch-database.ts`
- Test: `packages/db/src/migrate.test.ts`

**Interfaces:**
- Consumes: `createPool(connectionString: string): Pool`, `requireConnectionString(variable: string): string` from `./client.ts`.
- Produces:
  - `migrate(pool: Pool): Promise<string[]>` — filenames applied, in order.
  - `withScratchDatabase(): { pool: () => Pool }` from `./testing/scratch-database.ts`, registering its own `beforeAll` / `afterAll`.

- [ ] **Step 1: Add the driver**

```bash
source ~/.nvm/nvm.sh && nvm use 24
pnpm --filter @portfolio/db add pg
pnpm --filter @portfolio/db add -D @types/pg
```

- [ ] **Step 2: Let TypeScript accept the `.ts` specifiers Node's stripper requires**

`packages/db/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "allowImportingTsExtensions": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write the scratch-database helper**

`packages/db/src/testing/scratch-database.ts`:

```ts
import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { afterAll, beforeAll } from 'vitest';
import { createPool, requireConnectionString } from '../client.ts';
import { migrate } from '../migrate.ts';

/**
 * Each integration file gets a database of its own, migrated on entry and
 * dropped on exit. A failed run never leaves state that makes the next one pass
 * or fail for the wrong reason (testing.md § Database for tests).
 */
export function withScratchDatabase(): { pool: () => Pool } {
  const name = `portfolio_test_${randomUUID().replaceAll('-', '')}`;
  let scratch: Pool | null = null;

  beforeAll(async () => {
    const admin = createPool(requireConnectionString('TEST_DATABASE_URL'));
    try {
      await admin.query(`CREATE DATABASE "${name}"`);
    } finally {
      await admin.end();
    }
    scratch = createPool(scratchUrl(name));
    await migrate(scratch);
  });

  afterAll(async () => {
    await scratch?.end();
    scratch = null;
    const admin = createPool(requireConnectionString('TEST_DATABASE_URL'));
    try {
      await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    } finally {
      await admin.end();
    }
  });

  return {
    pool: () => {
      if (scratch === null) throw new Error('Scratch database is not open.');
      return scratch;
    },
  };
}

/** The maintenance URL with its database swapped for the scratch one. */
export function scratchUrl(name: string): string {
  const url = new URL(requireConnectionString('TEST_DATABASE_URL'));
  url.pathname = `/${name}`;
  return url.toString();
}
```

- [ ] **Step 4: Write the failing test**

`packages/db/src/migrate.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { migrate } from './migrate.ts';
import { withScratchDatabase } from './testing/scratch-database.ts';

const db = withScratchDatabase();

async function names(sql: string): Promise<string[]> {
  const { rows } = await db.pool().query<{ name: string }>(sql);
  return rows.map((row) => row.name);
}

describe('migrate', () => {
  it('creates every documented table', async () => {
    expect(
      await names(
        `SELECT tablename AS name FROM pg_tables WHERE schemaname = 'public' ORDER BY 1`,
      ),
    ).toEqual([
      'project_skill',
      'projects',
      'schema_migrations',
      'skills',
      'social_links',
      'timeline_entries',
      'timeline_entry_skill',
    ]);
  });

  it('creates both enums with their documented values', async () => {
    const { rows } = await db.pool().query<{ name: string; values: string[] }>(
      `SELECT t.typname AS name, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
         FROM pg_type t
         JOIN pg_enum e ON e.enumtypid = t.oid
        GROUP BY t.typname
        ORDER BY t.typname`,
    );
    expect(rows).toEqual([
      { name: 'skill_category', values: ['frontend', 'backend', 'tooling', 'data'] },
      { name: 'timeline_kind', values: ['professional', 'academic', 'certification'] },
    ]);
  });

  it('creates both localization functions', async () => {
    expect(
      await names(
        `SELECT proname AS name FROM pg_proc
          WHERE proname IN ('is_localized', 'is_localized_array') ORDER BY 1`,
      ),
    ).toEqual(['is_localized', 'is_localized_array']);
  });

  it('creates every documented index', async () => {
    expect(
      await names(
        `SELECT indexname AS name FROM pg_indexes
          WHERE schemaname = 'public' AND indexname LIKE ANY (ARRAY['ix_%', 'ux_%'])
          ORDER BY 1`,
      ),
    ).toEqual([
      'ix_project_skill__skill',
      'ix_projects__published_featured_sort',
      'ix_skills__category',
      'ix_social_links__published_sort',
      'ix_timeline_entries__kind',
      'ix_timeline_entries__published_started',
      'ix_timeline_entry_skill__skill',
      'ux_projects__slug',
      'ux_skills__name',
    ]);
  });

  it('creates every documented check constraint', async () => {
    expect(
      await names(
        `SELECT conname AS name FROM pg_constraint WHERE contype = 'c' AND conname LIKE 'ck_%' ORDER BY 1`,
      ),
    ).toEqual([
      'ck_project_skill__usage_note',
      'ck_projects__category',
      'ck_projects__date_order',
      'ck_projects__description',
      'ck_projects__progress_range',
      'ck_projects__tags',
      'ck_projects__title',
      'ck_timeline_entries__date_order',
      'ck_timeline_entries__description',
      'ck_timeline_entries__title',
      'ck_timeline_entry_skill__usage_note',
    ]);
  });

  it('applies nothing on a second run', async () => {
    expect(await migrate(db.pool())).toEqual([]);
  });

  it('records every migration file in the ledger', async () => {
    const ledger = await names(
      `SELECT filename AS name FROM schema_migrations ORDER BY filename`,
    );
    expect(ledger).toHaveLength(8);
    expect(ledger[0]).toBe('001_enums.sql');
    expect(ledger.at(-1)).toBe('008_timeline_entry_skill.sql');
  });
});
```

- [ ] **Step 5: Run it to make sure it fails**

```bash
source ~/.nvm/nvm.sh && nvm use 24
docker compose up -d postgres
TEST_DATABASE_URL=postgres://portfolio:portfolio@localhost:5432/portfolio pnpm test:integration
```

Expected: FAIL — `Failed to resolve import "./migrate.ts"`.

- [ ] **Step 6: Write the runner**

`packages/db/src/migrate.ts`:

```ts
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';
import { createPool, requireConnectionString } from './client.ts';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

/**
 * The ledger is what makes a forward-only runner idempotent: the SQL files stay
 * plain declarative DDL and this table decides what has already run.
 */
const LEDGER = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename   text        NOT NULL PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`;

/**
 * Applies every migration not yet in the ledger, in filename order, each one in
 * a transaction together with its own ledger row — a file that fails halfway
 * leaves neither half a schema nor a ledger row claiming it ran.
 *
 * Returns the filenames applied. Forward-only: there is no `down`, and a file
 * that has run is never edited.
 */
export async function migrate(pool: Pool): Promise<string[]> {
  await pool.query(LEDGER);

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((file) => file.endsWith('.sql'))
    .sort();
  const { rows } = await pool.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations',
  );
  const applied = new Set(rows.map((row) => row.filename));

  const pending = files.filter((file) => !applied.has(file));
  for (const file of pending) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`, {
        cause: error,
      });
    } finally {
      client.release();
    }
  }

  return pending;
}

async function main(): Promise<void> {
  const pool = createPool(requireConnectionString('DATABASE_URL'));
  try {
    const applied = await migrate(pool);
    console.log(
      applied.length === 0
        ? 'Schema is up to date; nothing to apply.'
        : `Applied ${applied.length} migration(s):\n  ${applied.join('\n  ')}`,
    );
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
```

- [ ] **Step 7: Run the tests and make sure they pass**

```bash
TEST_DATABASE_URL=postgres://portfolio:portfolio@localhost:5432/portfolio pnpm test:integration
```

Expected: PASS, 6 tests.

- [ ] **Step 8: Typecheck**

```bash
pnpm typecheck
```

Expected: clean.

- [ ] **Step 9: Commit**

```bash
git add packages/db/package.json packages/db/tsconfig.json pnpm-lock.yaml \
        packages/db/src/migrate.ts packages/db/src/migrate.test.ts \
        packages/db/src/testing/scratch-database.ts packages/db/src/client.ts \
        packages/db/src/migrations
git commit -m "feat(db): add the content schema and a forward-only migration runner"
```

---

### Task 2: Constraint rejection tests

No production code. The schema either already rejects these or a migration is
wrong — and a constraint nobody tested is a constraint nobody knows is missing.

**Files:**
- Test: `packages/db/src/schema-constraints.test.ts`

**Interfaces:**
- Consumes: `withScratchDatabase()` from `./testing/scratch-database.ts`.
- Produces: nothing.

- [ ] **Step 1: Write the failing test**

`packages/db/src/schema-constraints.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { withScratchDatabase } from './testing/scratch-database.ts';

const db = withScratchDatabase();

const TITLE = { 'pt-BR': 'Título', en: 'Title' };

/** Inserts a project with the given overrides merged over a valid baseline. */
async function insertProject(overrides: Record<string, unknown> = {}): Promise<string> {
  const row = { slug: `p-${Math.random().toString(36).slice(2)}`, title: TITLE, ...overrides };
  const columns = Object.keys(row);
  const values = Object.values(row).map((value) =>
    typeof value === 'object' && value !== null ? JSON.stringify(value) : value,
  );
  const { rows } = await db.pool().query<{ id: string }>(
    `INSERT INTO projects (${columns.join(', ')})
     VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})
     RETURNING id`,
    values,
  );
  return rows[0]!.id;
}

beforeEach(async () => {
  await db.pool().query('TRUNCATE project_skill, projects, skills CASCADE');
});

describe('projects constraints', () => {
  it('rejects a progress percent outside 0-100', async () => {
    await expect(insertProject({ progress_percent: 150 })).rejects.toThrow(
      /ck_projects__progress_range/,
    );
  });

  it('accepts the boundaries of the progress range', async () => {
    await expect(insertProject({ progress_percent: 0 })).resolves.toBeTypeOf('string');
    await expect(insertProject({ progress_percent: 100 })).resolves.toBeTypeOf('string');
  });

  it('rejects an end date before the start date', async () => {
    await expect(
      insertProject({ started_on: '2026-01-10', ended_on: '2026-01-01' }),
    ).rejects.toThrow(/ck_projects__date_order/);
  });

  it('accepts an open period', async () => {
    await expect(
      insertProject({ started_on: '2026-01-10', ended_on: null }),
    ).resolves.toBeTypeOf('string');
  });

  it('rejects a duplicate slug', async () => {
    await insertProject({ slug: 'orbit-portfolio' });
    await expect(insertProject({ slug: 'orbit-portfolio' })).rejects.toThrow(
      /ux_projects__slug/,
    );
  });

  it('rejects a localized value over its length budget', async () => {
    await expect(
      insertProject({ title: { 'pt-BR': 'a'.repeat(161) } }),
    ).rejects.toThrow(/ck_projects__title/);
  });

  it('rejects an unknown locale key', async () => {
    await expect(
      insertProject({ title: { 'pt-BR': 'Título', 'en-US': 'Title' } }),
    ).rejects.toThrow(/ck_projects__title/);
  });

  it('rejects a localized column missing pt-BR', async () => {
    await expect(insertProject({ title: { en: 'Title' } })).rejects.toThrow(
      /ck_projects__title/,
    );
  });

  it('rejects a localized value that is not an object', async () => {
    await expect(insertProject({ title: 'Título' })).rejects.toThrow(
      /ck_projects__title/,
    );
  });

  it('rejects more tags than the budget allows', async () => {
    await expect(
      insertProject({ tags: { 'pt-BR': Array.from({ length: 9 }, (_, i) => `t${i}`) } }),
    ).rejects.toThrow(/ck_projects__tags/);
  });

  it('rejects a tag over its length budget', async () => {
    await expect(
      insertProject({ tags: { 'pt-BR': ['a'.repeat(61)] } }),
    ).rejects.toThrow(/ck_projects__tags/);
  });

  it('accepts a localized column with only pt-BR', async () => {
    await expect(insertProject({ title: { 'pt-BR': 'Só português' } })).resolves.toBeTypeOf(
      'string',
    );
  });
});

describe('timeline_entries constraints', () => {
  it('rejects an end date before the start date', async () => {
    await expect(
      db.pool().query(
        `INSERT INTO timeline_entries (kind, title, organization, started_on, ended_on)
         VALUES ('professional', $1, 'Sea Tecnologia', '2026-01-10', '2026-01-01')`,
        [JSON.stringify(TITLE)],
      ),
    ).rejects.toThrow(/ck_timeline_entries__date_order/);
  });

  it('rejects an unknown kind', async () => {
    await expect(
      db.pool().query(
        `INSERT INTO timeline_entries (kind, title, organization, started_on)
         VALUES ('internship', $1, 'Sea Tecnologia', '2026-01-10')`,
        [JSON.stringify(TITLE)],
      ),
    ).rejects.toThrow(/timeline_kind/);
  });
});

describe('join table constraints', () => {
  async function insertSkill(name: string): Promise<string> {
    const { rows } = await db.pool().query<{ id: string }>(
      `INSERT INTO skills (name, category) VALUES ($1, 'backend') RETURNING id`,
      [name],
    );
    return rows[0]!.id;
  }

  it('refuses to delete a skill a project still references', async () => {
    const projectId = await insertProject();
    const skillId = await insertSkill('Java');
    await db.pool().query(
      'INSERT INTO project_skill (project_id, skill_id) VALUES ($1, $2)',
      [projectId, skillId],
    );

    await expect(db.pool().query('DELETE FROM skills WHERE id = $1', [skillId])).rejects
      .toThrow(/fk_project_skill__skill/);
  });

  it('drops the associations when the project itself is deleted', async () => {
    const projectId = await insertProject();
    const skillId = await insertSkill('Python');
    await db.pool().query(
      'INSERT INTO project_skill (project_id, skill_id) VALUES ($1, $2)',
      [projectId, skillId],
    );

    await db.pool().query('DELETE FROM projects WHERE id = $1', [projectId]);

    const { rowCount } = await db.pool().query('SELECT 1 FROM project_skill');
    expect(rowCount).toBe(0);
  });

  it('rejects a usage note over its length budget', async () => {
    const projectId = await insertProject();
    const skillId = await insertSkill('TypeScript');
    await expect(
      db.pool().query(
        'INSERT INTO project_skill (project_id, skill_id, usage_note) VALUES ($1, $2, $3)',
        [projectId, skillId, JSON.stringify({ 'pt-BR': 'a'.repeat(241) })],
      ),
    ).rejects.toThrow(/ck_project_skill__usage_note/);
  });
});
```

- [ ] **Step 2: Run the tests**

```bash
TEST_DATABASE_URL=postgres://portfolio:portfolio@localhost:5432/portfolio pnpm test:integration
```

Expected: PASS. Any failure here is a defect in a migration, not in the test — fix the migration only if the schema genuinely diverges from `data-model.md`.

- [ ] **Step 3: Commit**

```bash
git add packages/db/src/schema-constraints.test.ts
git commit -m "test(db): prove the schema rejects what data-model.md says it must"
```

---

### Task 3: Deterministic ids

**Files:**
- Create: `packages/db/src/seed/ids.ts`
- Test: `packages/db/src/seed/ids.test.ts`

**Interfaces:**
- Consumes: `node:crypto`.
- Produces: `seedId(kind: string, key: string): string` — a UUIDv5 string.

- [ ] **Step 1: Write the failing test**

`packages/db/src/seed/ids.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { seedId } from './ids.ts';

describe('seedId', () => {
  it('returns a syntactically valid v5 uuid', () => {
    expect(seedId('project', 'orbit-portfolio')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('is stable across calls', () => {
    expect(seedId('project', 'navi')).toBe(seedId('project', 'navi'));
  });

  it('separates the namespaces', () => {
    expect(seedId('project', 'navi')).not.toBe(seedId('skill', 'navi'));
  });

  it('matches the RFC 4122 example vector', () => {
    // Namespace DNS + "www.example.org" is the canonical v5 test vector.
    expect(uuidV5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'www.example.org')).toBe(
      '74738ff5-5367-5958-9aee-98fffdcd1876',
    );
  });
});

// Imported separately so the vector test exercises the primitive directly.
import { uuidV5 } from './ids.ts';
```

- [ ] **Step 2: Run it to verify it fails**

```bash
pnpm vitest run --project db packages/db/src/seed/ids.test.ts
```

Expected: FAIL — cannot resolve `./ids.ts`.

- [ ] **Step 3: Implement**

`packages/db/src/seed/ids.ts`:

```ts
import { createHash } from 'node:crypto';

/**
 * A UUIDv5 namespace for this repository's seed, generated once and pinned
 * here. Every seeded id derives from it, so ids are the same on every machine
 * and every run — which is what lets the join rows be written from natural keys
 * and lets a second seed run converge instead of duplicating.
 */
const SEED_NAMESPACE = 'b6f2b8d6-1f4c-5c5a-9b1e-2f6a7c0d4e31';

/** RFC 4122 §4.3 — SHA-1 of namespace bytes + name, version 5, variant RFC. */
export function uuidV5(namespace: string, name: string): string {
  const bytes = Buffer.from(namespace.replaceAll('-', ''), 'hex');
  const hash = createHash('sha1').update(bytes).update(name, 'utf8').digest();

  hash[6] = (hash[6]! & 0x0f) | 0x50;
  hash[8] = (hash[8]! & 0x3f) | 0x80;

  const hex = hash.subarray(0, 16).toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/** The id of a seeded row, from its kind and its natural key. */
export function seedId(kind: string, key: string): string {
  return uuidV5(SEED_NAMESPACE, `${kind}:${key}`);
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm vitest run --project db packages/db/src/seed/ids.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/seed/ids.ts packages/db/src/seed/ids.test.ts
git commit -m "feat(db): derive seed ids deterministically so a re-run converges"
```

---

### Task 4: Seed content

Pure data. The types below are the contract `run.ts` writes against.

**Files:**
- Create: `packages/db/src/seed/data.ts`

**Interfaces:**
- Consumes: nothing (no imports beyond types).
- Produces: `seedContent: SeedContent`, and the types `Localized`, `LocalizedList`, `SeedSkill`, `SeedProject`, `SeedTimelineEntry`, `SeedSocialLink`, `SeedContent`.

- [ ] **Step 1: Write the types and the content**

`packages/db/src/seed/data.ts` — the full literal content. Shape:

```ts
export type Localized = { 'pt-BR': string; en?: string };
export type LocalizedList = { 'pt-BR': string[]; en?: string[] };

export interface SeedSkill {
  name: string;
  category: 'frontend' | 'backend' | 'tooling' | 'data';
  sortOrder: number;
}

export interface SeedProject {
  slug: string;
  title: Localized;
  category: Localized;
  description: Localized;
  tags: LocalizedList;
  repoUrl: string | null;
  liveUrl: string | null;
  progressPercent: number;
  startedOn: string;
  endedOn: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  /** Skill name → what it did on this project. */
  skills: Record<string, Localized>;
}

export interface SeedTimelineEntry {
  kind: 'professional' | 'academic' | 'certification';
  title: Localized;
  organization: string;
  description: Localized;
  credentialUrl: string | null;
  startedOn: string;
  endedOn: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  skills: Record<string, Localized>;
}

export interface SeedSocialLink {
  platform: string;
  url: string;
  iconSvg: string;
  isPublished: boolean;
  sortOrder: number;
}

export interface SeedContent {
  skills: SeedSkill[];
  projects: SeedProject[];
  timelineEntries: SeedTimelineEntry[];
  socialLinks: SeedSocialLink[];
}
```

Content, per the design document:

- **26 skills** — `frontend`: HTML, CSS, JavaScript, TypeScript, React, Next.js, FreeMarker; `backend`: Java, Liferay, Hibernate, Ruby on Rails, Python, Node.js; `data`: SQL, PostgreSQL, Groovy, RAG; `tooling`: Git, GitLab, CI/CD, JUnit, TDD, Selenium, Claude Code, Docker, Vercel. `sortOrder` ascending within the file order.
- **3 projects** — `orbit-portfolio` (100, `2026-08-08`), `navi` (70, `2026-06-16`), `personal-dashboard` (80, `2026-04-28`). All `endedOn: null`, `isFeatured: true`, `isPublished: true`, `repoUrl` the GitHub URL, `liveUrl: null`. Each carries 4–8 tags per locale and a `skills` map whose keys must all exist in the skills list.
- **5 timeline entries** — Sea Tecnologia (`professional`, `2025-12-01`, open, featured), Neo Energia (`professional`, `2025-06-01` → `2025-12-31`), UNIP (`academic`, `2025-02-01`, open, featured), CEMIC (`academic`, `2022-02-01` → `2024-12-31`), FIAP (`certification`, `2026-07-25`, `endedOn: null` — never expires). Descriptions are the author's achievement bullets as Markdown lists, in both locales, under 8000 characters.
- **3 social links** — `github` → `https://github.com/NavesDev`, `linkedin` → `https://www.linkedin.com/in/davi-de-sousa-naves-b63b12351/`, `email` → `mailto:davinaves.2006@gmail.com`. Each `iconSvg` is a 24×24 stroke icon using only `svg`, `g`, `path`, `circle`, `rect`, `line`, `polyline`, `polygon`, with `stroke="currentColor"`, `fill="none"` and no `on*` attribute.

Every `usage_note` stays at or under 240 characters per locale — the `CHECK` is
what catches a violation, and it will.

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add packages/db/src/seed/data.ts
git commit -m "feat(db): carry the author's real portfolio content as seed data"
```

---

### Task 5: Seed runner

**Files:**
- Create: `packages/db/src/seed/run.ts`
- Modify: `packages/db/package.json` (point the `seed` script at `src/seed/run.ts`)
- Test: `packages/db/src/seed/run.test.ts`

**Interfaces:**
- Consumes: `seedContent` from `./data.ts`, `seedId` from `./ids.ts`, `createPool` / `requireConnectionString` from `../client.ts`.
- Produces: `seed(pool: Pool): Promise<void>`.

- [ ] **Step 1: Write the failing test**

`packages/db/src/seed/run.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { withScratchDatabase } from '../testing/scratch-database.ts';
import { seed } from './run.ts';

const db = withScratchDatabase();

const TABLES = [
  'social_links',
  'skills',
  'projects',
  'timeline_entries',
  'project_skill',
  'timeline_entry_skill',
] as const;

async function snapshot(): Promise<Record<string, unknown[]>> {
  const entries = await Promise.all(
    TABLES.map(async (table) => {
      const { rows } = await db.pool().query(`SELECT * FROM ${table} ORDER BY 1, 2`);
      return [table, rows] as const;
    }),
  );
  return Object.fromEntries(entries);
}

describe('seed', () => {
  it('populates every table, then converges on a second run', async () => {
    await seed(db.pool());
    const first = await snapshot();

    // No row count is asserted — the content is the author's and may change.
    for (const table of TABLES) {
      expect(first[table]!.length, `${table} should not be empty`).toBeGreaterThan(0);
    }

    await seed(db.pool());
    const second = await snapshot();

    for (const table of TABLES) {
      expect(second[table]!.length, `${table} row count changed`).toBe(
        first[table]!.length,
      );
    }
    expect(idsOf(second)).toEqual(idsOf(first));
  });

  it('writes a usage note on both join tables', async () => {
    await seed(db.pool());
    for (const table of ['project_skill', 'timeline_entry_skill'] as const) {
      const { rows } = await db.pool().query<{ count: string }>(
        `SELECT count(*) AS count FROM ${table} WHERE usage_note IS NOT NULL`,
      );
      expect(Number(rows[0]!.count), `${table} has no usage notes`).toBeGreaterThan(0);
    }
  });

  it('writes both locales on every localized project column', async () => {
    await seed(db.pool());
    const { rows } = await db.pool().query<{ slug: string }>(
      `SELECT slug FROM projects
        WHERE NOT (title ? 'en') OR NOT (description ? 'en') OR NOT (tags ? 'en')`,
    );
    expect(rows).toEqual([]);
  });
});

function idsOf(tables: Record<string, unknown[]>): unknown[] {
  return Object.values(tables).flatMap((rows) =>
    rows.map((row) => {
      const record = row as Record<string, unknown>;
      return record['id'] ?? [record['project_id'], record['timeline_entry_id'], record['skill_id']];
    }),
  );
}
```

- [ ] **Step 2: Run it to verify it fails**

```bash
TEST_DATABASE_URL=postgres://portfolio:portfolio@localhost:5432/portfolio \
  pnpm vitest run --project db packages/db/src/seed/run.test.ts
```

Expected: FAIL — cannot resolve `./run.ts`.

- [ ] **Step 3: Implement the runner**

`packages/db/src/seed/run.ts`:

```ts
import { fileURLToPath } from 'node:url';
import type { Pool, PoolClient } from 'pg';
import { createPool, requireConnectionString } from '../client.ts';
import { seedContent } from './data.ts';
import { seedId } from './ids.ts';

/**
 * Writes `data.ts` into the database, in one transaction, upserting on the
 * deterministic id of each row. Re-running converges the database on the file
 * without changing ids and without deleting anything an author added by hand —
 * the seed states what these rows are, it is not a reset button.
 *
 * Order follows the foreign keys: owners first, join rows last.
 */
export async function seed(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await seedSocialLinks(client);
    await seedSkills(client);
    await seedProjects(client);
    await seedTimelineEntries(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

Each `seedX` helper is a loop of one parameterised `INSERT … ON CONFLICT (id) DO UPDATE SET … , updated_at = now()`, listing every column the seed owns. Join rows use `ON CONFLICT (project_id, skill_id)` / `(timeline_entry_id, skill_id)` and are written inside the owner's loop, from the owner's `skills` map, resolving each skill name through `seedId('skill', name)`. An unknown skill name throws before any SQL runs — a typo must not silently drop an association.

The CLI entrypoint mirrors `migrate.ts`: resolve `DATABASE_URL`, run `seed`, log a one-line summary, close the pool.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
TEST_DATABASE_URL=postgres://portfolio:portfolio@localhost:5432/portfolio pnpm test:integration
```

Expected: PASS, all files.

- [ ] **Step 5: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/seed/run.ts packages/db/src/seed/run.test.ts packages/db/package.json
git commit -m "feat(db): seed the content database re-runnably"
```

---

### Task 6: Verify against a real database, then reconcile the docs

**Files:**
- Modify: `docs/domain/data-model.md` (§ *Seed data from the prototype*)
- Modify: `.env.example` if the verification shows a variable is missing

**Interfaces:**
- Consumes: everything above.
- Produces: the evidence the PR quotes.

- [ ] **Step 1: Bring up a clean database**

```bash
docker compose down -v && docker compose up -d postgres
```

- [ ] **Step 2: Migrate twice**

```bash
source ~/.nvm/nvm.sh && nvm use 24
export DATABASE_URL=postgres://portfolio:portfolio@localhost:5432/portfolio
pnpm db:migrate && pnpm db:migrate
```

Expected: the first run lists eight files; the second prints `Schema is up to date; nothing to apply.`

- [ ] **Step 3: Seed twice and compare**

```bash
pnpm db:seed && pnpm db:seed
docker compose exec -T postgres psql -U portfolio -d portfolio -c \
  "SELECT 'skills' t, count(*) FROM skills UNION ALL
   SELECT 'projects', count(*) FROM projects UNION ALL
   SELECT 'timeline_entries', count(*) FROM timeline_entries UNION ALL
   SELECT 'social_links', count(*) FROM social_links UNION ALL
   SELECT 'project_skill', count(*) FROM project_skill UNION ALL
   SELECT 'timeline_entry_skill', count(*) FROM timeline_entry_skill"
```

Expected: the same counts after the second run as after the first.

- [ ] **Step 4: Read the data back the way the app will**

```bash
docker compose exec -T postgres psql -U portfolio -d portfolio -c \
  "SELECT slug, title ->> 'en' AS title_en, progress_percent
     FROM projects ORDER BY sort_order"
docker compose exec -T postgres psql -U portfolio -d portfolio -c \
  "SELECT s.name, ps.usage_note ->> 'pt-BR' FROM project_skill ps
     JOIN skills s ON s.id = ps.skill_id LIMIT 5"
```

- [ ] **Step 5: Run the whole pipeline as CI does**

```bash
pnpm typecheck && pnpm test
TEST_DATABASE_URL=postgres://portfolio:portfolio@localhost:5432/portfolio pnpm test:integration
pnpm build
```

- [ ] **Step 6: Rewrite the stale doc section**

`docs/domain/data-model.md § Seed data from the prototype` currently maps the
prototype's placeholder into the schema. The seed now carries the author's real
content, so replace that section with what the seed actually holds and how it is
written — deterministic ids, upsert on re-run, `icon_svg` authored here, both
locales populated. Keep the note that row counts are not a criterion. The
document is the source of truth; leaving it describing content that no longer
exists is the failure mode the repository's own rule names.

- [ ] **Step 7: Commit and open the PR**

```bash
git add docs/domain/data-model.md
git commit -m "docs(db): describe the real seed content that replaced the prototype's"
git push -u origin feat/2-db-schema-migrations-seed
gh pr create --fill
```

---

## Self-Review

**Spec coverage:** migrations (Task 1) · runner + ledger (Task 1) · pool (already
written, committed in Task 1) · deterministic ids (Task 3) · seed content
(Task 4) · seed executor (Task 5) · scratch-database harness (Task 1) ·
migration and idempotence tests (Task 1) · every listed constraint rejection
(Task 2) · seed convergence and `usage_note` coverage (Task 5) · `pg` dependency
(Task 1) · local verification (Task 6) · doc reconciliation (Task 6). The CI
workflow already runs the five steps and needs no change — verified against
`.github/workflows/ci.yml`.

**Type consistency:** `migrate(pool)` returns `Promise<string[]>` in Task 1 and
is consumed as such by the harness; `withScratchDatabase()` returns
`{ pool: () => Pool }` and every test file calls `db.pool()`; `seedId(kind, key)`
is used in Task 5 exactly as defined in Task 3; `seed(pool)` returns
`Promise<void>` in both Task 5's implementation and its test.
