# Personal Portfolio — Documentation

Content model and delivery plan for the personal portfolio of Davi Naves,
derived from a static prototype and promoted into a persisted, layered
application.

The prototype is the functional specification for v1 and is published at
[claude.ai/public/artifacts/4374a464…](https://claude.ai/public/artifacts/4374a464-6647-49d7-9140-050f767c3d3a).
Its data is illustrative placeholder; what it specifies is behaviour and
appearance. Where it contradicts [requirements.md](requirements.md), the
requirement wins — see
[Open against the prototype](requirements.md#open-against-the-prototype).

## Index

| Document | Purpose |
| --- | --- |
| [requirements.md](requirements.md) | What v1 must do, what it explicitly will not, and what is still open against the prototype |
| [roadmap.md](roadmap.md) | Phases, deliverables, exit criteria, current status |
| [sprints/sprint-01.md](sprints/sprint-01.md) | Sprint 1 — bilingual home page on persisted content |
| [testing.md](testing.md) | Test levels, tooling, database setup, CI |
| [domain/data-model.md](domain/data-model.md) | Entities, tables, columns, enums, conventions |
| [architecture/clean-architecture.md](architecture/clean-architecture.md) | Layer boundaries, aggregates, ports |
| [architecture/stack.md](architecture/stack.md) | Next.js, React, server vs client components, rendering |
| [architecture/monorepo.md](architecture/monorepo.md) | Workspace layout, deployment, dependency graph |

**Current stage:** requirements and design complete. Implementation starts at
[Phase 1 — backend data layer](roadmap.md#phase-1--backend-data-layer).

## Scope of v1

The home page, every backend feature behind it, and its subpages.

1. **Projects** — portfolio work, its tags, links and applied skills.
2. **Timeline** — professional experience, academic background and
   certifications, in a single table discriminated by `kind`.
3. **Skills** — the taxonomy shared by projects and timeline entries.
4. **Social links** — footer contacts, including e-mail.

**Bilingual** — `en-US` and `pt-BR`. The visitor's browser language decides which
they get; `en-US` is the fallback for any field not yet translated.

**6 tables, 2 enums.** The model is deliberately minimal: anything that only
changes when the page is redesigned is static content in the front end, not a
row in the database.

## Deferred

**Telemetry** — access counting and audit endpoints for this and other projects.
Scaffolding exists (`packages/telemetry/`, `apps/web/src/app/api/v1/`,
`proxy.ts`) but holds no code. It needs its own requirements and design
pass before implementation; see [roadmap.md](roadmap.md#phase-6--telemetry-deferred).

## Not persisted, by decision

| Content | Where it lives | Why |
| --- | --- | --- |
| Hero headline, tagline, display name | Front end | Fixed copy. Changing it is a redesign, not a data edit. |
| "Years coding" figure | Front end constant | Derived from a fixed start year. |
| Stat band (commits, PRs, coffee) | Front end placeholders | Illustrative until wired to the GitHub API. No table needed to hold fake numbers. |
| Skill orbit colors and ring layout | Front end | Visual decisions, not data. |
| Personal profile (full name, bio, location) | Nowhere | Not rendered by any section of the site. |
| Skill names, organizations, platforms | Database, untranslated | Proper nouns. "Next.js" is "Next.js" in every language. |

Each of these is additive later — none requires remodeling what exists.
