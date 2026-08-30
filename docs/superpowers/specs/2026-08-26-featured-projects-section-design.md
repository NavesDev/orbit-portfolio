# Featured projects section with detail view — design

Issue: [#6](https://github.com/NavesDev/orbit-portfolio/issues/6) · Roadmap 3.5 · Sprint 1, task 5
Covers FR-05–FR-10, NFR-05, NFR-13. Resolves U-5 and U-6 from
`docs/sprints/sprint-01.md`.

## Resolved uncertainties

**U-5 — per-project decorative visual.** Stored in the database, not derived
from `category`. `projects` gets a new nullable column, `visual_svg text`,
holding sanitized inline SVG — same shape as `social_links.icon_svg`, reusing
the `IconSvg` value object rather than introducing a second sanitizer. The
whitelist gains one attribute, `class`, whose value is checked token-by-token
against a fixed set of animation names (`ALLOWED_ANIMATION_CLASSES`). The
animations themselves — the `@keyframes` — live in `apps/web`, in a plain
(non-module) stylesheet imported once by the projects section, so a class named
in stored markup resolves to a real animation without the database knowing what
that animation looks like. This keeps the security boundary where it already
lives (`IconSvg`) and keeps the animation itself, a purely visual decision, out
of the domain layer.

**U-6 — the eyebrow ordinal.** Derived at render time from position in the
already-sorted list (`String(index + 1).padStart(2, '0')`), never stored.
`category` holds only the category text, in both locales, with no leading
number — reordering `projects.sort_order` changes the ordinal for free, in
both locales, with no copy edit.

## Domain (`@portfolio/core`)

New value objects, mirroring `IconSvg`'s shape (a private constructor, a
`create` that throws a typed `Invalid*Error` on the first violation, no setters):

- **`Slug`** — `varchar(120)`, lowercase, digits and hyphens, no leading,
  trailing or doubled hyphen. Rejects anything else. This is the first VO to
  own this rule; `SocialLink` has no slug.
- **`Url`** — the generic URL check `social-link.ts`'s docstring predicted a
  third call site would justify. `https:` only (no `mailto:` — nothing about a
  project points at an e-mail address), absolute, within `varchar(2048)`.
  `SocialLink` keeps its own inline check unchanged; pulling it onto `Url` now
  would touch a slice this issue does not.
- **`DateRange`** — `startedOn: string | null`, `endedOn: string | null`, ISO
  `YYYY-MM-DD`. Rejects `endedOn` before `startedOn` when both are present.
  Both nullable independently, matching the nullable `started_on`/`ended_on`
  columns.
- **`ProgressPercent`** — wraps `number | null`, rejects outside `0–100` or a
  non-integer.

Extended:

- **`IconSvg`** — `ALLOWED_ATTRIBUTES` gains `class`; a new constant,
  `ALLOWED_ANIMATION_CLASSES` (`orbit-pulse`, `orbit-draw`, `orbit-drift`, `orbit-spin`),
  lists the only values a `class` attribute may hold, one or more
  space-separated. The scanner's attribute-value branch checks `class`
  specifically against this set instead of the scheme denylist every other
  attribute goes through — a `class` is not a URL, so the scheme check does not
  apply to it and never has.

New entity — `Project`, following `SocialLink`'s shape:

```
id, slug: Slug, title: LocalizedText, category: LocalizedText | null,
description: LocalizedText | null, tags: LocalizedTagList | null,
repoUrl: Url | null, liveUrl: Url | null, progress: ProgressPercent,
period: DateRange, visualSvg: IconSvg | null,
isFeatured: boolean, isPublished: boolean, sortOrder: number
```

`LocalizedTagList` is a small value object beside `LocalizedText` — same
locale/budget/fallback shape, but over `string[]` per locale (mirrors
`is_localized_array`). It is not a generalization of `LocalizedText` into
"localized anything": the two are validated differently enough (item count cap,
per-item length) that one class branching on a type parameter would be harder
to read than two short classes.

## Application (`@portfolio/core`)

- **`ProjectRepository`** port: `listFeatured(limit: number): Promise<Project[]>`.
  No locale — same rule as `SocialLinkRepository`: a repository returns
  entities holding full `LocalizedText`, the use case resolves the language.
- **`ListFeaturedProjects`** use case: `execute(locale: Locale, limit: number)`.
  Filters to `isPublished`, sorts `sortOrder` ASC then `startedOn` DESC (mirrors
  the repository's own `ORDER BY`, same reasoning as `ListSocialLinks`), takes
  `limit`, and maps to `ProjectCardView[]`. The ordinal is **not** computed
  here — it is a rendering concern (U-6), computed by the component from array
  position, so the DTO carries no ordinal field to keep in sync with anything.
- **DTOs** — two, not one, because the card and the modal need different data
  and a Client Component must receive only resolved strings (NFR-13):
  - `ProjectCardView`: `slug, title, category, tags: string[], progressPercent: number | null, visualSvg: string | null`.
  - `ProjectDetailView`: everything in `ProjectCardView` plus `description, repoUrl, liveUrl, skills: ProjectSkillView[]`.
  - `ProjectSkillView`: `{ name: string, usageNote: string | null }` — reads
    `project_skill.usage_note` joined to `skills.name`, resolved to the
    requested locale.

  Both views are produced by `ListFeaturedProjects` in one pass (the modal's
  data is not fetched separately) since Sprint 1 has no `/projetos` route yet
  and the home page is the only place a project is read — a second use case
  would have no second caller.

## Persistence (`@portfolio/db`)

- **Migration `010_projects_visual.sql`** — forward-only, adds
  `visual_svg text` to `projects`; no `CHECK` at the SQL layer beyond what
  already exists for text columns, since sanitization is `IconSvg`'s job and
  the second line of defense here would just be "is this a string", which
  `text` already guarantees. (`data-model.md` gets this column documented in
  the same PR — the sprint's own rule: the document changes with the code that
  makes it true.)
- **`PostgresProjectRepository`** + **`project.mapper.ts`**, same shape as the
  social-link pair: `listFeatured` runs one query joining `project_skill` and
  `skills` (the query `data-model.md § 5` already documents, minus the
  `timeline_entry_skill` half), grouping rows in the mapper into one `Project`
  per `id` with its skills attached. `visual_svg` passes through
  `IconSvg.create` on read, same as `icon_svg` does today — a row edited by
  hand into carrying something outside the whitelist fails at the boundary, not
  in the browser.
- **Seed** — `packages/db/src/seed/data.ts`'s `SeedProject` gains an optional
  `visualSvg: string | null`; `projects.strategy.ts` writes it. The three
  projects already seeded (`orbit-portfolio` and the other two real ones) each
  get a small authored SVG with one or two `class="orbit-*"` elements, so the
  section is not empty of visuals-with-animation in dev.

## Presentation (`apps/web`)

- **`apps/web/src/lib/projects/projects-provider.ts`** — composition root for
  this slice, same role as `social-links-provider.ts`: the only module
  importing both `ListFeaturedProjects` and `PostgresProjectRepository`.
- **`components/projects/projects-section.tsx`** — Server Component. Reads
  `content.projects` (new key in `SiteContent`: kicker, heading, "see all"
  link text, modal labels) and the resolved `ProjectCardView[]` /
  `ProjectDetailView[]` (kept together, indexed by `slug`, so the client modal
  doesn't refetch). Renders the section heading, one `ProjectCard` per item,
  and the "see all projects" link to `/${locale}/projetos` — a plain `<a>`,
  since that route does not exist yet in this sprint; nothing here requires it
  to resolve.
- **`components/projects/project-card.tsx`** — Server Component (static
  markup: eyebrow, title, tags, repo link). Ordinal computed from `index` in
  its parent's `.map()`, per U-6.
- **`components/projects/progress-bar.tsx`** — `'use client'`. Uses
  `useHasBeenInView` (already built for the stat band) to animate the fill
  width once, on first view (FR-07) — the same "start at rest, animate only as
  an enhancement" shape `StatFigure` uses, respecting `prefers-reduced-motion`.
- **`components/projects/project-modal.tsx`** — `'use client'`. Opened by a
  card's "ver detalhes" button. Closes on `Escape` and returns focus to the
  trigger (NFR-05) — a small `useDialog`-style hook local to this component,
  since there is no shared dialog primitive yet and this is the first modal in
  the codebase; introducing one here is in scope, generalizing it further is
  not. Renders `visualSvg` via `dangerouslySetInnerHTML` — safe specifically
  because the string reaching the client already passed `IconSvg.create` on
  the server and nothing between that call and the client is user input.
- **`components/projects/project-visual.module.css`** — a CSS Module, like
  every other component's styling in `apps/web`, but its selectors for the
  four animation names are wrapped in `:global(...)` — `.orbit-pulse` inside
  `dangerouslySetInnerHTML`'d markup is never run through the module's
  class-hashing, so an unwrapped selector would never match it. Holds the
  `@keyframes` for `orbit-pulse`, `orbit-draw`, `orbit-drift`, `orbit-spin`,
  each disabling itself under `prefers-reduced-motion: reduce` rather than
  freezing mid-frame. Imported by `project-card.tsx`.
- **Content** — `SiteContent.projects` added to `content/types.ts`, filled in
  both `content/en-US/index.ts` and `content/pt-BR/index.ts`.
- **`section-registry.ts`** — gains `PROJECTS_SECTION_ID`, appended to
  `SECTION_IDS` between `hero` and `band`, matching the page order the
  prototype and `roadmap.md` 3.x both lay out (hero → projects → timeline →
  skills → band → closing; this sprint only has hero, projects and band so far).
- **`app/[locale]/page.tsx`** — inserts `<ProjectsSection>` between `<Hero>`
  and `<CloudDrift>`/`<StatBand>`.

## Testing

- **`core`** (unit, no database): `Slug`, `Url`, `DateRange`, `ProgressPercent`,
  `LocalizedTagList` each get a rejection test per violation, following
  `social-link.test.ts`'s `violationOf` helper pattern. `Project.create`
  covers its own required fields. `ListFeaturedProjects` runs against an
  in-memory `FakeProjectRepository` (new, beside
  `__fakes__/fake-social-link-repository.ts`): featured/published filtering,
  sort order, `pt-BR` fallback when a field has no translation, the
  `limit` argument.
- **`db-unit`**: `IconSvg`'s new `class`-attribute branch — accepts a
  whitelisted class, rejects an unlisted one, rejects one token in a
  space-separated list being unlisted. (Lives in `packages/core`, not `db` —
  noted here because it is the test this task adds most directly for U-5.)
- **`db`** (integration): migration `010` is idempotent; a new integration
  test extends `constraints.test.ts` for nothing new at the SQL layer (there is
  no new `CHECK`) but `repositories/project.repository.test.ts` proves
  `listFeatured` excludes unpublished and non-featured rows, orders correctly,
  and reads back a stored `visual_svg` through `IconSvg` successfully for a
  seeded row.
- **`web`** (component, Testing Library, by role/name): `ProjectsSection`
  renders featured/published-shaped view models it's handed (it does not talk
  to the database — the provider does); a card without `repoUrl` omits the
  repo control instead of a dead link (FR-09); the modal opens on click,
  closes on `Escape`, and returns focus to the button that opened it (NFR-05);
  the progress bar's width class is applied only after the mocked
  `IntersectionObserver` fires, matching the stat band's existing test
  approach for `useHasBeenInView`.

## Out of scope (per the issue)

The `/projetos` route and its detail pages. The "see all projects" link points
there without it existing yet — same relationship `ClosingSection` already has
with `mailto:`, a link to a destination built in a later task.
