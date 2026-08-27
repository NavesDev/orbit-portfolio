# Data Model

PostgreSQL. 6 tables, 2 enums, bilingual content.

| Table | Purpose |
| --- | --- |
| [`social_links`](#1-social_links) | Footer contacts, including e-mail |
| [`skills`](#2-skills) | Technology taxonomy |
| [`projects`](#3-projects) | Portfolio work |
| [`timeline_entries`](#4-timeline_entries) | Professional, academic and certification track |
| [`project_skill`](#5-project_skill) | Project ↔ skill, with usage note |
| [`timeline_entry_skill`](#6-timeline_entry_skill) | Timeline entry ↔ skill, with usage note |

---

## Conventions

Applied to every table, so the shape of one predicts the shape of the rest.

| Rule | Detail |
| --- | --- |
| Table names | `snake_case`, plural. Join tables: `singular_singular`. |
| Column names | `snake_case`, singular, **English**. |
| Primary key | `id uuid`, default `gen_random_uuid()`. Join tables use a composite PK and have no `id`. |
| Foreign key | `<referenced_table_singular>_id`. |
| Audit | `created_at` / `updated_at timestamptz not null default now()` on every table except join tables. No soft delete — a removed row is deleted. |
| Listing | `is_published boolean not null` + `sort_order integer not null default 0` on anything rendered as a list. |
| Periods | `started_on` / `ended_on date`. `ended_on IS NULL` means open — ongoing, current, or never expires. No separate `is_current` flag. |
| Booleans | Prefixed `is_`. |
| Enumerations | Native database enums. A new value is a migration, never free text. |
| URLs | `varchar(2048)`, absolute `https` (or `mailto:`), validated in the domain layer. |
| Untranslated text | `varchar(n)` with an explicit limit. |
| **Translated text** | `jsonb`, keyed by locale. See [Localization](#localization). |

Default ordering for any collection:

```sql
ORDER BY sort_order ASC, started_on DESC NULLS LAST
```

---

## Localization

Locales: **`en-US`** (required and fallback) and **`pt-BR`**.

`en-US` is the locale every localized field must carry; `pt-BR` is optional and
may lag behind. A field with no `pt-BR` translation renders its `en-US` text
(FR-34).

### What is translated

Only text the visitor reads and that has a meaningful translation.

| Translated | Not translated |
| --- | --- |
| `projects.title`, `.category`, `.description`, `.tags` | `skills.name` — "Next.js", "PostgreSQL" |
| `timeline_entries.title`, `.description` | `timeline_entries.organization` — "UNIP", "Liferay" |
| `usage_note` on both join tables | `social_links.platform` — "GitHub" |
| | `slug`, URLs, dates, booleans, enums |

Proper nouns are not translated. A `skills` row is one row in any language,
which is what keeps the skill graph and its usage lookups language-agnostic.

`slug` stays single and untranslated: one project, one canonical URL across
locales. Translating slugs would give the same project two addresses and require
redirects between them.

### Storage

A translated column is `jsonb`, an object keyed by locale:

```json
{ "en-US": "Scheduling system", "pt-BR": "Sistema de agendamento" }
```

Chosen over per-entity translation tables. Those would take the schema from 6
tables to 10 — two of them existing solely to carry a `usage_note`, keyed on
four columns — and put a `JOIN` in every read. With one author and two locales,
the row stays the unit of editing and a new locale is a key, not a migration.

### Validation

`jsonb` has no length limit of its own, so the constraint that `varchar(n)` gave
for free has to be restored explicitly.

**Primary enforcement is in the domain**, in a `LocalizedText` value object that
rejects on construction. The database constraint is the second line of defense
(NFR-08), for anything written outside the application — seeds, migrations,
manual fixes.

One immutable function serves every localized column:

```sql
CREATE FUNCTION is_localized(value jsonb, max_length int)
RETURNS boolean
LANGUAGE sql IMMUTABLE STRICT
AS $$
  SELECT jsonb_typeof(value) = 'object'
     AND value ? 'en-US'
     AND NOT EXISTS (
       SELECT 1
         FROM jsonb_each(value) AS entry(locale, text)
        WHERE entry.locale NOT IN ('en-US', 'pt-BR')
           OR jsonb_typeof(entry.text) <> 'string'
           OR length(entry.text #>> '{}') > max_length
     )
$$;
```

It enforces four things at once:

1. The value is an object, not a string, number or array.
2. The required locale is present — no row is unreadable in `en-US`.
3. Every key is a known locale — a typo like `en_US` or `pt` is rejected
   instead of silently producing content nobody will ever see.
4. Every value is a string within the column's length budget.

A sibling `is_localized_array` covers `projects.tags`, adding a cap on the
number of items.

Adding a locale means editing this function — one migration. That is deliberate:
a new language should be a decision, not a side effect of an `INSERT`.

### Length budgets

| Column | Max per locale |
| --- | --- |
| `projects.title`, `timeline_entries.title` | 160 |
| `projects.category` | 40 |
| `projects.tags` — each item | 60, up to 8 items |
| `usage_note` | 240 |
| `description` | 8000 |

`description` had no limit when it was `text`. It gets one now: an unbounded
column is a column that eventually holds something absurd.

### Querying

Reading one locale, with fallback:

```sql
SELECT coalesce(title ->> 'pt-BR', title ->> 'en-US') AS title FROM projects;
```

Finding what still needs translating — the question that actually gets asked
while a site is being localized:

```sql
SELECT slug FROM projects WHERE NOT description ? 'pt-BR';
```

Fallback is resolved in the application layer, not in SQL, so the rule lives in
one place. The query above is for inspection.

---

## Enums

| Enum | Values |
| --- | --- |
| `skill_category` | `frontend`, `backend`, `tooling`, `data` |
| `timeline_kind` | `professional`, `academic`, `certification` |

`social_links.platform` is deliberately **not** an enum — see §1.

---

## 1. `social_links`

| Column | Type | Null | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | no | PK |
| `platform` | `varchar(40)` | no | Metadata and accessible name: `github`, `linkedin`, `instagram`, `email`. Feeds the link's `aria-label`. |
| `url` | `varchar(2048)` | no | Absolute; `mailto:` when the link is an e-mail address. |
| `icon_svg` | `text` | no | Inline SVG markup. Must use `stroke="currentColor"` so it inherits the link's hover color. |
| `is_published` | `boolean` | no | Default `true` |
| `sort_order` | `integer` | no | Default `0`. Footer order. |
| `created_at` / `updated_at` | `timestamptz` | no | |

Indexes: `ix_social_links__published_sort` on `(is_published, sort_order)`.

Nothing here is translated. `platform` is a proper noun and doubles as the
accessible name.

**Why `platform` is a plain varchar.** As an enum it would force a migration for
every new network, defeating the point of storing links as data. The icon is
carried by `icon_svg`, so nothing in the front end needs to switch on
`platform` — it exists to describe the link and to give screen readers a name
for an otherwise icon-only anchor.

**Why the icon is inline SVG rather than a URL.** Footer links change color on
hover through the CSS `color` property. An `<img>` cannot inherit
`currentColor`; inline SVG can. A URL would also add an external request and a
hosting dependency.

**Security constraint.** `icon_svg` is executable content. It must be sanitized
on write — tag whitelist (`svg`, `g`, `path`, `circle`, `rect`, `line`,
`polyline`, `polygon`), attribute whitelist, and rejection of any `on*` handler
or `<script>`. This is a domain invariant, enforced by an `IconSvg` value
object, not a front-end concern.

---

## 2. `skills`

| Column | Type | Null | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | no | PK |
| `name` | `varchar(60)` | no | Unique. Proper noun — not translated. |
| `category` | `skill_category` | no | Groups the orbit rings |
| `sort_order` | `integer` | no | Default `0` |
| `created_at` / `updated_at` | `timestamptz` | no | |

Indexes: `ux_skills__name`, `ix_skills__category`.

No `is_published`: a skill is only visible through a project or timeline entry
that references it. An orphan skill renders nowhere on its own.

Colors and ring radii are not stored — they are visual decisions belonging to
the front end, keyed off `category`.

---

## 3. `projects`

| Column | Type | Null | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | no | PK |
| `slug` | `varchar(120)` | no | Unique, untranslated. URL and deep-link target. |
| `title` | `jsonb` | no | Localized, ≤ 160 per locale |
| `category` | `jsonb` | yes | Localized, ≤ 40. Card eyebrow. |
| `description` | `jsonb` | yes | Localized, ≤ 8000. Markdown. |
| `tags` | `jsonb` | yes | Localized array of strings, ≤ 8 items of ≤ 60 |
| `repo_url` | `varchar(2048)` | yes | |
| `live_url` | `varchar(2048)` | yes | |
| `progress_percent` | `smallint` | yes | 0–100. Card progress bar. |
| `visual_svg` | `text` | yes | Sanitized inline SVG, the card and modal's decorative visual (U-5). Same `IconSvg` value object as `social_links.icon_svg`; its whitelist additionally accepts a `class` attribute naming one of four predefined animations. |
| `started_on` | `date` | yes | |
| `ended_on` | `date` | yes | Null = in progress |
| `is_featured` | `boolean` | no | Shown on the home page |
| `is_published` | `boolean` | no | Default `false` |
| `sort_order` | `integer` | no | Default `0` |
| `created_at` / `updated_at` | `timestamptz` | no | |

Indexes and constraints:

- `ux_projects__slug`
- `ix_projects__published_featured_sort` on `(is_published, is_featured, sort_order)`
- `ck_projects__progress_range`: `progress_percent BETWEEN 0 AND 100`
- `ck_projects__date_order`: `ended_on IS NULL OR ended_on >= started_on`
- `ck_projects__title`: `is_localized(title, 160)`
- `ck_projects__category`: `category IS NULL OR is_localized(category, 40)`
- `ck_projects__description`: `description IS NULL OR is_localized(description, 8000)`
- `ck_projects__tags`: `tags IS NULL OR is_localized_array(tags, 60, 8)`

`tags` holds one array per locale — `{"en-US": ["Real-time calendar"],
"pt-BR": ["Calendário em tempo real"]}`. They are free labels rendered as chips and never
queried on their own; normalized tag tables would add two tables, now doubled by
translation, to serve a display detail.

**Why `visual_svg` lives on the aggregate rather than being derived from
`category` (U-5).** The prototype's artwork — a node grid, concentric rings, a
line chart — differs per project in a way `category` cannot predict, unlike the
skills orbit's ring colours, which are a fixed function of `skill_category`.
Reusing `IconSvg` rather than introducing a second sanitizer keeps the one
security boundary (NFR-07) responsible for every piece of markup this database
ever renders as-is.

**The eyebrow's ordinal is not part of `category` (U-6).** `01 — agendamento`
is rendered from a project's position in the already-sorted list, computed by
the front end, never stored — `category` holds only `agendamento`, in both
locales. Storing the number would duplicate `sort_order` in translatable text.

---

## 4. `timeline_entries`

Professional experience, academic background and certifications in one table,
discriminated by `kind`. They share a title, an organization and a period —
which is the whole of what the timeline renders.

| Column | Type | Null | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | no | PK |
| `kind` | `timeline_kind` | no | `professional` \| `academic` \| `certification` |
| `title` | `jsonb` | no | Localized, ≤ 160. Role / degree / certification name |
| `organization` | `varchar(160)` | no | Employer / institution / issuer. Proper noun — not translated. |
| `description` | `jsonb` | yes | Localized, ≤ 8000 |
| `credential_url` | `varchar(2048)` | yes | Verification link. Only meaningful when `kind = 'certification'`. |
| `started_on` | `date` | no | Start date, or issue date for certifications |
| `ended_on` | `date` | yes | End date, or expiry. Null = current / never expires. |
| `is_featured` | `boolean` | no | Shown before "ver trajetória completa" |
| `is_published` | `boolean` | no | Default `false` |
| `sort_order` | `integer` | no | Default `0` |
| `created_at` / `updated_at` | `timestamptz` | no | |

Indexes and constraints:

- `ix_timeline_entries__published_started` on `(is_published, started_on DESC)`
- `ix_timeline_entries__kind` on `(kind)`
- `ck_timeline_entries__date_order`: `ended_on IS NULL OR ended_on >= started_on`
- `ck_timeline_entries__title`: `is_localized(title, 160)`
- `ck_timeline_entries__description`: `description IS NULL OR is_localized(description, 8000)`

**Trade-off, recorded deliberately.** Three separate tables would let the
database enforce per-type requirements (`field_of_study` mandatory for a degree,
`credential_id` for a certification). One table gives up that enforcement in
exchange for a timeline that needs no `UNION`, one repository instead of three,
and one skill join instead of three. At this scale — dozens of rows — the
simpler read path is worth more than the stricter schema. `credential_url` is
the only column that applies to a single kind; isolating it was not worth a
second table.

---

## 5. `project_skill`

| Column | Type | Null | Notes |
| --- | --- | --- | --- |
| `project_id` | `uuid` | no | PK part. FK → `projects.id`, `ON DELETE CASCADE`. |
| `skill_id` | `uuid` | no | PK part. FK → `skills.id`, `ON DELETE RESTRICT`. |
| `usage_note` | `jsonb` | yes | Localized, ≤ 240. How the skill was applied here. |

PK `(project_id, skill_id)`. Index `ix_project_skill__skill` for reverse lookup.
Constraint `ck_project_skill__usage_note`:
`usage_note IS NULL OR is_localized(usage_note, 240)`.

---

## 6. `timeline_entry_skill`

| Column | Type | Null | Notes |
| --- | --- | --- | --- |
| `timeline_entry_id` | `uuid` | no | PK part. FK → `timeline_entries.id`, `ON DELETE CASCADE`. |
| `skill_id` | `uuid` | no | PK part. FK → `skills.id`, `ON DELETE RESTRICT`. |
| `usage_note` | `jsonb` | yes | Localized, ≤ 240 |

PK `(timeline_entry_id, skill_id)`. Index `ix_timeline_entry_skill__skill`.
Same check constraint as above.

**`usage_note` is what makes the skills section work.** Clicking a technology
opens a modal listing where it was used and what it did there. That text has no
other home: it belongs to the pairing, not to the skill and not to the project.
Without it the interaction has nothing to show.

Query behind the modal — the only place two tables are unioned:

```sql
SELECT 'project' AS source, p.title, p.slug, ps.usage_note
  FROM project_skill ps
  JOIN projects p ON p.id = ps.project_id
 WHERE ps.skill_id = $1 AND p.is_published
UNION ALL
SELECT t.kind::text, t.title, NULL, ts.usage_note
  FROM timeline_entry_skill ts
  JOIN timeline_entries t ON t.id = ts.timeline_entry_id
 WHERE ts.skill_id = $1 AND t.is_published;
```

Localized columns come back as `jsonb`; the mapper turns them into
`LocalizedText` and the use case resolves the locale.

---

## Relationships

| From | Cardinality | To | On delete |
| --- | --- | --- | --- |
| `projects` | N ↔ N | `skills` | via `project_skill`; cascade from project, restrict from skill |
| `timeline_entries` | N ↔ N | `skills` | via `timeline_entry_skill`; same rule |

`social_links` and `skills` have no incoming foreign keys of their own.
`projects` and `timeline_entries` are independent — a project is not linked to
the job it was built in, which the current site never displays.

---

## Seed data

> **No row count is a criterion for anything**, here or in
> [roadmap.md](../roadmap.md). The seed's job is to make the site render from
> the database and to exercise the schema; its content is edited as the author's
> history changes, and no test asserts on it.

The seed now carries the author's real content in place of the prototype's
illustrative placeholder. `packages/db/src/seed/` splits it in two, so the
content can be read without the mechanics in the way:

| File | Holds |
| --- | --- |
| `data.ts` | The content, typed. No SQL, no I/O. |
| `run.ts` | The executor: one transaction, upserts, CLI entrypoint. |

Every localized column carries **both** `en-US` and `pt-BR`. An `en-US`-only
value would still be valid — it falls back — but a Brazilian visitor gets a
Portuguese page rather than a demonstration of the fallback.

### Identity and re-runnability

Each row's `id` is a UUIDv5 over a pinned namespace and the row's natural key:

| Table | Natural key |
| --- | --- |
| `skills` | `name` |
| `projects` | `slug` |
| `social_links` | `platform` |
| `timeline_entries` | `kind` + `organization` + `started_on` |

Ids are therefore the same on every machine and on every run, which is what lets
the join rows be written from natural keys. Every table is written with
`INSERT … ON CONFLICT DO UPDATE`, so `pnpm db:seed` converges the database on
the file without changing ids and without deleting a row an author added by
hand. **The seed is a statement of what these rows are, not a reset button.**

A `usage_note` naming a skill that does not exist throws before any SQL runs.
Silently dropping the association would leave a skill that renders nowhere, by
the rule in §2.

### Icons

`icon_svg` is authored in this project, not copied: the prototype's footer uses
two-letter text labels as placeholders. Each icon is a 24 × 24 stroke drawing
using only the tags whitelisted in §1, with `stroke="currentColor"` so a footer
link's hover colour reaches it, and no `<script>` and no `on*` attribute.

### Migration runner

`pnpm db:migrate` applies every file in `src/migrations/` not yet recorded in a
`schema_migrations (filename, applied_at)` ledger, in filename order, each file
in one transaction together with its own ledger row. Idempotence is the runner's
job, not the SQL's. That is what keeps each migration readable as the definition
of its table. Forward-only: there is no `down`, and a file that has run is never
edited.

---

## Migration order

Enums → `is_localized` / `is_localized_array` functions → `social_links` →
`skills` → `projects` → `timeline_entries` → `project_skill` →
`timeline_entry_skill`.

The validation functions come before any table that references them in a
`CHECK`.

`009` replaces both validation functions to move the locale set to
`('en-US', 'pt-BR')` and the required key to `en-US`. It is a replacement
rather than an edit to `002`, which has already run — migrations are
forward-only. `CREATE OR REPLACE` keeps the function identity, so the `CHECK`
constraints referencing it need no change. A `CHECK` is not re-validated on
replace, so rows written under the old rule survive until something updates
them; `pnpm db:seed` rewrites every row and is how an existing database is
brought forward.

---

## Extension points

Deferred, each additive — none forces a remodel:

- **Stats** (`stats` table) when the GitHub numbers stop being placeholders.
- **Type-specific timeline fields** (`degree_level`, `workload_hours`,
  `employment_type`) as nullable columns guarded by `CHECK` on `kind`.
- **A third locale** — add the key to `is_localized`, add the route segment, and
  translate. No schema change.
- **Media library** replacing any future `*_image_url` column.
