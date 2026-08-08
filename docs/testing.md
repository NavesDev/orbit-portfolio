# Testing Strategy

Testing is not a phase. Each phase in [roadmap.md](roadmap.md) ships its own
tests and is not done until they pass — a separate "testing phase" at the end
finds defects when they are most expensive and lets the previous phases declare
victory on unverified code.

## Levels

| Level | What it covers | Where | Runtime | Dependencies |
| --- | --- | --- | --- | --- |
| Unit | Domain invariants, use cases | `packages/core` | < 1 ms per test | None |
| Integration | Repositories, migrations, constraints | `packages/db` | Seconds | Real PostgreSQL |
| Component | Rendering, interaction, accessibility | `apps/web` | Fast | Stubbed use cases |
| End-to-end | Full journeys through a real browser | `apps/web/e2e` | Slow | Running app + database |

Most tests are unit tests, because most of the logic is in `core` and `core`
has no dependencies. That is a consequence of the architecture, not a target to
chase.

## Tooling

| Tool | Used for |
| --- | --- |
| Vitest | Unit, integration and component tests |
| Testing Library | Component queries — by role and label, not by class name |
| Playwright | End-to-end |
| Docker Compose | PostgreSQL for integration tests and local development |

Vitest over `node:test` for native TypeScript, workspace support across
packages, and a watch mode that matters when the suite is run constantly.

## What each level tests

### Unit — `packages/core`

Domain invariants and use-case behaviour, against in-memory port fakes.

- Value objects reject invalid input at construction: `DateRange` with
  `ended_on` before `started_on`, `ProgressPercent` outside 0–100, `Url` that
  is not absolute.
- `IconSvg` rejects `<script>`, `on*` attributes and non-whitelisted tags —
  one test per rejection, because this one is a security boundary
  (NFR-07).
- `LocalizedText` rejects text over the field's budget, unknown locale keys, and
  a missing `pt-BR` entry. Asking for a locale that a field lacks returns the
  `pt-BR` value (FR-34).
- Use cases apply their policies: unpublished content is never returned,
  ordering follows the documented contract, `GetProjectBySlug` returns not-found
  rather than throwing.

The in-memory fakes double as a design check: a fake that is awkward to write
means the port has leaked a storage concern.

### Integration — `packages/db`

The parts that only fail against a real database.

- Migrations run on an empty database and produce the expected schema.
- Running them twice changes nothing.
- Every repository method against seeded data.
- **Constraints reject what they should**: `progress_percent = 150`,
  `ended_on < started_on`, duplicate `slug`, deleting a `skill` still
  referenced by a project (`ON DELETE RESTRICT`), a localized value over its
  length budget, an unknown locale key, a localized column missing `pt-BR`.
- Mappers round-trip: entity → row → entity is identity.

The last two matter most. A constraint nobody tested is a constraint nobody
knows is missing.

### Component — `apps/web`

Behaviour a user can observe, with use cases stubbed.

- Sections render the data they receive: three projects in, three cards out.
- Modals open, close on `Escape`, and return focus to the trigger (NFR-05).
- An ongoing timeline entry renders as "atual"; a certification with no
  `ended_on` renders as "não expira" (FR-13).
- A project without `repo_url` omits the control rather than rendering a dead
  link (FR-09).
- Icon-only links expose an accessible name (FR-24).
- A field with no `en` translation renders its `pt-BR` text, not an empty node.

Queries go through role and accessible name. A test that finds a button by CSS
class passes while the button is unreachable by keyboard.

### End-to-end — `apps/web/e2e`

A handful of journeys, not a second suite.

1. Home page loads and every section shows content from the database.
2. Opening a project's detail and closing it.
3. "Ver todos os projetos" → `/[locale]/projetos` → a project page.
4. An unknown slug returns 404.
5. Clicking a skill lists where it was used.
6. A request to `/` with an English `Accept-Language` lands on `/en`; with an
   unsupported language, on `/pt-BR`. The switcher's choice then outranks the
   header on the next visit.

## What is not tested

Recorded so the gaps are deliberate:

| Not tested | Why |
| --- | --- |
| Canvas pixel output | Asserting on rendered pixels is brittle and tests the browser, not the code. The hit-testing math is unit-testable and is what actually breaks. |
| Scroll-driven animations | Position over time in jsdom proves nothing about a real viewport. Verified by hand against the prototype. |
| Visual regression | No budget for a screenshot baseline on a site whose design is still moving. Revisit after Phase 5. |
| Static content in `content/` | Literals. A test would assert a constant equals itself. |

## Database for tests

`docker-compose.yml` at the root provides PostgreSQL 16 for both local
development and integration tests.

```bash
docker compose up -d
pnpm db:migrate
pnpm test:integration
```

Each integration run migrates into a scratch database and drops it afterwards,
so a failed run never leaves state that makes the next one pass or fail for the
wrong reason.

Integration tests never run against the development database and never against
production. The connection string comes from `TEST_DATABASE_URL`, which has no
default — an unset variable fails the run rather than falling back to something
that happens to be reachable.

## Commands

```bash
pnpm test               # unit + component — no database, safe to run on every save
pnpm test:integration   # requires docker compose up
pnpm test:e2e           # requires a running app
pnpm typecheck
```

`pnpm test` is deliberately the fast one. A suite that needs Docker to run at
all is a suite that stops being run.

## Continuous integration

`.github/workflows/ci.yml`, on every push and pull request:

1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm test:integration` against a PostgreSQL service container
5. `pnpm build`

E2E runs against the Vercel preview deployment, not in CI — it needs the real
rendering and revalidation behaviour, which a local build does not reproduce.

A red pipeline blocks the merge. A phase whose exit criteria include tests is
not done while CI is failing.

## Per-phase expectations

| Phase | Tests required to close it |
| --- | --- |
| 1 — data layer | Integration: migrations, repositories, constraints, mappers |
| 2 — application layer | Unit: every use case and value object against fakes |
| 3 — home page | Component per section; locale negotiation and fallback; accessibility checks |
| 4 — subpages | Component + the six E2E journeys |
| 5 — release | E2E against the preview deployment; Lighthouse ≥ 95 |
| 6 — telemetry | Its own design pass first; not specified here |
