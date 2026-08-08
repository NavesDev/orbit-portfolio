# Personal Portfolio

Personal portfolio of **Davi Naves** — a bilingual (`pt-BR` / `en`) portfolio
site whose content lives in PostgreSQL instead of in hardcoded objects.

## Purpose

The site started as a static prototype. Editing it meant editing
markup: adding a project, a certification or a skill was a code change and a
deploy. This repository promotes that prototype into a layered application with
the same behaviour and appearance, but with its content persisted:

- **Content is data.** Projects, timeline entries, skills and social links are
  rows. Adding a project is an insert, not a commit.
- **Two languages, one source.** Translated fields are `jsonb` keyed by locale;
  the visitor's browser language decides which one renders, with `pt-BR` as the
  fallback for anything not yet translated.
- **The domain does not depend on the framework.** Business rules live in a
  package with no dependencies — not on Next.js, React or a database driver — so
  they can be tested in milliseconds and survive a change of either.
- **A place for telemetry later.** The same deployment is designed to expose
  public endpoints (`/api/v1/*`) for access counting across this and other
  projects. Deliberately deferred; the scaffolding exists and holds no code.

Secondary purpose, stated openly: the project is also a demonstration piece.
Clean Architecture, a typed monorepo, a real test pyramid and a documented
delivery plan are part of what it is meant to show.

## Status

**Requirements and design are complete; implementation has not started.** The
folder tree is scaffolding — `.gitkeep` files marking where code will go — and
the workspace, TypeScript config, Docker Compose file and CI pipeline are in
place. Nothing renders yet.

Next up is [Phase 1 — backend data layer](docs/roadmap.md#phase-1--backend-data-layer):
schema, migration runner, repositories and seed. Phase-by-phase state lives in
[docs/roadmap.md](docs/roadmap.md).

> **The prototype.** The requirements are derived from a static prototype, which
> the documentation treats as the functional specification for v1. It is not
> tracked in this repository; it is published at
> **[the prototype](https://claude.ai/public/artifacts/4374a464-6647-49d7-9140-050f767c3d3a)**.
> Its content — skills, projects, timeline entries, dates — is illustrative
> placeholder, not real history; what it specifies is behaviour and appearance.
> Where it and [docs/requirements.md](docs/requirements.md) disagree, the
> requirement wins; those cases are recorded in
> [Open against the prototype](docs/requirements.md#open-against-the-prototype).

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15, App Router |
| UI | React 19 |
| Language | TypeScript 5.6, `strict` |
| Database | PostgreSQL 16+ |
| Package manager | pnpm 9 workspaces |
| Tests | Vitest, Testing Library, Playwright |
| Hosting | Vercel (one project, root `apps/web`) |

Rationale for each choice — and the Server/Client Component split that follows
from it — is in [docs/architecture/stack.md](docs/architecture/stack.md).

## Layout

One deployable, three packages:

```
apps/
└── web/            Next.js — pages (v1) + public endpoints (Phase 6)
packages/
├── core/           Domain + application. No dependencies, framework-free.
├── db/             Portfolio persistence: migrations, mappers, repositories
└── telemetry/      Access counting and audit — self-contained, deferred
docs/               Requirements, roadmap, architecture, data model
```

Dependencies point inward: `web` → `core` ← `db`. `core` knows nothing about
either. `@portfolio/telemetry` is intentionally not yet a dependency of
`apps/web`. Details in
[docs/architecture/monorepo.md](docs/architecture/monorepo.md) and
[docs/architecture/clean-architecture.md](docs/architecture/clean-architecture.md).

## Getting started

Requires Node 20+, pnpm 9, and Docker (for a local PostgreSQL).

```bash
pnpm install
```

```bash
cp .env.example .env
```

```bash
docker compose up -d postgres
```

The Compose service starts PostgreSQL 16 on port 5432 with user, password and
database all set to `portfolio`, so a local `DATABASE_URL` is
`postgres://portfolio:portfolio@localhost:5432/portfolio`.

```bash
pnpm db:migrate && pnpm db:seed
```

```bash
pnpm dev
```

Migrations, seed and the dev server only become meaningful from Phase 1 onward —
today `pnpm db:migrate` points at a runner that has not been written yet.

### Environment variables

Copy [`.env.example`](.env.example) and fill it in:

| Variable | Used by | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `apps/web` via `@portfolio/db` | Portfolio content |
| `TELEMETRY_DATABASE_URL` | `@portfolio/telemetry` | Phase 6 only |
| `TELEMETRY_ALLOWED_ORIGINS` | Telemetry endpoint | Comma-separated origins |
| `TEST_DATABASE_URL` | Integration tests | No default on purpose — unset must fail the run, not silently target a reachable database |

## Scripts

| Command | Does |
| --- | --- |
| `pnpm dev` | Next.js dev server for `apps/web` |
| `pnpm build` | Build every workspace package |
| `pnpm typecheck` | `tsc --noEmit` across the workspace |
| `pnpm test` | Unit + component tests (`core`, `web`) — no database |
| `pnpm test:watch` | The same suites in watch mode |
| `pnpm test:integration` | Repository and migration tests against a real PostgreSQL (`db`) |
| `pnpm test:e2e` | Playwright journeys |
| `pnpm db:migrate` | Forward-only, idempotent migrations |
| `pnpm db:seed` | Load the portfolio's content |

## Testing

Four levels, each owned by the layer it belongs to: unit tests over domain
invariants and use cases (in-memory fakes, no database), integration tests over
repositories and constraints (real PostgreSQL), component tests over rendering
and accessibility, and end-to-end journeys in a browser.

Testing is not a phase — every phase closes on its own tests. Levels, tooling
and per-phase expectations: [docs/testing.md](docs/testing.md).

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs typecheck, unit,
integration and build on every push and pull request, with PostgreSQL as a
service container.

## Documentation

| Document | Purpose |
| --- | --- |
| [docs/README.md](docs/README.md) | Documentation index and v1 scope |
| [docs/requirements.md](docs/requirements.md) | What v1 must do, what it explicitly will not, and what is still open against the prototype |
| [docs/roadmap.md](docs/roadmap.md) | Phases, deliverables, exit criteria, current status |
| [docs/sprints/sprint-01.md](docs/sprints/sprint-01.md) | Sprint 1 — tasks, acceptance criteria, definition of done |
| [docs/testing.md](docs/testing.md) | Test levels, tooling, database setup, CI |
| [docs/domain/data-model.md](docs/domain/data-model.md) | 6 tables, 2 enums, columns, conventions |
| [docs/architecture/clean-architecture.md](docs/architecture/clean-architecture.md) | Layer boundaries, aggregates, ports |
| [docs/architecture/stack.md](docs/architecture/stack.md) | Framework choices, server vs client components, rendering |
| [docs/architecture/monorepo.md](docs/architecture/monorepo.md) | Workspace layout, deployment, dependency graph |

If the implementation ever diverges from these documents, the document is
updated and the divergence recorded — a document that no longer matches the code
is worse than no document.
