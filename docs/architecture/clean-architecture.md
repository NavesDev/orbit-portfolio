# Clean Architecture — Layer Map

How the model in [../domain/data-model.md](../domain/data-model.md) is
distributed across layers, and what each layer may know.

## 1. The dependency rule

Source dependencies point inward only:

```
Presentation  ──▶  Application  ──▶  Domain  ◀──  Infrastructure
```

- **Domain** imports nothing from the project. No ORM decorators, no HTTP types,
  no framework imports.
- **Application** imports Domain only.
- **Infrastructure** imports Domain and Application, to implement their ports.
- **Presentation** imports Application only. It never touches a repository, a
  database type or an HTTP client for someone else's API. The composition root
  is the exception it is meant to be: it names every adapter once, in one
  place, so that nothing else has to.

**Infrastructure is two packages, not one.** `@portfolio/db` is the
`persistence/` branch above and owns the portfolio's own database.
`@portfolio/infra` is the `providers/` and `config/` branches and owns adapters
to systems this project does not run. They are siblings and never import each
other: a package named for a database that also holds an HTTP client for a
forge is a package whose name has stopped being true. One folder per external
system under `providers/`, so a fourth service is a folder rather than a fourth
workspace package.

Inversion happens at the port boundary: Application declares
`ProjectRepository` as an interface, Infrastructure provides
`PostgresProjectRepository`, and the composition root wires them.

## 2. Directory layout

```
src/
  domain/
    entities/          Entity (base), Project, TimelineEntry, Skill, SocialLink
    value-objects/     Slug, DateRange, Url, ProgressPercent, IconSvg,
                       LocalizedText
    enums/             SkillCategory, TimelineKind, Locale
    errors/            DomainError and subclasses
  application/
    ports/             ProjectRepository, TimelineRepository,
                       SkillRepository, SocialLinkRepository, Clock
    use-cases/
      projects/        ListFeaturedProjects, ListProjects, GetProjectBySlug
      timeline/        GetTimeline
      skills/          GetSkillGraph, GetSkillUsage
      social/          ListSocialLinks
    dto/               Use-case input/output shapes
  infrastructure/
    persistence/       @portfolio/db
      migrations/      Schema, in the order given in the data model
      repositories/    Postgres implementations of the ports
      mappers/         Row ⇄ domain entity
    providers/         @portfolio/infra — SystemClock, GitHubDeveloperStatsProvider
    config/            @portfolio/infra — the names of the variables read
  presentation/
    web/               Pages, components, view models
    api/               Route handlers
  composition/         Dependency wiring — the only place that knows every layer
```

## 3. What belongs where

| Concern | Layer | Why |
| --- | --- | --- |
| `ended_on >= started_on` | Domain (`DateRange`) | True about the concept, regardless of storage. The `CHECK` constraint is a second line of defense, not the definition. |
| `progress_percent` in 0–100 | Domain (`ProgressPercent`) | Same. |
| SVG sanitization | Domain (`IconSvg`) | An icon that can execute script is not a valid icon. Validating on construction means no unsanitized value can exist in memory. |
| Localized text: length, allowed locales, required default | Domain (`LocalizedText`) | `jsonb` has no length limit, so the guarantee `varchar(n)` used to give must be restored somewhere. The domain is where it belongs; the `CHECK` is the second line. |
| Resolving which locale to render | Application (`Locale` passed into every use case) | Which language a visitor gets is a request-scoped decision, not a property of a project. |
| Negotiating `Accept-Language` | Presentation (proxy) | An HTTP concern. The domain never sees a header. |
| "Only published items are public" | Application | A use-case policy. The domain allows unpublished entities to exist. |
| Default ordering | Application specifies, Infrastructure executes | The contract is a use-case concern; the `ORDER BY` is a detail. |
| Skill usage union across two tables | Application (read model) | A projection across aggregates, driven by what the UI shows. |
| `uuid`, `varchar(160)`, native enums | Infrastructure | Types the domain never names. |
| Orbit colors, ring radii, icon rendering | Presentation | Visual decisions keyed off `category`. |
| Hero copy, availability boolean | Presentation | Static content, not data. |
| "years coding", "cups of coffee" | Presentation | Counted from the calendar against a constant in `content/site.ts`. Facts with no system to read them from. |
| What an unreachable stats provider means | Application (`GetDeveloperStats`) | A policy about what the page owes the visitor, not error handling: no source, no configuration and a nonsensical answer are one fact — this cannot be vouched for — and the use case returns nothing rather than something plausible. How an absent figure looks is presentation's business. |
| GitHub query syntax, status codes, API version | Infrastructure (`providers/`) | Types and vocabulary the application never names. |

## 4. Aggregates

| Aggregate root | Contains | Boundary rule |
| --- | --- | --- |
| `Project` | its skill associations | Skills are referenced **by id**, never loaded as full entities inside `Project`. |
| `TimelineEntry` | its skill associations | Same. |
| `Skill` | — | Referenced by both of the above. |
| `SocialLink` | — | Standalone. |

Four repositories, not six: the join tables are persisted by the owning root's
repository and never get one of their own.

**Every entity extends `Entity`, and `Entity` holds only an id.** It carries the
identity and the equality that follows from it: two entities of the same type
sharing an id are the same entity however far their other fields have drifted,
which is precisely what distinguishes an entity from a value object. Its
constructor is `protected`, so each subclass still exposes a `create` of its own
and no entity can be built unvalidated.

What it deliberately does **not** hold is the rest of the columns almost every
table shares. `created_at` and `updated_at` are on every table and belong to no
object here — no rule in this layer reads them, and a domain that declares them
is a domain shaped by its storage; they stay in the row types in
`packages/db`. `is_published` and `sort_order` are not universal: `skills` has
no published flag at all, because a skill is only visible through the project or
timeline entry that uses it, so a base declaring one would make `Skill` answer a
question nobody asks of it.

`TimelineEntry` is a single entity with a `kind`, mirroring the table. If
per-kind invariants appear later, it becomes an abstract root with
`ProfessionalEntry` / `AcademicEntry` / `CertificationEntry` subtypes and the
mapper dispatches on `kind` — the single table stays a persistence detail either
way.

## 5. Ports

| Port | Operations |
| --- | --- |
| `ProjectRepository` | `findBySlug`, `listPublished`, `listFeatured(limit)`, `save`, `delete` |
| `TimelineRepository` | `listPublished(limit, offset)` → `{ entries, total }`, `listSkillNames(entryId)` |
| `SkillRepository` | `listAll`, `findUsage(skillId)`, `save`, `delete` |
| `SocialLinkRepository` | `listPublished`, `save`, `delete` |
| `Clock` | `today()` — deferred, no caller yet. See below. |
| `DeveloperStatsProvider` | `fetchStats()` — public commit and pull-request counts for FR-21 |

**`TimelineRepository` promises an order, and it is the only repository that
does.** Everywhere else the use case sorts, so a fake and the real
implementation cannot drift apart. Pagination makes that impossible here: a use
case handed one page would sort whatever rows arrived rather than the ones that
should have. The order — `started_on` descending, nulls last, then `sort_order`,
then `id` — moves into the contract, and `FakeTimelineRepository` implements the
same rule the SQL does.

**`Clock` is designed and not built.** A rule that reads the current date needs
a port so a test can set that date instead of waiting for it. No such rule
exists yet: FR-13's "ongoing" is an open period, a null column, and
`GetDeveloperStats` takes its date as an argument. It lands with the first rule
that reads a date it did not receive — an expired certification would be one —
rather than shipping as a port with no caller.

`findUsage` returns a `SkillUsage[]` read model, not entities. Reads and writes
have different shapes; forcing both through one interface is what turns a
repository into a leaky query builder.

`DeveloperStatsProvider` is a port and not a repository, and the distinction is
not cosmetic: it reads a system this project does not own, so it may be slow,
rate-limited or simply absent. It declares exactly one failure,
`DeveloperStatsUnavailableError`, and the use case behind it decides what an
absent source means for the page — showing the static fallback and saying so.
Adapters translate their own failures into that error; a `fetch` rejection
reaching presentation would mean the boundary leaked.

Every read use case takes a `Locale`. Repositories do **not** — they return
entities holding a full `LocalizedText`, and the use case resolves the language
when building its output DTO. Pushing locale into SQL would spread the fallback
rule across every query; resolving it once in the application layer keeps it in
one place.

## 6. Mapping rules

- Row ⇄ entity conversion lives in `infrastructure/persistence/mappers`, one per
  aggregate.
- The shared column groups (`created_at`/`updated_at`,
  `is_published`/`sort_order`, `started_on`/`ended_on`) map through reusable
  mixins. Because the columns are standardized, each mixin is written once and
  reused by all four mappers.
- `ended_on IS NULL` becomes an open `DateRange` in the domain. The concepts
  "ongoing", "current" and "never expires" are the same absence, interpreted by
  the presentation layer according to `kind`.
- `jsonb` columns map to `LocalizedText`, validated on construction. A row that
  violates the invariant fails loudly at load, not silently downstream.
- `tags` maps to a `LocalizedText`-of-arrays. No entity.
- Output DTOs carry resolved `string`s. Nothing holding a `LocalizedText` ever
  crosses into the presentation layer (NFR-13).

## 7. Testing

| Layer | Style | Dependencies |
| --- | --- | --- |
| Domain | Pure unit tests | None |
| Application | Unit tests against in-memory port fakes | Fakes only |
| Infrastructure | Integration tests against a real PostgreSQL | Database |
| Presentation | Component and route tests with stubbed use cases | Stubs |

The in-memory fakes are the check that the ports are genuinely abstract: a fake
that is hard to write means the port has leaked a storage concern.
