# Timeline section — design

Issue [#7](https://github.com/NavesDev/orbit-portfolio/issues/7) · sprint task 6 ·
roadmap 3.6 · covers FR-11–FR-15.

Derived from [requirements.md](../../requirements.md),
[domain/data-model.md](../../domain/data-model.md),
[architecture/clean-architecture.md](../../architecture/clean-architecture.md),
[architecture/monorepo.md](../../architecture/monorepo.md) and
[architecture/stack.md](../../architecture/stack.md). Where this design and a
document disagree, the document changes in the same pull request — the
divergences are listed at the end rather than left implicit.

## What ships

The visitor's trajectory, read from `timeline_entries`, rendered in both
locales as the prototype's vertical spine: a centred rule that fills as the
section scrolls past, with cards alternating left and right of it and the node
on each card lighting up once it is passed.

Each card carries the five facts FR-12 names — kind, period, title,
organization and skills — and a control opening a modal with the entry's
Markdown description, its skills and, when the row has one, the credential
link.

Entries arrive four at a time. A "show more" control asks the server for the
next four; when none are left it is gone.

## Decisions taken with the author

Four questions had no answer in the documents. They were put to the author and
answered; each one moves a document.

### The `Clock` port is deferred, not built

[clean-architecture.md § 5](../../architecture/clean-architecture.md) lists
`Clock` with `today()`, and issue #7 names it a deliverable. Nothing in this
task reads it. "Ongoing" is FR-13's own definition — `ended_on IS NULL`, a null
test — and not a comparison against the current date, so a `Clock` here would
ship a port with no caller and a `SystemClock` with no consumer.

It is deferred to the first rule that genuinely asks what day it is. The port's
row in the architecture document is annotated rather than deleted: the design
is still right, it is the timing that was wrong.

### The featured/full toggle becomes pagination

FR-14 read: *"MUST show featured entries by default and reveal the rest on
demand."* It becomes four entries at a time with a "show more" control, and
`is_featured` stops deciding what the section shows.

The reason is that the toggle answers a question the data no longer poses. It
was designed against a prototype with five hardcoded entries, where "featured"
was a hand-picked short list. A trajectory that grows needs a control whose
cost is bounded by the page size, not by how many rows happen to carry a flag —
and a visitor gets the same thing either way: the most recent work first, the
rest one click away.

**Consequence, recorded rather than hidden.** `timeline_entries.is_featured`
keeps its column, its constraint and its seed values, and loses its only
reader. It is not dropped: dropping it would be a migration justified by one
section's layout, and the column is a legitimate content fact.
[data-model.md § 4](../../domain/data-model.md) describes it as *"shown before
'ver trajetória completa'"* — that description is now wrong and is corrected in
the same pull request.

**Second consequence.** With five published entries and a page of four, the
control appears once and reveals one entry. It is infrastructure for a
trajectory that grows, not for today's content.

### The description opens in a modal

`timeline_entries.description` holds real authored content — the Sea Tecnologia
entry alone is six Markdown bullets — and no requirement rendered it. FR-12
lists what a card shows and the description is not on that list, so it had no
reader at all.

It goes in a modal rather than in the card. A card is a scannable summary and
the spine's alternating layout depends on cards being roughly the same height;
six bullets inline would make one card dominate the section and push the next
node a screen away from its neighbour. The project section faced the same
question and resolved it differently (U-7: a page, not a modal), and the
difference is `slug` — a project has a canonical URL to share, a timeline entry
does not, so a page would have nothing to put in the address bar.

The control appears on **every** card, including entries whose `description` is
null, and the modal then shows the title, organization, period and skills. This
departs from the rule FR-09 sets for a project's missing `repo_url` (omit the
control rather than render a dead one) and does so deliberately: a repository
link with no URL leads nowhere, while a detail view with no description still
has four facts to show. The author chose consistency between cards here.

### "Show more" is a Server Action

[monorepo.md § The HTTP surface](../../architecture/monorepo.md) rule 2 forbids
portfolio content endpoints: *"Exposing an HTTP endpoint for the site to call
itself adds a network hop and a cache layer to solve nothing. `/api/*` exists
for other projects."* A `/api/v1/timeline?page=2` route would contradict it
directly.

A Server Action does not. It is not an HTTP surface anyone else can call, it
needs no version segment, no CORS entry and no rate limit, and it keeps the
composition root as the only place that knows PostgreSQL exists. The page stays
statically generated with its first page of entries prerendered; only the
action runs per request.

No architecture document mentions Server Actions today. [stack.md](../../architecture/stack.md)
gains a row for them, so the next slice that needs one does not have to
re-argue this.

## Layers

Dependencies point inward, as always: `web → core ← db`.

### `@portfolio/core`

| Unit | Holds |
| --- | --- |
| `domain/enums/timeline-kind.ts` | `TIMELINE_KINDS`, `TimelineKind`, `isTimelineKind` — mirrors the `timeline_kind` native enum |
| `domain/entities/timeline-entry.ts` | The entity, discriminated by `kind` |
| `domain/errors/invalid-timeline-entry-error.ts` | Its violations |
| `application/ports/timeline-repository.ts` | The port, plus the `TimelinePage` shape it returns |
| `application/dto/timeline-entry-view.ts` | `TimelineEntryView` — resolved `string`s only (NFR-13) |
| `application/use-cases/timeline/get-timeline.ts` | `GetTimeline` |
| `application/ports/__fakes__/fake-timeline-repository.ts` | In-memory, for the use case's unit tests |

`TimelineEntry` carries `kind`, `title`, `organization`, `description`,
`credentialUrl`, `period`, `isFeatured`, `isPublished` and `sortOrder`, plus one
derived rule:

```ts
get isOngoing(): boolean {
  return this.period.endedOn === null;
}
```

FR-13's condition lives there and not in a component, so the presentation layer
asks the entity whether an entry is ongoing instead of re-deriving it from a
null check of its own.

`organization` stays a plain `string` rather than becoming a value object. It is
a proper noun with a length budget and no other rule — `data-model.md` is
explicit that it is not translated — so the entity validates it (present, within
160 characters) and nothing more. A value object here would be a wrapper around
`string` with no invariant a second reader could name.

**The port takes pagination and returns a total:**

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

`total` rather than a `hasMore` boolean: the caller can derive `hasMore` from
`offset + entries.length < total`, and cannot derive a total from a boolean.

**Ordering moves into the port's contract, and this is a real departure.**
`ListFeaturedProjects` sorts in the use case precisely so that a fake and the
real repository agree, and `ProjectRepository`'s doc says ordering is not part
of its contract. That cannot hold under pagination: sorting after slicing sorts
the wrong four rows. So `listPublished` promises `started_on` descending, and
`FakeTimelineRepository` sorts and slices with the same rule the SQL uses. The
port's doc comment says so, because a contract that is only true in one
implementation is the bug this project's fakes exist to catch.

Ordering is `started_on DESC NULLS LAST`, then `sort_order ASC`, then `id` —
FR-11's rule first, `data-model.md`'s default as the tiebreak, and `id` last so
that two rows identical on both keys cannot swap between one page and the next.

`GetTimeline(locale, { limit, offset })` returns
`{ entries: TimelineEntryView[], total: number }`. It resolves every
`LocalizedText` against `locale` and calls `listSkillNames` once per entry on
the page — four queries, the same N+1 shape `PostgresProjectRepository.listSkillUsage`
already accepts at this scale, and bounded by the page size rather than by the
table.

The view carries `startedOn` and `endedOn` as `YYYY-MM-DD` strings plus
`isOngoing`, and **not** a formatted period. Formatting needs the words "atual"
and "não expira", which are copy; copy lives in `apps/web/src/content/`.

### `@portfolio/db`

`mappers/timeline-entry.mapper.ts` and
`repositories/postgres-timeline.repository.ts`, both following the project
slice exactly: dates selected as `::text` so the driver's date type never
reaches `DateRange`, and read-only — the seed writes these rows with its own
SQL, so there is no `save` to write.

`listPublished` runs one query, with `COUNT(*) OVER()` carrying the total
alongside the page:

```sql
SELECT <columns>, COUNT(*) OVER() AS total_count
  FROM timeline_entries
 WHERE is_published = true
 ORDER BY started_on DESC NULLS LAST, sort_order ASC, id ASC
 LIMIT $1 OFFSET $2
```

An empty page returns `total: 0`, which is correct — a window function over no
rows produces no rows to read it from, so the repository defaults rather than
indexing into nothing.

`ix_timeline_entries__published_started` on `(is_published, started_on DESC)`
already exists and covers the filter and the sort.

### `@portfolio/web`

**Composition root.** `lib/timeline/timeline-provider.ts` builds the use case
over `PostgresTimelineRepository` — the only module in the app that knows both
that the port exists and that PostgreSQL implements it (NFR-02), the same role
`projects-provider.ts` plays.

`lib/timeline/timeline-actions.ts` is a separate file carrying `'use server'`
and exporting one async function, `loadMoreTimeline(locale, offset)`. Separate
because a `'use server'` module may export nothing but async functions, so the
provider cannot live in it.

**Pure logic, unit-tested, in `lib/timeline/`:**

- `period.ts` — `formatPeriod(view, copy)`. `2022 — 2024` for a closed range,
  the bare year when start and end share one, `2025 — atual` or
  `2026 — não expira` when open, worded by `kind`.
- `spine.ts` — `computeSpineFill(wrap, viewportHeight)` and
  `isItemPassed(item, viewportHeight)`. The prototype does this arithmetic
  inline in its scroll handler; extracted here it is testable against plain
  rectangles, the way `active-section.ts` already is.

**Components.**

| Component | Kind | Responsibility |
| --- | --- | --- |
| `timeline-section.tsx` | Server | Section landmark, kicker and heading; hands the first page down |
| `timeline-track.tsx` | Client | The list's state: entries so far, the spine's fill, which nodes are passed, the "show more" call, which entry's modal is open |
| `timeline-item.tsx` | Client tree | One card and its node — kind chip, period, title, organization, skills, details control |
| `timeline-modal.tsx` | Client tree | `<dialog>` with the Markdown description |
| `kind-icon.tsx` | Client tree | The per-`kind` glyph |

Only `TimelineSection` is a Server Component. Everything below `TimelineTrack`
is in the client bundle, because the card's details control and the "show more"
button both need handlers — a component holding no state of its own is still a
Client Component once it is imported by one. What that costs is bounded: these
are markup and a glyph, they import nothing from `@portfolio/db` (NFR-02), and
the data they render arrives already resolved to plain strings (NFR-13).

`TimelineTrack` is the only stateful piece. It subscribes to the shared scroll
store (`subscribeToScroll`) rather than adding a listener of its own — roadmap
3.9's consolidation, already in place for the progress bar and the nav index.

The alternating side is computed from the item's index in the accumulated list
(`index % 2`), never from `:nth-child`. The prototype's CSS-driven alternation
cannot survive this section: entries are appended in pages, so parity has to be
derived from a position the component knows and CSS does not.

**Accessibility.** The modal is a native `<dialog>` opened with `showModal()`,
which gives Escape-to-close, the focus trap and the inert backdrop without
hand-written key handling; focus returns to the control that opened it
(NFR-05). "Show more" is a `<button>` that reports progress through its
accessible name and disappears when exhausted, rather than persisting disabled.
Skills are a list, not a row of styled spans, so a screen reader announces how
many there are. Every component test queries by role and accessible name.

**Layout.** The prototype's own breakpoint is kept: a centred spine with
alternating cards above 760px, and below it the spine moves to the left with
every card on its right.

**Copy.** `SiteContent` gains a `timeline` block: `kicker`, `heading`,
`kindLabels` and `ongoing` — both `Record<TimelineKind, string>`, so a new kind
is a type error in both locales rather than a blank chip — plus `detailsCta`,
`showMore`, `closeModal`, `credentialCta` and `skillsHeading`. The pt-BR
strings come from the prototype where it has them; the en-US ones are new.

`section-registry.ts` gains `TIMELINE_SECTION_ID`, between projects and the
band, and the nav index counts it automatically.

## Tests

Following [testing.md](../../testing.md)'s assignment of levels:

| Level | Covers |
| --- | --- |
| `core` unit | `TimelineEntry` invariants and `isOngoing`; `GetTimeline` against `FakeTimelineRepository` — ordering, page boundaries, the total, locale resolution and the pt-BR fallback |
| `db` integration | `listPublished` ordering, paging and total against real rows; unpublished rows absent; the mapper's round trip; `listSkillNames` |
| `web` component | Each of FR-13's four wordings — ongoing professional and ongoing certification, in each locale; the details control opening and closing the modal with focus returning; "show more" appending a page and then disappearing; a card rendering all five FR-12 facts |
| `web` unit | `formatPeriod` and the spine arithmetic |

`DateRange` already rejects an end before its start, with the unit test issue #7
asks for — `packages/core/src/domain/value-objects/date-range.test.ts`. Nothing
new is needed there; the criterion is met by existing code and the pull request
says so rather than adding a duplicate test.

Not tested, per testing.md's own list of exclusions: the spine's pixel output
and the card transitions.

## Out of scope

The skills orbit and the skill-usage modal (roadmap 3.7) — skills appear here
only as the names attached to an entry, with `usage_note` left unread until
`SkillRepository.findUsage` lands. The `/projetos` list page (roadmap 4.1)
remains where it was.

## Documents this changes

Recorded here so the pull request's diff is expected rather than surprising.

| Document | Change |
| --- | --- |
| `docs/requirements.md` | FR-14 rewritten as pagination; FR-12 gains the description modal |
| `docs/domain/data-model.md` § 4 | `is_featured`'s description no longer references a control that exists |
| `docs/architecture/clean-architecture.md` § 5 | `TimelineRepository`'s operations; `Clock` annotated as deferred |
| `docs/architecture/stack.md` | A row for Server Actions and what they are for |
| `docs/sprints/sprint-01.md` | Task 6's description and acceptance criteria; a new uncertainty row recording the four decisions above |

Issue #7's own acceptance criteria are updated by comment, since two of them
describe behaviour this design deliberately replaces.
