# Monorepo Layout

pnpm workspaces. **One deployable**, three shared packages.

```
.
├── apps/
│   └── web/                    Next.js: pages + public endpoints  → one Vercel project
├── packages/
│   ├── core/                   Portfolio domain + application (framework-free)
│   ├── db/                     Portfolio persistence: migrations, repositories
│   ├── infra/                  Adapters to systems we do not run (GitHub)
│   └── telemetry/              Access counting and audit — self-contained
├── docs/
├── package.json                Workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .env.example
```

> **Implementation status.** Only the pages are in scope for v1. Everything
> below describing `/api/v1` and `@portfolio/telemetry` is design for
> [Phase 6](../roadmap.md#phase-6--telemetry-deferred); those folders exist as
> scaffolding and hold no code. `@portfolio/telemetry` is deliberately not a
> dependency of `apps/web` yet — an empty package in the dependency graph breaks
> the build for no benefit.

## One deployment, two jobs

A single Next.js project on Vercel serves both:

| Surface | Path | Consumer | Phase |
| --- | --- | --- | --- |
| Pages | `/[locale]`, `/[locale]/projetos`, `/[locale]/projetos/[slug]` | Browsers | 3–4 |
| Endpoints | `/api/v1/events`, `/api/v1/health` | The portfolio **and** other projects | 6 |

Route Handlers under `src/app/api/` are ordinary HTTP endpoints — nothing about
living inside the site restricts who may call them. Any project can post
telemetry, provided CORS allows its origin.

**Why not a second Vercel project.** It would buy deploy isolation — a broken
site build would not take the telemetry endpoint down with it. At this scale
that is not worth a second deployment, a second domain and a second set of
environment variables for a service that does not have a schema yet. The
separation that matters is in the code, not in the infrastructure.

**How to split it later, if deploy coupling ever hurts.** Create `apps/api`, have
it import `@portfolio/telemetry`, and move the route file. Nothing inside the
package changes — which is the whole reason the telemetry logic is a package and
not code sitting in a route handler.

## `apps/web`

```
apps/web/
├── next.config.mjs
├── public/
└── src/
    ├── proxy.ts                Locale negotiation (v1) + CORS and rate limit (Phase 6)
    ├── app/
    │   ├── [locale]/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx        Home: hero, projects, timeline, skills, footer
    │   │   └── projetos/
    │   │       ├── page.tsx    Full project list
    │   │       └── [slug]/
    │   │           └── page.tsx
    │   └── api/
    │       └── v1/
    │           ├── events/
    │           │   └── route.ts    Thin: parse, call use case, respond
    │           └── health/
    │               └── route.ts
    ├── components/
    │   ├── hero/               Headline, availability badge, particle field
    │   ├── band/               Stat band — figures, labels, drifting grid
    │   ├── projects/
    │   ├── timeline/
    │   ├── skills/             Orbit canvas + skill modal
    │   ├── footer/
    │   └── ui/
    ├── content/                Static copy, one folder per locale
    │   ├── site.ts             Locale-independent facts — availability, figures
    │   ├── pt-BR/              headline, tagline, stat band labels
    │   └── en-US/
    ├── lib/                    Composition root — reads env, wires adapters into use cases
    └── styles/
```

`content/` holds everything the [README](../README.md) lists as intentionally
not persisted — headline, tagline, years coding, stat band. Typed TypeScript,
not a CMS: changing the hero copy is a commit. One folder per locale, with the
same module shape in each, so a missing translation is a type error rather than
a blank space.

`site.ts` sits beside those folders and holds what is *not* copy: the
availability boolean behind FR-02, the illustrative stat figures, and the month
that `years coding` is counted from. None of it translates, and duplicating it
into each locale would make it possible for the two to disagree about a fact
rather than about a wording.

### The HTTP surface

Three rules for `src/app/api/`:

1. **Route files stay thin.** Parse the request, call a use case, serialize the
   result. A route handler that contains business logic is a route handler that
   cannot be moved to another deployment.
2. **No portfolio content endpoints.** Pages read content directly from Postgres
   in Server Components via `@portfolio/db`. Exposing an HTTP endpoint for the
   site to call itself adds a network hop and a cache layer to solve nothing.
   `/api/*` exists for *other* projects.
3. **Cross-cutting concerns live in `proxy.ts`, not in routes.** CORS
   preflight, origin allowlisting and rate limiting run once, before any handler.
   The proxy itself stays thin: the rules come from
   `@portfolio/telemetry/infrastructure/http`.

   Note that `proxy.ts` already has a v1 job — negotiating the visitor's
   locale on `/` — so its matcher covers both the pages and `/api`, with the two
   concerns kept in separate functions.

### Versioning

Endpoints are versioned from the start — `/api/v1/events`, not `/api/events`.

Once other projects call these endpoints, the request shape is a public
contract: changing it breaks every client at once, and they do not all deploy on
the same day. A version segment costs one folder today and avoids having to
choose between breaking clients and keeping a bad format forever. `v2` ships
alongside `v1` rather than replacing it.

### Why a single `events` endpoint

Counting visits and auditing actions are the same shape of fact: something
happened, in some project, at some time. One endpoint accepts them all, with a
`type` field discriminating:

```json
POST /api/v1/events
{ "project": "portfolio", "type": "page_view", "path": "/projetos" }
{ "project": "outro-app", "type": "login_failed", "actor": "user_42" }
```

A new event type needs no new endpoint and no deployment.

The cost is weaker validation: the payload varies by `type`, so the route cannot
reject a malformed body on shape alone. The application layer compensates with a
per-`type` schema — a mistyped `type` must fail loudly at the boundary, not sit
in the database until a report comes back empty.

## `packages/core`

Portfolio domain and application layers. No framework imports, no database
driver, no React. Structure follows
[clean-architecture.md](clean-architecture.md) §2.

```
packages/core/src/
├── domain/{entities,value-objects,enums,errors}
└── application/{ports,use-cases,dto}
```

## `packages/db`

Infrastructure for the portfolio content — implementations of the ports declared
in `core`. The only package allowed to know the database is PostgreSQL.

```
packages/db/src/
├── migrations/                 Ordered SQL, per data-model.md
├── repositories/               Postgres implementations
├── mappers/                    Row ⇄ entity
└── seed/                       Prototype content as seed rows
```

## `packages/infra`

The `providers/` and `config/` half of the Infrastructure layer: adapters to
systems this project does not run. Sibling to `packages/db`, never imported by
it, and it imports only `@portfolio/core`.

```
packages/infra/src/
├── providers/
│   └── github/                 DeveloperStatsProvider over the search API
└── constants/                  Names of the environment variables read
```

One folder per external system. The package reads no environment itself: the
composition root in `apps/web/src/lib/` reads the variables and passes values
to a constructor, which is what lets the adapter be tested without setting a
secret.

## `packages/telemetry` — Phase 6, empty

Access counting and audit. Not implemented. Self-contained by design: its own domain, application and
infrastructure layers, its own database, its own migrations. It shares nothing
with the portfolio content model — [../domain/data-model.md](../domain/data-model.md)
does not apply to it.

```
packages/telemetry/src/
├── domain/{entities,value-objects,errors}
├── application/{ports,use-cases}
└── infrastructure/
    ├── persistence/{migrations,repositories,mappers}
    └── http/                   CORS, origin allowlist, rate limiting
```

`infrastructure/http/` holds request-level concerns so the route handler in
`apps/web` stays thin and so they survive a future extraction to `apps/api`.

## Dependency graph

```
apps/web  ──▶  packages/db  ──▶  packages/core
    └────────────────────────────────▶

packages/telemetry   (Phase 6 — not yet wired to anything)
```

`core` depends on nothing. `telemetry` will depend on nothing. They do not know
each other exists — `apps/web` is the only place both are named. Enforced by
review, not tooling.

## Deployment

One Vercel project, root directory `apps/web`. Vercel runs `pnpm install` at the
workspace root, so `workspace:*` dependencies resolve without publishing.

| Variable | Used by | Phase |
| --- | --- | --- |
| `DATABASE_URL` | `@portfolio/db` | 1 |
| `TELEMETRY_DATABASE_URL` | `@portfolio/telemetry` | 6 |
| `TELEMETRY_ALLOWED_ORIGINS` | `@portfolio/telemetry` HTTP layer | 6 |

## Commands

```bash
pnpm install
pnpm dev                  # site at localhost:3000
pnpm db:migrate
pnpm db:seed
pnpm typecheck
pnpm test
```

## Not yet specified

The telemetry schema — events, client projects, sessions, retention — is a
separate design pass, tracked as [Phase 6](../roadmap.md#phase-6--telemetry-deferred).
Open questions are recorded there.
