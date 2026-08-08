# Roadmap

Phased delivery, following the software lifecycle. Each phase completes
implementation **and** verification before the next begins — no phase is
"done" because its code exists.

## Scope

**In scope for v1:**

- The home page and every backend feature behind it.
- Its subpages — `/projetos` (full project list) and project deep links.
- The content database: schema, repositories, seed.
- **Bilingual content** — `pt-BR` and `en`, with the visitor's browser language
  choosing between them.

**Out of scope for v1:** telemetry (`/api/v1/events`), an admin interface, and
anything in the extension points of
[domain/data-model.md](domain/data-model.md). The folders exist as scaffolding;
they hold no code until Phase 6.

## Status

| Phase | Stage | State |
| --- | --- | --- |
| 0 | Requirements & design | ✅ Done — this documentation, revised for localization |
| 1 | Backend: data layer | ⬜ Next |
| 2 | Backend: application layer | ⬜ |
| 3 | Frontend: home page | ⬜ |
| 4 | Frontend: subpages | ⬜ |
| 5 | Release | ⬜ |
| 6 | Telemetry | ⬜ Deferred |

---

## Phase 0 — Requirements & design ✅

Complete. Delivered as:

| Artifact | Document |
| --- | --- |
| Content model, tables, conventions | [domain/data-model.md](domain/data-model.md) |
| Layer boundaries, aggregates, ports | [architecture/clean-architecture.md](architecture/clean-architecture.md) |
| Stack and rendering decisions | [architecture/stack.md](architecture/stack.md) |
| Workspace layout, HTTP surface | [architecture/monorepo.md](architecture/monorepo.md) |
| Requirements catalogue | [requirements.md](requirements.md) |
| Test strategy, tooling, CI | [testing.md](testing.md) |

Source of requirements: the
[prototype](https://claude.ai/public/artifacts/4374a464-6647-49d7-9140-050f767c3d3a),
treated as the functional specification for v1. The site must reproduce its
behaviour with the content coming from the database instead of from hardcoded
objects — its own content is illustrative placeholder.

---

## Phase 1 — Backend: data layer

**Goal:** the database exists, is migratable, and returns the prototype's
content.

### Deliverables

| # | Item | Location |
| --- | --- | --- |
| 1.1 | Enum types `skill_category`, `timeline_kind` | `packages/db/src/migrations/` |
| 1.2 | Tables `social_links`, `skills`, `projects`, `timeline_entries` | idem |
| 1.3 | Join tables `project_skill`, `timeline_entry_skill` | idem |
| 1.4 | `is_localized` / `is_localized_array` validation functions | idem |
| 1.5 | Indexes and check constraints per [domain/data-model.md](domain/data-model.md) | idem |
| 1.6 | Migration runner (`pnpm db:migrate`), forward-only, idempotent | `packages/db/src/migrate.ts` |
| 1.7 | Connection pool, single instance, reused across requests | `packages/db/src/client.ts` |
| 1.8 | Seed with the prototype's content, `pt-BR` keys populated | `packages/db/src/seed/` |
| 1.9 | Row ⇄ entity mappers | `packages/db/src/mappers/` |
| 1.10 | Repository implementations of the `core` ports | `packages/db/src/repositories/` |
| 1.11 | CI pipeline: typecheck, unit, integration, build | `.github/workflows/ci.yml` |

### Exit criteria

- `pnpm db:migrate` runs on an empty database and produces the full schema.
- Running it twice changes nothing.
- `pnpm db:seed` runs clean against the migrated schema, populates all six
  tables including the `usage_note` rows on both join tables, and is
  re-runnable. **No row count is an exit criterion** — the prototype's content
  is illustrative placeholder and the real content replaces it later. See
  [Seed data](domain/data-model.md#seed-data-from-the-prototype).
- Integration tests pass against a real PostgreSQL: every repository method,
  plus the constraints that should reject bad data (`progress_percent = 150`,
  `ended_on` before `started_on`, a `title` over its length budget, an unknown
  locale key, a localized column missing `pt-BR`).
- No file in `packages/db` is imported by anything except `packages/core` types.

---

## Phase 2 — Backend: application layer

**Goal:** every question the pages will ask has an answer, testable without a
database.

### Use cases

| Use case | Serves | Returns |
| --- | --- | --- |
| `ListFeaturedProjects(locale, limit)` | Home, projects section | Published + featured, ordered |
| `ListProjects(locale)` | `/projetos` | All published |
| `GetProjectBySlug(slug, locale)` | Project deep link | One project, or not found |
| `GetTimeline(locale, { featuredOnly })` | Home, timeline section | Entries with their skills |
| `GetSkillGraph(locale)` | Home, skills orbit | Skills grouped by category |
| `GetSkillUsage(skillId, locale)` | Skill modal | Union of project and timeline usage notes |
| `ListSocialLinks()` | Footer | Published, ordered. No locale — nothing here is translated. |

### Deliverables

| # | Item | Location |
| --- | --- | --- |
| 2.1 | Domain entities, value objects, enums | `packages/core/src/domain/` |
| 2.2 | `Slug`, `DateRange`, `Url`, `ProgressPercent`, `IconSvg`, `LocalizedText` with validation | `packages/core/src/domain/value-objects/` |
| 2.3 | Repository ports | `packages/core/src/application/ports/` |
| 2.4 | The seven use cases above | `packages/core/src/application/use-cases/` |
| 2.5 | Output DTOs — serializable, locale already resolved to `string` | `packages/core/src/application/dto/` |
| 2.6 | In-memory port fakes for testing | `packages/core/src/application/ports/__fakes__/` |

### Exit criteria

- Unit tests cover every use case against the in-memory fakes; no database
  involved and no test is slower than a millisecond.
- `IconSvg` rejects `<script>`, `on*` attributes and non-whitelisted tags — with
  a test per rejection.
- `DateRange` rejects `ended_on < started_on`.
- `LocalizedText` rejects text over the field's budget, unknown locale keys, and
  a missing `pt-BR` entry — one test per rule (NFR-10, NFR-11).
- Fallback is tested where it matters: asking for `en` on a field that has only
  `pt-BR` returns the Portuguese text, not an empty string (FR-34).
- `packages/core` imports nothing from `db`, `web`, React, or a driver.
  Verified by inspecting its `package.json`: it has no dependencies.

---

## Phase 3 — Frontend: home page

**Goal:** the prototype's home page, rendered from the database.

Ported section by section, each one working before the next starts. Order
chosen so that something is visible early and the hardest piece is not last:

| # | Section | Notes |
| --- | --- | --- |
| 3.1 | Layout, tokens, global styles, `[locale]` segment | `tokens.css` from the prototype's `:root` |
| 3.2 | Locale negotiation in `middleware.ts` + language switcher | `Accept-Language`, cookie, `pt-BR` fallback |
| 3.3 | Hero (server) + canvas field (client) | First `'use client'` boundary |
| 3.4 | Footer, social links | Smallest end-to-end slice: database → page |
| 3.5 | Projects section + cards | Data-driven, with modal |
| 3.6 | Timeline + spine fill + expand toggle | |
| 3.7 | Skills orbit + skill modal | Canvas, hit testing, `GetSkillUsage` |
| 3.8 | Stat band | Static values from `content/stats.ts` |
| 3.9 | Scroll behaviours consolidated into one hook | Replaces the prototype's four listeners |

### Exit criteria

- Every section renders content from the database, not from a literal.
- Both locales render; a visitor with an English browser lands on `/en` and one
  with a Portuguese browser on `/pt-BR` (FR-30).
- An unsupported browser language lands on `/pt-BR` (FR-31).
- The switcher's choice survives closing the tab (FR-33).
- The `/` redirect is not cached across visitors (NFR-12).
- Static content exists in both `content/pt-BR/` and `content/en/`.
- No Client Component imports `@portfolio/db`. Verified by inspecting the
  client bundle for the driver.
- Responsive at 380 px, 760 px and desktop — the prototype's breakpoints.
- Keyboard: modals close on `Escape` and return focus to the trigger.
- Canvas animations stop on unmount; no leaked `requestAnimationFrame` loop.
- Lighthouse accessibility ≥ 95; every icon-only link has an accessible name.

---

## Phase 4 — Frontend: subpages

| # | Route | Content |
| --- | --- | --- |
| 4.1 | `/[locale]/projetos` | All published projects, `ListProjects(locale)` |
| 4.2 | `/[locale]/projetos/[slug]` | Deep link to one project — the modal's content as a page |
| 4.3 | `not-found.tsx` | Unknown slug, in the requested locale |

### Exit criteria

- "Ver todos os projetos" navigates to `/projetos`.
- A project is reachable and shareable by URL, not only through the modal.
- An unpublished or unknown slug returns 404, not an empty page.
- The same `slug` resolves in both locales (FR-36).

---

## Phase 5 — Release

| # | Item |
| --- | --- |
| 5.1 | Provision PostgreSQL, run migrations and seed against it |
| 5.2 | Vercel project, root directory `apps/web`, environment variables set |
| 5.3 | `revalidate = 3600` confirmed in production |
| 5.4 | Custom domain, HTTPS |
| 5.5 | Verify against the prototype: every section behaves the same |

### Exit criteria

The deployed site is indistinguishable from the prototype in behaviour, and its
content changes when a database row changes.

---

## Phase 6 — Telemetry (deferred)

Not started. Requires its own requirements and design pass before any code —
the same lifecycle as Phase 0, not an implementation task.

Open questions, from [architecture/monorepo.md](architecture/monorepo.md):

- **Schema** — events, client projects, sessions.
- **Authentication** — a key shipped to a browser is public. Origin allowlisting
  is the realistic control for browser clients; a secret key is reserved for
  server-to-server callers.
- **Retention** — audit data grows without bound unless a policy says otherwise.
- **Validation** — one endpoint with a `type` discriminator means the route
  cannot reject a malformed body on shape alone; a per-`type` schema has to
  fail loudly at the boundary.

Scaffolding that exists but is empty: `packages/telemetry/`,
`apps/web/src/app/api/v1/`, `apps/web/src/middleware.ts`. `@portfolio/telemetry`
is deliberately **not** a dependency of `apps/web` until Phase 6 — an empty
package in the dependency graph breaks the build for no benefit.

---

## Definition of done

A phase is complete when all of these hold, not when the code runs:

1. Deliverables implemented.
2. Tests written and passing, at the levels [testing.md](testing.md) assigns to
   the phase, with CI green.
3. Exit criteria verified, by execution rather than by reading.
4. Documentation updated where the implementation diverged from the design —
   the divergence is recorded, not silently accepted.
5. No `TODO` left that a later phase does not explicitly own.

## Testing

Not a phase. Each phase ships its own tests and closes on them —
see [testing.md](testing.md) for levels, tooling and per-phase expectations.

| Phase | Level that gates it |
| --- | --- |
| 1 | Integration, against a real PostgreSQL |
| 2 | Unit, against in-memory fakes |
| 3 | Component, plus accessibility |
| 4 | Component and end-to-end |
| 5 | End-to-end against the preview deployment |

## Working rule

Phases are sequential because each depends on the previous: use cases need
ports, pages need use cases. Within a phase, deliverables can be reordered
freely.

If implementation shows a design decision was wrong, the fix is to change the
design document and say so — not to leave the code contradicting the
documentation. A document that no longer matches the code is worse than no
document.
