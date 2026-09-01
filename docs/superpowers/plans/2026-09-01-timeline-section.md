# Timeline Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the visitor's trajectory from `timeline_entries` in both locales — a scroll-filled spine with alternating cards, four entries at a time behind a "show more" Server Action, each card opening its Markdown description in a modal.

**Architecture:** A `TimelineEntry` entity discriminated by `kind` in `@portfolio/core`, a paginating `TimelineRepository` port with a `PostgresTimelineRepository` implementation in `@portfolio/db`, a `GetTimeline(locale, { limit, offset })` use case producing `TimelineEntryView` DTOs with locale already resolved, and a Server Component section in `apps/web` wrapping one stateful client island. Ordering is part of the port's contract — unlike `ProjectRepository`, because sorting after slicing sorts the wrong page.

**Tech Stack:** TypeScript (strict, `verbatimModuleSyntax`), Vitest (`core`, `db-unit`, `db`, `web` projects), `pg` (hand-written SQL, no ORM), Next.js App Router (Server Components, `'use client'` islands, Server Actions), `react-markdown`, Testing Library.

**Design:** [2026-09-01-timeline-section-design.md](../specs/2026-09-01-timeline-section-design.md). Where this plan and that spec disagree, the spec wins.

## Global Constraints

- Zero runtime dependencies in `@portfolio/core` — no framework, no driver.
- `packages/db` may import `core`; never the reverse. `@portfolio/db` is never imported from a Client Component (NFR-02); the boundary is `apps/web/src/lib/`.
- Repositories take no `Locale`; only use cases do.
- A `LocalizedText` never crosses into presentation — DTOs carry resolved `string`s (NFR-13).
- `timeline_entry_skill` is read through the owning aggregate's repository and never gets one of its own.
- `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` — `import type` for type-only imports, explicit `.ts` extensions on relative imports inside `packages/core` and `packages/db`.
- No magic numbers or strings. A literal encoding a rule gets a named constant in that module's `constants/` folder, imported as a namespace (`import * as X_CONSTANTS from './constants/x.ts'`).
- Migrations are forward-only and idempotent. **This task adds none** — `006_timeline_entries.sql` and `008_timeline_entry_skill.sql` already carry the schema.
- Components are tested by role and accessible name, never by CSS class.
- Conventional Commits scoped by package. Branch: `feat/7-timeline-section` (checked out).
- Timeline ordering: `started_on DESC NULLS LAST, sort_order ASC, id ASC` (FR-11 first, `data-model.md`'s default as tiebreak, `id` for stable paging).

---

## File Structure

**New, `@portfolio/core`:**
- `src/domain/enums/timeline-kind.ts` (+ `.test.ts`)
- `src/domain/errors/invalid-timeline-entry-error.ts`
- `src/domain/entities/timeline-entry.ts` (+ `.test.ts`)
- `src/application/ports/timeline-repository.ts`
- `src/application/ports/__fakes__/fake-timeline-repository.ts`
- `src/application/dto/timeline-entry-view.ts`
- `src/application/use-cases/timeline/get-timeline.ts` (+ `.test.ts`)

**Modified, `@portfolio/core`:** `src/domain/constants/text-budgets.ts` (add `ORGANIZATION_MAX_LENGTH`), `src/index.ts` (barrel).

**New, `@portfolio/db`:** `src/mappers/timeline-entry.mapper.ts`, `src/repositories/postgres-timeline.repository.ts`, `tests/integration/repositories/timeline.repository.test.ts`.

**Modified, `@portfolio/db`:** `src/index.ts`.

**New, `apps/web`:**
- `src/lib/timeline/constants/timeline.ts` — `TIMELINE_PAGE_SIZE`
- `src/lib/timeline/timeline-provider.ts`
- `src/lib/timeline/timeline-actions.ts` — `'use server'`
- `src/lib/timeline/period.ts` (+ `.test.ts`)
- `src/lib/timeline/spine.ts` (+ `.test.ts`), `src/lib/timeline/constants/spine.ts`
- `src/components/timeline/timeline-section.tsx` (+ `.test.tsx`), `.module.css`
- `src/components/timeline/timeline-track.tsx` (+ `.test.tsx`), `.module.css`
- `src/components/timeline/timeline-item.tsx` (+ `.test.tsx`), `.module.css`
- `src/components/timeline/timeline-modal.tsx` (+ `.test.tsx`), `.module.css`
- `src/components/timeline/kind-icon.tsx`

**Modified, `apps/web`:** `src/content/types.ts`, `src/content/pt-BR/index.ts`, `src/content/en-US/index.ts`, `src/components/ui/section-registry.ts`, `src/app/[locale]/page.tsx`.

**Modified, `docs/`:** `requirements.md` (FR-12, FR-14), `domain/data-model.md` (§ 4 `is_featured`), `architecture/clean-architecture.md` (§ 5), `architecture/stack.md` (Server Actions), `sprints/sprint-01.md` (task 6 + a new uncertainty row).

---

## Task 1: `TimelineKind` enum

**Files:** create `packages/core/src/domain/enums/timeline-kind.ts` and its test.

**Produces:** `TIMELINE_KINDS: readonly TimelineKind[]`, `type TimelineKind = 'professional' | 'academic' | 'certification'`, `isTimelineKind(value: unknown): value is TimelineKind`.

Mirrors `domain/enums/locale.ts` exactly in shape — a `const` tuple, a type derived from it, and a guard. The guard is what the mapper uses to reject a row whose `kind` is outside the native enum.

- [ ] Write the failing test: the three members are present, `isTimelineKind` accepts each and rejects `'freelance'`, `''`, `null` and `undefined`.
- [ ] Run `pnpm vitest run --project core packages/core/src/domain/enums/timeline-kind.test.ts` — expect failure, module not found.
- [ ] Implement.
- [ ] Re-run — expect pass.
- [ ] Commit: `feat(core): add the timeline kind enum`.

## Task 2: `TimelineEntry` entity

**Files:** create `packages/core/src/domain/errors/invalid-timeline-entry-error.ts`, `packages/core/src/domain/entities/timeline-entry.ts` and its test; modify `packages/core/src/domain/constants/text-budgets.ts`.

**Consumes:** Task 1's `TimelineKind`; the existing `Entity`, `LocalizedText`, `DateRange`, `Url`.

**Produces:**

```ts
export interface TimelineEntryProperties extends EntityProperties {
  readonly kind: TimelineKind;
  readonly title: LocalizedText;
  readonly organization: string;
  readonly description: LocalizedText | null;
  readonly credentialUrl: Url | null;
  readonly period: DateRange;
  readonly isFeatured: boolean;
  readonly isPublished: boolean;
  readonly sortOrder: number;
}

export class TimelineEntry extends Entity<TimelineEntryProperties> {
  static create(properties: TimelineEntryProperties): TimelineEntry;
  get isOngoing(): boolean; // period.endedOn === null — FR-13's condition
  // plus a getter per property
}
```

`TIMELINE_ENTRY_VIOLATIONS`: `SORT_ORDER_NOT_AN_INTEGER`, `ORGANIZATION_EMPTY`, `ORGANIZATION_TOO_LONG`. `ORGANIZATION_MAX_LENGTH = 160` joins `text-budgets.ts`, matching `varchar(160)` in the migration.

- [ ] Write the failing tests: a valid entry exposes every field; `isOngoing` is true when `endedOn` is null and false when it is set; a blank organization, one over 160 characters, and a fractional `sortOrder` each throw `InvalidTimelineEntryError` with the matching violation.
- [ ] Run the `core` project — expect failure.
- [ ] Implement the error, the budget constant and the entity.
- [ ] Re-run — expect pass.
- [ ] Commit: `feat(core): add the timeline entry entity`.

## Task 3: `TimelineRepository` port and its fake

**Files:** create `packages/core/src/application/ports/timeline-repository.ts` and `packages/core/src/application/ports/__fakes__/fake-timeline-repository.ts`.

**Produces:**

```ts
export interface TimelinePage {
  readonly entries: readonly TimelineEntry[];
  readonly total: number;
}

export interface TimelineRepository {
  listPublished(limit: number, offset: number): Promise<TimelinePage>;
  listSkillNames(entryId: string): Promise<readonly string[]>;
}
```

`FakeTimelineRepository` takes `(entries: TimelineEntry[], skills: Record<string, string[]>)`, filters `isPublished`, applies the global ordering, then slices — the same three steps the SQL performs, in the same order.

The port's doc comment must say that ordering **is** part of this contract and why it differs from `ProjectRepository`: under pagination the use case sees one page and cannot sort what it was not given.

- [ ] Write the port and the fake (no test of their own — Task 4's use case tests exercise both).
- [ ] Commit: `feat(core): declare the paginating timeline repository port`.

## Task 4: `TimelineEntryView` and `GetTimeline`, TDD

**Files:** create `packages/core/src/application/dto/timeline-entry-view.ts`, `packages/core/src/application/use-cases/timeline/get-timeline.ts` and its test.

**Produces:**

```ts
export interface TimelineEntryView {
  readonly id: string;
  readonly kind: TimelineKind;
  readonly title: string;
  readonly organization: string;
  readonly description: string | null;
  readonly credentialUrl: string | null;
  readonly startedOn: string | null;
  readonly endedOn: string | null;
  readonly isOngoing: boolean;
  readonly skills: readonly string[];
}

export interface GetTimelineOutput {
  readonly entries: readonly TimelineEntryView[];
  readonly total: number;
}

export class GetTimeline {
  constructor(repository: TimelineRepository);
  execute(locale: Locale, page: { limit: number; offset: number }): Promise<GetTimelineOutput>;
}
```

- [ ] Write the failing tests against `FakeTimelineRepository`: unpublished entries never appear; entries come back newest first; `limit`/`offset` return the right window and the total counts every published row, not the page; skills arrive per entry; a `pt-BR` request on a field holding only `en-US` returns the English text (FR-34); `isOngoing` survives into the view.
- [ ] Run the `core` project — expect failure.
- [ ] Implement the DTO and the use case.
- [ ] Re-run — expect pass.
- [ ] Commit: `feat(core): add the get timeline use case`.

## Task 5: `@portfolio/core` barrel

**Files:** modify `packages/core/src/index.ts`.

- [ ] Export the enum, guard, error, entity, port types, `TimelinePage`, the DTO, `GetTimeline`, `GetTimelineOutput` and `ORGANIZATION_MAX_LENGTH`. `FakeTimelineRepository` is **not** exported — fakes stay internal, as `FakeProjectRepository` does.
- [ ] Run `pnpm typecheck`.
- [ ] Commit: `feat(core): export the timeline slice`.

## Task 6: mapper and `PostgresTimelineRepository`

**Files:** create `packages/db/src/mappers/timeline-entry.mapper.ts`, `packages/db/src/repositories/postgres-timeline.repository.ts`, `packages/db/tests/integration/repositories/timeline.repository.test.ts`; modify `packages/db/src/index.ts`.

`TimelineEntryRow` selects `started_on::text` and `ended_on::text`, for the reason `project.mapper.ts` already documents. `toDomain` rejects a `kind` outside the enum through `isTimelineKind` rather than casting.

`listPublished` is one query carrying `COUNT(*) OVER() AS total_count`; an empty result means `total: 0` by default rather than by indexing.

- [ ] Write the failing integration tests: ordering newest first; page one and page two return disjoint windows with the same total; an unpublished row appears in neither; a row's localized `title` round-trips through the mapper; `listSkillNames` returns the entry's skills in `sort_order`.
- [ ] Run `pnpm test:integration` — expect failure.
- [ ] Implement mapper, repository and export.
- [ ] Re-run — expect pass.
- [ ] Commit: `feat(db): add the timeline repository`.

## Task 7: site copy

**Files:** modify `src/content/types.ts`, `src/content/pt-BR/index.ts`, `src/content/en-US/index.ts`.

**Produces:** `SiteContent['timeline']` — `kicker`, `heading`, `kindLabels: Record<TimelineKind, string>`, `ongoing: Record<TimelineKind, string>`, `detailsCta`, `showMore`, `closeModal`, `credentialCta`, `skillsHeading`.

pt-BR takes the prototype's own words (`Trajetória`; `Formação e experiência, na mesma linha do tempo.`; `atual`; `não expira`); en-US is newly authored (`present`, `no expiry`).

- [ ] Add the block to the interface, then to both locales.
- [ ] Run `pnpm typecheck` — a key missing from one locale must be an error.
- [ ] Commit: `feat(web): add the timeline section copy`.

## Task 8: `formatPeriod`, TDD

**Files:** create `apps/web/src/lib/timeline/period.ts` and its test.

**Produces:** `formatPeriod(entry: TimelineEntryView, ongoing: Record<TimelineKind, string>): string`.

Rules: a closed range across two years is `2022 — 2024`; a closed range inside one year is the bare `2025`; an open range is `2025 — <ongoing[kind]>`; a missing `startedOn` yields the ongoing word alone.

- [ ] Write the failing tests, one per rule, both locales' words.
- [ ] Run `pnpm --filter @portfolio/web test src/lib/timeline` — expect failure.
- [ ] Implement.
- [ ] Re-run — expect pass.
- [ ] Commit: `feat(web): format a timeline entry's period`.

## Task 9: spine arithmetic, TDD

**Files:** create `apps/web/src/lib/timeline/spine.ts`, `apps/web/src/lib/timeline/constants/spine.ts` and the test.

**Produces:** `computeSpineFill(wrapTop: number, wrapHeight: number, viewportHeight: number): number` returning `0..1`, and `isNodePassed(nodeTop: number, viewportHeight: number): boolean`.

The prototype's own rule, extracted: the spine fills by how far the wrapper has crossed the viewport's midline, clamped at both ends; a node is passed once its centre is above that midline plus a small lead.

- [ ] Write the failing tests: below the viewport is `0`, fully scrolled past is `1`, halfway is `0.5`, a zero-height wrapper does not divide by zero.
- [ ] Run — expect failure. Implement. Re-run — expect pass.
- [ ] Commit: `feat(web): extract the timeline spine arithmetic`.

## Task 10: `KindIcon` and `TimelineItem`

**Files:** create `kind-icon.tsx`, `timeline-item.tsx` (+ test), `timeline-item.module.css`.

`TimelineItem` takes `{ entry, side: 'left' | 'right', isPassed, content, onOpenDetails }` and renders the kind chip, period, title (`<h3>`), organization, a skills `<ul>`, and the details `<button>`. `side` comes from the parent's index parity, never from `:nth-child`.

- [ ] Write the failing component tests: all five FR-12 facts render; the details button is found by role and accessible name; the skills list is a list.
- [ ] Run — expect failure. Implement. Re-run — expect pass.
- [ ] Commit: `feat(web): render one timeline entry`.

## Task 11: `TimelineModal`

**Files:** create `timeline-modal.tsx` (+ test), `timeline-modal.module.css`.

A native `<dialog>` opened with `showModal()`, closed on `Escape` and on the close button, returning focus to the trigger (NFR-05). Body is `react-markdown` over `entry.description`, then the skills, then the credential link when `credentialUrl` is non-null. A null description renders the entry's facts without an empty node.

- [ ] Write the failing tests: opens with the title as its accessible name; `Escape` closes it and focus returns to the trigger; a null description still renders title, organization and period; `credentialUrl` present renders a link, absent renders none.
- [ ] Run — expect failure. Implement. Re-run — expect pass.
- [ ] Commit: `feat(web): open a timeline entry's detail in a modal`.

## Task 12: `TimelineTrack` and the Server Action

**Files:** create `timeline-track.tsx` (+ test), `timeline-track.module.css`, `lib/timeline/constants/timeline.ts`, `lib/timeline/timeline-provider.ts`, `lib/timeline/timeline-actions.ts`.

`TIMELINE_PAGE_SIZE = 4`. `getTimelinePage(locale, offset)` is the composition root; `loadMoreTimeline(locale, offset)` is the `'use server'` wrapper, alone in its file because such a module may export only async functions.

`TimelineTrack` (`'use client'`) holds the accumulated entries, the pending flag and the open entry; subscribes to the shared scroll store for the spine; renders "show more" only while `entries.length < total`.

- [ ] Write the failing tests with the action stubbed: the first page renders; clicking "show more" appends the next page; the control disappears once every entry is shown; it is absent from the start when the first page is the whole list.
- [ ] Run — expect failure. Implement. Re-run — expect pass.
- [ ] Commit: `feat(web): page the timeline through a server action`.

## Task 13: `TimelineSection`, registry and page wiring

**Files:** create `timeline-section.tsx` (+ test), `timeline-section.module.css`; modify `section-registry.ts` and `app/[locale]/page.tsx`.

`TIMELINE_SECTION_ID = 'timeline'` sits between projects and the band, in both the registry array and the page's markup.

- [ ] Write the failing test: the section exposes its heading and kicker and renders the track.
- [ ] Run — expect failure. Implement, then wire the page to fetch the first page alongside its other reads.
- [ ] Run `pnpm test` and `pnpm typecheck` — expect pass.
- [ ] Commit: `feat(web): render the timeline section on the home page`.

## Task 14: the documents this changed

**Files:** modify `docs/requirements.md`, `docs/domain/data-model.md`, `docs/architecture/clean-architecture.md`, `docs/architecture/stack.md`, `docs/sprints/sprint-01.md`.

Each edit is listed in the spec's closing table. The sprint gains an uncertainty row, `U-8`, recording the four decisions and who took them — the same form `U-5`, `U-6` and `U-7` already use.

- [ ] Apply the edits.
- [ ] Run `writing-guidelines` over the changed prose and apply what is right, not the whole batch.
- [ ] Commit: `docs: replace the timeline toggle with pagination`.

## Task 15: verification

- [ ] `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm build`.
- [ ] Run `web-design-guidelines` over the new components and act on real findings.
- [ ] Bring up `pnpm dev` and check both locales through `next-dev-loop`: the spine fills, "show more" appends, the modal opens and closes on `Escape`, and the layout holds at 380px, 760px and desktop.
- [ ] Screenshot both locales for the author's UI validation.
- [ ] Open the pull request with the template filled in, `Closes #7`, naming the skills that shaped the work.

## Self-review notes

- **Spec coverage.** FR-11 → Tasks 3, 4, 6. FR-12 → Task 10. FR-13 → Tasks 2, 8, 10. FR-14 (as revised) → Task 12. FR-15 → Tasks 9, 12. NFR-02 → Task 12's provider/action split. NFR-05 → Task 11. NFR-13 → Task 4. FR-34 → Task 4.
- **`DateRange` rejecting an end before its start** is issue #7's last criterion and is already covered by `date-range.test.ts`. No task duplicates it; the pull request cites the existing test.
- **No migration task**, deliberately: the schema for both tables landed in sprint task 1 and migrations are never edited after they run.
