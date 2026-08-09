# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

The workspace, TypeScript config, Docker Compose and CI are in place; **almost
every source directory is scaffolding held open by `.gitkeep` and contains no
code yet**. Before assuming something exists, check — most of what the README
and `docs/` describe is specification, not implementation.

Requirements and design are complete and normative. `docs/` is written before
code and is the source of truth: when the two disagree, the document wins or the
document gets changed in the same PR.

## Commands

```bash
pnpm install && cp .env.example .env && docker compose up -d postgres
pnpm db:migrate && pnpm db:seed && pnpm dev
```

| Command | Scope |
| --- | --- |
| `pnpm test` | Unit (`core`) + component (`web`). No database — safe on every save. |
| `pnpm test:integration` | `packages/db` against a real PostgreSQL. Needs Docker up and `TEST_DATABASE_URL` set. |
| `pnpm test:e2e` | Playwright in `apps/web/e2e`. Needs a running app. |
| `pnpm typecheck` | `tsc --noEmit` across every package. |
| `pnpm build` | `next build` plus package builds. |

`pnpm test` is deliberately the fast one; keep it dependency-free.

**A single test or file** — Vitest projects are named `core`, `db` and `web`:

```bash
pnpm vitest run --project core -t "rejects an end date before the start date"
pnpm vitest run packages/core/src/domain/value-objects/date-range.test.ts
pnpm --filter @portfolio/web test src/components/hero
```

The root `vitest.workspace.ts` lists all three; `pnpm test` runs only `core` and
`web`, and `pnpm test:integration` runs `db` alone. Running `vitest` from inside
a package uses that package's config directly.

`packages/db` runs with `fileParallelism: false` — integration tests share one
database and would race on schema.

CI (`.github/workflows/ci.yml`) runs, in order: `install --frozen-lockfile`,
`typecheck`, `test`, `test:integration`, `build`. E2E runs against the Vercel
preview, not in CI.

## Architecture

One deployable (`apps/web` on Vercel), three packages, dependencies pointing
inward: `web → core ← db`.

| Package | Holds | May import |
| --- | --- | --- |
| `@portfolio/core` | Domain entities, value objects, enums, errors; application ports, use cases, DTOs | **Nothing.** Zero runtime dependencies, no framework, no driver. |
| `@portfolio/db` | Migrations, repositories, mappers, seed | `core` |
| `@portfolio/web` | Pages, components, static copy, composition root | `core`, `db` |
| `@portfolio/telemetry` | Access counting — self-contained, **deferred to Phase 6** | `core` conventions, nothing else. Deliberately not yet a dependency of `web`. |

`docs/architecture/clean-architecture.md` draws the layer map as one `src/`
tree; in practice Domain + Application live in `packages/core/src/`,
Infrastructure in `packages/db/src/`, Presentation in `apps/web/src/`, and the
composition root in `apps/web/src/lib/`. Same map, split across packages.

**Rules that decide most design questions here:**

- **Ports are declared by the application layer, implemented by infrastructure.**
  Four repositories (`Project`, `Timeline`, `Skill`, `SocialLink`) plus `Clock`.
  Join tables are persisted by the owning aggregate root and never get a
  repository. Skills are referenced by id, never nested inside `Project`.
- **Repositories do not take a `Locale`; use cases do.** A repository returns
  entities holding a full `LocalizedText`; the use case resolves the language
  when building its output DTO. Pushing locale into SQL would spread the
  fallback rule across every query.
- **A `LocalizedText` never crosses into presentation.** Output DTOs carry
  resolved `string`s (NFR-13).
- **Invariants live in the domain, constraints are the second line of defense** —
  `DateRange`, `ProgressPercent`, `Url`, `IconSvg` (SVG sanitization is a
  security boundary), `LocalizedText` (length budget, known locale keys,
  required `pt-BR`). A `CHECK` is not the definition of a rule.
- **Reads and writes have different shapes.** `SkillRepository.findUsage`
  returns a `SkillUsage[]` read model, not entities.

### Next.js specifics

- App Router: Server Components by default. **Data fetching happens in Server
  Components and is passed down as props.** A Client Component receives plain
  serializable data, already resolved to one language.
- **`@portfolio/db` must never be imported from a Client Component** — it would
  leak the driver and connection string into the browser bundle. The boundary is
  `apps/web/src/lib/`.
- Client Components are the interactive pieces only: language switcher, hero
  canvas, skills orbit, modals, scroll handlers.
- Pages are static (`generateStaticParams` over both locales,
  `export const revalidate = 3600`). Route handlers under `/api/v1` are always
  dynamic. The `/` locale redirect must be per-request — a cached one would send
  every later visitor to the first visitor's language.
- Route files stay thin: parse, call a use case, serialize. No portfolio content
  endpoints — `/api/*` exists for *other* projects, not for the site to call
  itself. Cross-cutting concerns (CORS, rate limit) go in `middleware.ts`, which
  already owns locale negotiation.

### Localization

Locales are `pt-BR` and `en`. Two distinct notions of "default": the **UI
language** a visitor gets is their browser's; the **fallback** for an
untranslated field is always `pt-BR`. So an English visitor sees an English page
with Portuguese text in fields not yet translated — never a blank one.

Resolution order: URL `[locale]` segment → `locale` cookie (set by the switcher)
→ `Accept-Language` → `pt-BR`.

Translated columns are `jsonb` keyed by locale. Proper nouns are not translated
(skill names, organizations, platforms), and `slug` stays single across locales
— one project, one canonical URL.

Static copy that is deliberately not persisted lives in `apps/web/src/content/`,
one folder per locale with the same module shape, so a missing translation is a
type error.

### Database

Hand-written SQL, no ORM. Conventions in `docs/domain/data-model.md`: `snake_case`
plural tables, `id uuid` default `gen_random_uuid()`, `created_at`/`updated_at`
everywhere but join tables, `is_published` + `sort_order` on anything listed,
`started_on`/`ended_on` with `NULL` meaning open (no `is_current` flag), native
enums, no soft delete. Default ordering:
`ORDER BY sort_order ASC, started_on DESC NULLS LAST`.

Migrations are **forward-only and idempotent**; never edit one that has run.
Integration tests migrate into a scratch database and drop it. `TEST_DATABASE_URL`
has no default on purpose — unset must fail the run rather than fall back to
whatever database happens to be reachable.

## TypeScript

`tsconfig.base.json` adds `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
and `verbatimModuleSyntax` on top of `strict`. Nullable columns map to `T | null`
in the domain. Packages are consumed straight from source (`main` points at
`src/index.ts`) and transpiled by Next via `transpilePackages`.

## Tests

Each layer owns its level: domain and use cases are unit-tested in `core` against
in-memory port fakes (a fake that is awkward to write means the port leaked a
storage concern); repositories, migrations, constraints and mapper round-trips
are integration-tested in `db`; components are tested with Testing Library
**by role and accessible name, never by CSS class**; six named journeys are
covered by E2E. `docs/testing.md` also records what is deliberately *not* tested
— canvas pixels, scroll animations, visual regression, static content.

## Workflow

`CONTRIBUTING.md` is binding: work starts as a task issue, branches are
`<type>/<issue-number>-<slug>`, commits are Conventional Commits scoped by
package (`feat(db): …`), and **`main` is never committed to directly** — always
branch and open a PR using `.github/PULL_REQUEST_TEMPLATE.md`.

## Agent skills

Thirteen skills are vendored into this repository under `.claude/skills/`, each
pinned to its upstream source and content hash by `skills-lock.json`. They are a
dependency like any other: versioned, reviewed, upgraded on purpose. The four
`next-*` entries are symlinks into `.agents/skills/`, so agents reading either
path get the same single copy.

They are **reference material, not authority.** `docs/`, `CONTRIBUTING.md` and
this file outrank every one of them.

### What is available, and when it applies

| Skill | Reach for it when | Status here |
| --- | --- | --- |
| `vercel-react-best-practices` | Writing or reviewing any React/Next.js code — Server/Client split, data fetching, bundle size | **Active.** The default reference for `apps/web`. |
| `vercel-composition-patterns` | A component grows boolean props, or a reusable API is being designed | **Active.** Relevant once components exist. |
| `vercel-react-view-transitions` | Page transitions, shared-element or enter/exit animation | **Active** for the animated sections the design calls for. |
| `web-design-guidelines` | Reviewing UI code for accessibility and interface quality | **Active.** See the rules below — it runs before a UI PR. |
| `writing-guidelines` | Reviewing prose in `docs/`, `README.md`, static copy | **Active.** Same. |
| `next-dev-loop` | Confirming a change actually behaves in a running app, not just that it type-checks | **Active**, needs `pnpm dev` up. |
| `next-cache-components-adoption` | Enabling Cache Components, the `cacheComponents` flag | **Dormant** — needs Next 16. |
| `next-cache-components-optimizer` | Driving a route to instant navigation under Cache Components / PPR | **Dormant** — needs Next 16.3+. |
| `next-partial-prefetching-adoption` | Enabling Partial Prefetching, `prefetch = 'partial'` | **Dormant** — needs Next 16. |
| `vercel-optimize` | Cutting Vercel cost or fixing an expensive route, from real metrics | **Dormant** — needs a deployed project with traffic. |
| `deploy-to-vercel` | Deploying an app to Vercel | **Restricted.** See rules. |
| `vercel-cli-with-tokens` | Driving the Vercel CLI with an access token | **Restricted.** See rules. |
| `vercel-react-native-skills` | React Native and Expo work | **Not applicable.** There is no mobile target. |

### Rules of use

- **The documents win.** Where a skill contradicts `docs/architecture/`,
  `docs/domain/data-model.md` or `docs/testing.md`, follow the document. If the
  skill is right and the document is wrong, change the document in the same PR —
  that is the process, not a workaround for it.
- **Say which skill shaped the work.** If a skill decided an approach, name it in
  the PR's **Decisions** section. A reviewer should never have to guess where a
  pattern came from.
- **Dormant means dormant.** Do not flip `cacheComponents` or
  `partialPrefetching` on Next 15 to make a skill applicable. Upgrading Next is
  its own task issue with its own PR; a framework upgrade never rides along with
  feature work.
- **Not applicable means skip it.** `vercel-react-native-skills` has no target in
  this repository. Do not generalize its advice to the web app.
- **Agents do not deploy.** Production and previews come from Git through the
  Vercel integration. `deploy-to-vercel` and `vercel-cli-with-tokens` are for a
  human running the CLI deliberately — an agent session must not deploy, create
  projects, or set environment variables. **Never write a token into a file, a
  commit or a command that gets logged.**
- **Review skills produce review, not commits.** `web-design-guidelines` and
  `writing-guidelines` return findings. Read them, decide, apply what is right.
  Applying a batch of suggestions wholesale is how unrelated churn lands in a
  diff — and "nothing unrelated is in this diff" is a checklist item.
  Run `web-design-guidelines` before opening a PR that touches components, and
  `writing-guidelines` before one that touches `docs/`, `README.md` or
  `apps/web/src/content/`.
- **Verify behaviour, don't assume it.** `pnpm typecheck` passing is not evidence
  a page works. For a change with runtime behaviour, use `next-dev-loop` against
  a running app, then write down in the PR what was actually checked.
- **Never hand-edit a vendored skill.** `skills-lock.json` pins each one by
  content hash; editing the files in place makes the hash lie. Upgrade from
  upstream and commit the new bodies and the new lock together.
- **Adding, removing or upgrading a skill is a `chore` task** with its own issue
  and PR, never smuggled in alongside a feature.
