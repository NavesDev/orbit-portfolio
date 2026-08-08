# Sprint 1 — Bilingual home page on persisted content

Derived exclusively from [requirements.md](../requirements.md),
[roadmap.md](../roadmap.md), [domain/data-model.md](../domain/data-model.md),
[architecture/clean-architecture.md](../architecture/clean-architecture.md),
[architecture/stack.md](../architecture/stack.md),
[architecture/monorepo.md](../architecture/monorepo.md) and
[testing.md](../testing.md).

## How this sprint relates to the roadmap phases

The roadmap is organized in horizontal phases (data layer → application layer →
pages). This sprint keeps that dependency order **inside each task** rather than
between tasks: task 1 delivers the schema backbone every slice shares, and each
task after it carries its own port, repository, use case and rendered section —
a vertical slice, top to bottom. The roadmap's working rule ("use cases need
ports, pages need use cases") is respected within every slice; what changes is
that a slice closes end-to-end instead of a whole layer closing at once.

Sprint 1 covers Phase 1, Phase 2 and roadmap items 3.1–3.6, **except** the
skills orbit and skill-usage modal (3.7). Phase 4 (subpages), Phase 5 (release)
and Phase 6 (telemetry) are out of this sprint.

## Sprint Objective

At the end of the sprint, `pnpm dev` serves a home page at `/pt-BR` and `/en`
whose hero, project cards, timeline and footer are rendered from PostgreSQL
rows, not from literals. A visitor landing on `/` is sent to the language their
browser asks for, can switch language, and that choice survives closing the tab.
Changing a database row changes the page.

The skills section and the `/projetos` subpages are deliberately not in this
sprint — the skills orbit is the hardest interactive piece and the subpages have
no value until the project data behind them renders.

## Sprint Tasks

### 1. Persisted portfolio content — schema, migrations and seed

- **Description:** Deliver the content database described in
  [data-model.md](../domain/data-model.md): the `skill_category` and
  `timeline_kind` enums, the six tables, the `is_localized` /
  `is_localized_array` validation functions, and every index and check
  constraint listed there, created in the documented migration order. Includes a
  forward-only idempotent migration runner (`pnpm db:migrate`), a single reused
  connection pool, and a seed (`pnpm db:seed`) carrying the prototype's content
  with `pt-BR` keys populated. Also wires the CI pipeline
  (`.github/workflows/ci.yml`) to run typecheck, unit, integration and build, as
  [testing.md](../testing.md) specifies. Roadmap deliverables 1.1–1.8, 1.11.
- **Expected outcome:** An empty PostgreSQL can be brought to the full schema and
  populated with content by two commands. Every later task in this sprint reads
  from it instead of from a fixture.
- **Acceptance criteria:**
  - `pnpm db:migrate` on an empty database produces the full schema; running it
    a second time changes nothing.
  - `pnpm db:seed` runs clean against the migrated schema, populates all six
    tables including the `usage_note` rows on both join tables, and is
    re-runnable. **No criterion fixes the row counts or the content itself** —
    the prototype's data is illustrative placeholder, and the real values come
    from the author's own history in a later pass (see U-1).
  - Integration tests prove the constraints reject what they should:
    `progress_percent = 150`, `ended_on` before `started_on`, duplicate `slug`,
    deleting a skill still referenced by a project, a localized value over its
    length budget, an unknown locale key, a localized column missing `pt-BR`
    (NFR-10, NFR-11).
  - Every localized column is `jsonb` guarded by `is_localized` with the
    documented length budget; `projects.tags` by `is_localized_array`.
  - CI is green on the pipeline's five steps.

### 2. Bilingual site shell — locale routing, negotiation and switcher

- **Description:** Make every page addressable per locale under the `[locale]`
  segment and make the language a visitor's own choice. `middleware.ts`
  negotiates `Accept-Language` on `/` only and redirects to the matching prefix,
  falling back to `pt-BR` for an unsupported language; a `locale` cookie written
  by the language switcher outranks the header. Includes the `LocalizedText`
  value object with its fallback rule and the `Locale` enum in
  `packages/core`, the layout, `tokens.css` and global styles (roadmap 3.1–3.2),
  and the `content/pt-BR/` + `content/en/` folders with the same module shape so
  a missing translation is a type error. Also carries the site chrome the
  prototype has around every section — the fixed nav with its section index, the
  scroll progress bar and the scroll-driven marquee strip — which no `FR` names
  but which the prototype, as the functional specification, does (see U-2).
  Covers FR-29–FR-34, NFR-12, NFR-14.
- **Expected outcome:** `/pt-BR` and `/en` both render the layout shell, `/`
  resolves per visitor, and the switcher's choice persists across visits.
- **Acceptance criteria:**
  - A request to `/` with an English `Accept-Language` lands on `/en`; with a
    Portuguese one, on `/pt-BR`; with an unsupported language, on `/pt-BR`
    (FR-30, FR-31).
  - The switcher's choice survives closing the tab and outranks the header on
    the next visit to `/` (FR-33).
  - The `/` redirect is not cached across visitors (NFR-12); the destination
    pages are static with `revalidate = 3600` (NFR-01).
  - `Accept-Language` is read to pick a language and never stored (NFR-14).
  - Unit tests: `LocalizedText` rejects over-budget text, unknown locale keys and
    a missing `pt-BR` entry, and resolving `en` on a field that has only `pt-BR`
    returns the Portuguese text (FR-34).
  - Layout works at 380 px, 760 px and desktop (NFR-04).

### 3. Hero and stat band from static content

- **Description:** The hero — headline with one emphasized fragment and an
  availability badge whose text is derived from a boolean rather than free text
  — rendered as a Server Component from `content/[locale]/`, plus the stat band
  with its figures animating once on first view and labelled as illustrative.
  The interactive particle field ships in this task rather than conditionally:
  the prototype implements it as a connected-network canvas with spring return
  and pointer repulsion, so FR-03 is a port, not a design problem. It becomes a
  `'use client'` component whose `requestAnimationFrame` loop is cancelled on
  unmount — the prototype never cancels its own, which is precisely what FR-04
  corrects. The pt-BR copy for the illustrative label already exists in the
  prototype's stat band; only its `en` translation is new. Roadmap 3.3 and 3.8;
  covers FR-01, FR-02, FR-03, FR-04, FR-21, FR-22.
- **Expected outcome:** The top of the home page is visibly complete in both
  locales — the first thing a visitor sees renders correctly before any
  data-driven section exists.
- **Acceptance criteria:**
  - Headline and badge render in both locales from `content/`, with the badge
    text switching on a boolean.
  - Stat figures animate once when first scrolled into view and carry a visible
    label marking them illustrative (FR-22).
  - The particle field reacts to pointer position, settles back to rest, and
    leaks no `requestAnimationFrame` loop after unmount (FR-03, FR-04) —
    verified by a component test asserting cancellation, not by pixel output.
  - No Client Component in this section imports `@portfolio/db` (NFR-02).

### 4. Closing section and social links, database to page

- **Description:** The smallest complete slice through every layer: the
  `SocialLink` entity with the `IconSvg` value object, the `SocialLinkRepository`
  port, its Postgres implementation and mapper, the `ListSocialLinks` use case
  (no locale — nothing here is translated), and the rendered footer. `icon_svg`
  is inlined at render time so it inherits `currentColor`, and each icon-only
  anchor takes its accessible name from `platform`. The prototype's footer uses
  two-letter text labels as placeholders, so the icons themselves are authored
  in this task and must pass `IconSvg` — a whitelisted `svg`/`path`/`circle`
  set drawn with `stroke="currentColor"`. Also carries the closing section that
  contains those links (the prototype's CTA: headline and the e-mail call to
  action, per WN-04), whose copy lives in `content/[locale]/` and which no `FR`
  names (see U-2). Roadmap 3.4; covers FR-23, FR-24, NFR-07.
- **Expected outcome:** The closing section renders and its links come from
  `social_links` rows in `sort_order`; adding a row adds a link without a code
  change — the first
  proof the whole content pipeline works.
- **Acceptance criteria:**
  - Only published links render, ordered by `sort_order`.
  - Each link exposes an accessible name derived from `platform` (FR-24);
    component queries find them by role and name, not by CSS class.
  - `IconSvg` rejects `<script>`, `on*` attributes and non-whitelisted tags, one
    unit test per rejection (NFR-07).
  - Icons inherit the link's hover colour through `currentColor`.

### 5. Featured projects section with detail view

- **Description:** The `Project` aggregate (`Slug`, `DateRange`, `Url`,
  `ProgressPercent`), the `ProjectRepository` port with its Postgres
  implementation, the `ListFeaturedProjects(locale, limit)` use case returning
  DTOs with the locale already resolved, and the rendered section: cards showing
  title, category, tags and a progress bar, opening a client-side modal with
  description, tags and applied skills, and linking to `repo_url` when present.
  Includes the "see all projects" link to the project list in the current locale
  — the `/projetos` route itself belongs to a later sprint. Roadmap 3.5; covers
  FR-05–FR-10, NFR-05, NFR-13.
- **Expected outcome:** The home page's centrepiece renders real projects in both
  locales, with the detail interaction working by pointer and keyboard.
- **Acceptance criteria:**
  - Featured, published projects only, ordered by `sort_order` then
    `started_on` descending (FR-05); unpublished content is unreachable (FR-28).
  - The progress bar animates once, when the card enters the viewport (FR-07).
  - A project without `repo_url` omits the control rather than rendering a dead
    link (FR-09).
  - The modal closes on `Escape` and returns focus to the trigger (NFR-05).
  - Client Components receive resolved `string`s, never `LocalizedText` or raw
    `jsonb` (NFR-13).
  - A field with no `en` translation renders its `pt-BR` text, not an empty node.
  - Unit tests run the use case against in-memory fakes with no database.

### 6. Timeline section with featured/full toggle

- **Description:** The `TimelineEntry` entity discriminated by `kind`, its
  repository port and Postgres implementation, the
  `GetTimeline(locale, { featuredOnly })` use case, the `Clock` port that makes
  "ongoing" testable, and the rendered timeline: entries in `started_on`
  descending order showing kind, period, title, organization and skills, with
  featured entries shown by default and the rest revealed on demand. An entry
  with no `ended_on` is worded per `kind` and per locale. The scroll-driven
  spine fill ships too — the prototype implements it, so FR-15 is a port.

  **The prototype's ordering is not authoritative here.** It renders oldest
  first, which puts the featured entries at the bottom and makes the expand
  control reveal items *above* it. FR-11 is the requirement and it is right: the
  most recent experience comes first. The consequence is that the alternating
  left/right layout, which the prototype drives off `:nth-child(odd/even)`, has
  to be re-derived from the reversed order, and the expand control now reveals
  items *below* the featured ones. That is a rewrite of the section's layout
  logic, not a copy — budget for it. Roadmap 3.6; covers FR-11–FR-15.
- **Expected outcome:** The visitor's trajectory renders from the database in
  both locales, completing the home page except for the skills section.
- **Acceptance criteria:**
  - Published entries only, ordered by `started_on` descending (FR-11).
  - Each entry shows `kind`, period, title, organization and its skills (FR-12).
  - An ongoing professional or academic entry renders "atual" / "present"; a
    certification with no `ended_on` renders "não expira" / "no expiry" (FR-13)
    — one component test per wording, per locale.
  - The most recent entry is the first one rendered, and the featured entries
    appear before the expand control, with the rest revealed below it (FR-14).
  - `DateRange` rejects `ended_on` before `started_on`, unit-tested.

## Sprint Definition of Done

Applying the roadmap's own definition of done, at sprint scope:

1. All six tasks implemented, each closing end-to-end rather than leaving a
   layer half-built.
2. Tests written and passing at the levels [testing.md](../testing.md) assigns:
   unit for domain and use cases against in-memory fakes, integration for
   repositories, migrations and constraints against a real PostgreSQL, component
   for rendering and accessibility with stubbed use cases. CI green on
   typecheck, unit, integration and build.
3. Every rendered section reads from the database, not from a literal — verified
   by changing a row and seeing the page change, not by reading the code.
4. Architectural boundaries verified by inspection, not assumed:
   `packages/core` has no runtime dependencies (NFR-09); nothing imports
   `packages/db` except `apps/web` and `core` types; no Client Component imports
   `@portfolio/db` and neither the driver nor the connection string appears in
   the client bundle (NFR-02, NFR-03).
5. Both locales render every shipped section, and untranslated fields fall back
   to `pt-BR` rather than to blank space (FR-34).
6. Responsive at 380 px, 760 px and desktop; modals close on `Escape` and return
   focus to the trigger; Lighthouse accessibility ≥ 95 on the home page
   (NFR-04, NFR-05, NFR-06).
7. Documentation updated where implementation diverged from design — the
   divergence recorded, not silently accepted.
8. No `TODO` left that a later sprint does not explicitly own.

## Uncertainties — documented gaps, not invented solutions

Recorded rather than resolved, because neither the documentation nor the
prototype supports a decision. Each needs an answer before the task that depends
on it starts.

| # | Gap | Blocks | Why it is not resolvable yet |
| --- | --- | --- | --- |
| U-1 | **The prototype's content is illustrative placeholder — every row of it.** Skills, projects, timeline entries, organizations, dates and usage notes are stand-ins, not the author's real history. | Task 1 | The seed can be written against the schema, but its values are not the deliverable and must not be asserted on. Real content comes from the author's own CV and project history in a later pass. This is why task 1 fixes no row counts: the prototype's 20 `skillData` keys, its 3 projects and its 5 timeline entries carry no authority, and neither do the counts in [roadmap.md](../roadmap.md) and [data-model.md](../domain/data-model.md), which were derived from them. |
| U-2 | **Four elements of the prototype are covered by no `FR`**: the fixed nav with its section index, the scroll progress bar, the scroll-driven marquee strip, and the closing CTA section that contains the social links. | Tasks 2, 4 | [requirements.md](../requirements.md) enumerates hero, projects, timeline, skills, stat band and footer — the nav, progress bar, strip and CTA copy appear in none of them, while the README treats the prototype as the specification. They are scheduled into tasks 2 and 4 on that basis, but their requirement rows do not exist and their `en` copy has never been written. |
| U-3 | Source of the availability boolean in FR-02. | Task 3 | The prototype has it as fixed text ("Disponível para novos projetos"), so it offers no boolean. FR-02 requires the text to reflect one, but no column in [data-model.md](../domain/data-model.md) and no `content/` item in [monorepo.md](../architecture/monorepo.md) holds it. |
| U-4 | `locale` cookie attributes — lifetime, `SameSite`, `Path`. | Task 2 | [stack.md](../architecture/stack.md) requires only that the choice "outlast one page" and survive closing the tab; the concrete values are unspecified. |
| U-5 | **The per-project decorative visual has no home in the model.** Every card and every project modal in the prototype carries a bespoke SVG — a node grid, concentric rings, a line chart. | Task 5 | No column holds it; [data-model.md](../domain/data-model.md) only acknowledges the absence by listing a media library as a future extension. Because the artwork differs per project, it cannot be derived from `category` the way the orbit's colours are. Either it becomes presentation keyed by `slug`, or it needs a column — a modelling decision no document has taken. |
| U-6 | The card eyebrow embeds an ordinal — `01 — agendamento`, `02 — automação`. | Task 5 | FR-06 renders `projects.category` as the eyebrow. Storing the number inside it would duplicate `sort_order` in translatable text, so reordering projects would mean editing copy in two locales. Whether the ordinal is derived at render time or is genuinely part of the category is unstated. |
