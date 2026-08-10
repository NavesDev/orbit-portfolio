# Design — Persisted portfolio content: schema, migrations and seed

Issue [#2](https://github.com/NavesDev/orbit-portfolio/issues/2) · branch
`feat/2-db-schema-migrations-seed` · roadmap 1.1–1.8, 1.11 · sprint 1, task 1.

Normative sources: [data-model.md](../../domain/data-model.md),
[testing.md](../../testing.md). Where this document and those disagree, they
win.

## Goal

An empty PostgreSQL reaches the full schema and real content in two commands:

```bash
pnpm db:migrate && pnpm db:seed
```

Every later task in sprint 1 reads from that database instead of from a
fixture.

## Scope

In: the two enums, the six tables, the `is_localized` / `is_localized_array`
functions, every index and check constraint in `data-model.md`, a forward-only
migration runner, a re-runnable seed, and the integration tests that prove the
constraints reject what they should.

Out: repositories, mappers and use cases — each vertical slice brings its own
(sprint tasks 4, 5, 6). Telemetry tables are Phase 6. The CI workflow already
runs the five documented steps; nothing about it changes here.

## Components

### 1. SQL migrations — `packages/db/src/migrations/*.sql`

Eight files, in the order `data-model.md § Migration order` fixes: enums →
localization functions → `social_links` → `skills` → `projects` →
`timeline_entries` → `project_skill` → `timeline_entry_skill`. Plain declarative
DDL, no `IF NOT EXISTS` guards — idempotence is the runner's job, not the SQL's,
which keeps each file readable as the definition of its table.

These files are already written. They stay as they are; the work below is what
surrounds them.

### 2. Migration runner — `packages/db/src/migrate.ts`

A ledger table, created by the runner itself before anything else:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename    text        NOT NULL PRIMARY KEY,
  applied_at  timestamptz NOT NULL DEFAULT now()
);
```

The runner reads `src/migrations/*.sql`, sorts lexicographically (the `NNN_`
prefix makes that the documented order), skips every filename already in the
ledger, and applies each remaining file **inside one transaction together with
its own `INSERT` into the ledger**. A migration that fails halfway leaves
neither half a schema nor a lying ledger row.

Forward-only: there is no `down`. A mistake is corrected by a new migration, and
a file that has run is never edited.

Two surfaces:

- `export async function migrate(pool: Pool): Promise<string[]>` — returns the
  filenames it applied. Integration tests call this against their scratch
  database.
- A CLI entrypoint that resolves `DATABASE_URL` through
  `requireConnectionString`, runs `migrate`, prints what it applied, and closes
  its pool.

### 3. Connection pool — `packages/db/src/client.ts`

Already written. One shared `Pool` per process for the app (`getPool`), plus
`createPool(connectionString)` for callers that own their own — the runner
against an explicit target, the tests against a scratch database.
`requireConnectionString` has no fallback on purpose.

### 4. Seed — `packages/db/src/seed/`

Split in two so the content is readable without the mechanics in the way:

| File | Holds |
| --- | --- |
| `data.ts` | The content itself, typed. No SQL, no I/O. |
| `run.ts` | The executor: transaction, upserts, CLI entrypoint. |

**Identity.** Every row's `id` is a UUIDv5 derived from a fixed project
namespace and the row's natural key — `slug` for a project, `name` for a skill,
`platform` for a social link, `kind + organization + started_on` for a timeline
entry. Ids are therefore stable across machines and across runs, which is what
lets the join tables be written from the same natural keys.

**Idempotence.** One transaction; each table written with
`INSERT … ON CONFLICT (id) DO UPDATE`, join tables on their composite PK. A
second run converges the database to the file without changing ids and without
deleting anything an author added by hand. The seed is a statement of what these
rows are, not a reset button.

**Order.** Skills and the two owning tables first, join rows last — the FKs
demand it.

### 5. Integration tests — `packages/db/src/**/*.test.ts`

A shared helper creates a scratch database (`portfolio_test_<random>`) from the
maintenance connection in `TEST_DATABASE_URL`, migrates it, hands back a pool,
and drops it afterwards. A failed run never leaves state that makes the next one
pass for the wrong reason. `TEST_DATABASE_URL` unset fails the run.

Coverage, matching `testing.md § Integration` and the issue's acceptance
criteria:

- Migrations on an empty database produce every documented table, enum, index
  and constraint.
- Running them a second time applies nothing and changes nothing.
- The seed runs clean on the migrated schema, populates all six tables including
  `usage_note` on both join tables, and is re-runnable — asserted on
  *convergence*, never on row counts or on the content itself (U-1).
- Constraints reject: `progress_percent = 150`; `ended_on` before `started_on`;
  a duplicate `slug`; deleting a `skill` a project still references
  (`ON DELETE RESTRICT`); a localized value over its budget; an unknown locale
  key (`en-US`); a localized column with no `pt-BR`; `tags` over 8 items.

### 6. Dependencies

`pg` and `@types/pg` added to `packages/db`. Nothing else — no ORM, no migration
framework. The runner is forty lines and the schema is the documentation.

## Seed content

Real content, replacing the prototype's placeholder (this closes U-1 for the
rows below). Every localized column carries both `pt-BR` and `en`.

**Skills — 26**, categorized into the `skill_category` enum:

| Category | Names |
| --- | --- |
| `frontend` | HTML, CSS, JavaScript, TypeScript, React, Next.js, FreeMarker |
| `backend` | Java, Liferay, Hibernate, Ruby on Rails, Python, Node.js |
| `data` | SQL, PostgreSQL, Groovy, RAG |
| `tooling` | Git, GitLab, CI/CD, JUnit, TDD, Selenium, Claude Code, Docker, Vercel |

Names stay proper nouns and are not translated, so "Testes Unitários" is carried
as **TDD** and **JUnit** — a language-neutral name for the same practice.

**Projects — 3**, all published and featured:

| Slug | Progress | Repository |
| --- | --- | --- |
| `orbit-portfolio` | 100 | `NavesDev/orbit-portfolio` |
| `navi` | 70 | `NavesDev/Navi` |
| `personal-dashboard` | 80 | `NavesDev/Personal-Dashboard` |

`ended_on` is `NULL` on all three — none has shipped. `started_on` comes from
each repository's creation date.

**Timeline — 5:**

| Kind | Organization | Title | Period |
| --- | --- | --- | --- |
| `professional` | Sea Tecnologia | Estagiário de Desenvolvimento | 2025-12 → open |
| `professional` | Neo Energia | Jovem Aprendiz | 2025-06 → 2025-12 |
| `academic` | UNIP | Análise e Desenvolvimento de Sistemas | 2025-02 → open |
| `academic` | CEMIC | Técnico em Tecnologia da Informação | 2022-02 → 2024-12 |
| `certification` | FIAP | Java Development (Nano Course, 60 h) | 2026-07-25 → never expires |

Descriptions are the author's own achievement bullets, stored as Markdown.

**Social links — 3:** GitHub (`github.com/NavesDev`), LinkedIn
(`linkedin.com/in/davi-de-sousa-naves-b63b12351`), e-mail
(`mailto:davinaves.2006@gmail.com`). `icon_svg` is authored here — the prototype
uses two-letter text placeholders — and satisfies the `IconSvg` invariant:
whitelisted tags only, `stroke="currentColor"`, no `on*` attribute, no
`<script>`.

**Join rows** carry a `usage_note` in both locales on every pairing. That text is
what the skill modal shows; a pairing without one has nothing to display.

## Error handling

| Failure | Behaviour |
| --- | --- |
| `DATABASE_URL` / `TEST_DATABASE_URL` unset | Throw. No fallback to a reachable database. |
| A migration statement fails | Its transaction rolls back; the ledger keeps no row for it; the process exits non-zero. |
| A seed statement fails | The whole seed transaction rolls back; the database is left as it was. |
| A constraint rejects seed content | Surfaces as the failure above — the seed is written outside the domain layer, which is exactly the case the `CHECK`s exist for. |

## Verification

Local, against Docker:

```bash
docker compose up -d postgres
pnpm db:migrate && pnpm db:migrate   # second run applies nothing
pnpm db:seed && pnpm db:seed         # second run converges
TEST_DATABASE_URL=… pnpm test:integration
pnpm typecheck
```

The schema is then inspected directly — tables, enums, indexes, constraints and
the seeded rows — rather than assumed from a green exit code.

## Assumptions

- `Personal-Dashboard` has no public description; its copy is written
  conservatively from the repository's language and structure, and is the one
  piece of seed content the author should review.
- Academic periods use February as the Brazilian academic year's start, since
  the source gives years only.
