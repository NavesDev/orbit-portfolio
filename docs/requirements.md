# Requirements

Derived from the
[prototype](https://claude.ai/public/artifacts/4374a464-6647-49d7-9140-050f767c3d3a),
which is the functional specification for v1: the site must reproduce its
behaviour with content coming from the database instead of from hardcoded
objects. Its data is illustrative placeholder — what it specifies is behaviour
and appearance, never content. Where it and this catalogue disagree, the
requirement wins; see [Open against the prototype](#open-against-the-prototype).

`MUST` is required for v1. `SHOULD` is expected but may slip a phase.
`WON'T` is explicitly out of scope, recorded so it is not rediscovered later.

## Functional — localization

| ID | Requirement |
| --- | --- |
| FR-29 | The site MUST be available in `pt-BR` and `en`. |
| FR-30 | A visitor who expresses no preference MUST get the language their browser asks for, negotiated from `Accept-Language`. |
| FR-31 | An unsupported browser language MUST fall back to `pt-BR`. |
| FR-32 | Every page MUST be addressable per locale — `/pt-BR/projetos`, `/en/projetos`. |
| FR-33 | A language switcher MUST persist the choice across visits, and that choice MUST outrank the browser's language. |
| FR-34 | A field with no translation in the requested locale MUST render its `pt-BR` value, never an empty space. |
| FR-35 | Proper nouns — skill names, organizations, platforms — MUST NOT be translated. |
| FR-36 | `slug` MUST be identical across locales; a project has one canonical address. |

## Functional — home page

### Hero

| ID | Requirement |
| --- | --- |
| FR-01 | MUST display a headline with one emphasized fragment, from static content. |
| FR-02 | MUST display an availability badge whose text reflects a boolean, not free text. |
| FR-03 | SHOULD render an interactive particle field that reacts to pointer position and settles back to rest. |
| FR-04 | The field MUST stop animating when the component unmounts. |

### Projects section

| ID | Requirement |
| --- | --- |
| FR-05 | MUST list featured, published projects ordered by `sort_order`, then `started_on` descending. |
| FR-06 | Each card MUST show title, category, tags and a progress bar reflecting `progress_percent`. |
| FR-07 | The progress bar MUST animate once, when the card enters the viewport. |
| FR-08 | A card MUST open a detail view showing description, tags and applied skills. |
| FR-09 | A card MUST link to `repo_url` when present, and omit the control when absent. |
| FR-10 | MUST link to the project list in the current locale. |

### Timeline

| ID | Requirement |
| --- | --- |
| FR-11 | MUST list published timeline entries ordered by `started_on` descending. |
| FR-12 | Each entry MUST show its `kind`, period, title, organization and skills. |
| FR-13 | An entry with no `ended_on` MUST render as ongoing, worded per `kind` and per locale — "atual" / "present" for professional and academic, "não expira" / "no expiry" for certification. |
| FR-14 | MUST show featured entries by default and reveal the rest on demand. |
| FR-15 | SHOULD fill a vertical spine proportionally to scroll position and highlight the entries already passed. |

### Skills

| ID | Requirement |
| --- | --- |
| FR-16 | MUST render all skills grouped by category. |
| FR-17 | Selecting a skill MUST open a view listing everywhere it was used, with the usage note for each. |
| FR-18 | Usage MUST span both projects and timeline entries. |
| FR-19 | MUST be operable by pointer and by touch. |
| FR-20 | SHOULD render as the orbital canvas of the prototype. |

### Stat band and footer

| ID | Requirement |
| --- | --- |
| FR-21 | MUST display the stat figures from static content, animating once on first view. |
| FR-22 | MUST label placeholder figures as illustrative for as long as they are not real. |
| FR-23 | MUST list published social links ordered by `sort_order`, rendering `icon_svg` inline. |
| FR-24 | Each social link MUST have an accessible name derived from `platform`. |

## Functional — subpages

| ID | Requirement |
| --- | --- |
| FR-25 | `/[locale]/projetos` MUST list every published project. |
| FR-26 | `/[locale]/projetos/[slug]` MUST render a single project as a shareable page. |
| FR-27 | An unknown or unpublished slug MUST return 404. |
| FR-28 | Unpublished content MUST NOT be reachable by any public route. |

## Non-functional

| ID | Requirement |
| --- | --- |
| NFR-01 | Pages MUST be statically generated and revalidated on a timer (`revalidate = 3600`). |
| NFR-02 | Content MUST be read in Server Components; no Client Component may import the database package. |
| NFR-03 | The database driver and connection string MUST NOT appear in the client bundle. |
| NFR-04 | Layout MUST work at 380 px, 760 px and desktop widths. |
| NFR-05 | Modals MUST close on `Escape` and return focus to the trigger. |
| NFR-06 | Lighthouse accessibility score MUST be ≥ 95. |
| NFR-07 | `icon_svg` MUST be sanitized before storage; script and event-handler attributes are rejected. |
| NFR-08 | Domain invariants MUST be enforced in the domain layer, with database constraints as a second line of defense. |
| NFR-09 | `packages/core` MUST have no runtime dependencies. |
| NFR-10 | Localized text MUST be length-validated in the domain layer, with a database `CHECK` as second line of defense. `jsonb` has no inherent limit. |
| NFR-11 | An unknown locale key MUST be rejected on write, not stored as content nobody can reach. |
| NFR-12 | The locale redirect on `/` MUST NOT be cached across visitors. |
| NFR-13 | Client Components MUST receive resolved strings, never `LocalizedText` or raw `jsonb`. |
| NFR-14 | `Accept-Language` MUST be read to pick a language and not stored. |

## Out of scope for v1

| ID | Item | Why |
| --- | --- | --- |
| WN-01 | Telemetry endpoints | Deferred to Phase 6 — needs its own design pass |
| WN-02 | Admin interface | Content is edited by SQL or seed until it hurts |
| WN-03 | Live GitHub statistics | Figures stay illustrative and labelled as such |
| WN-04 | Contact form | The footer links to e-mail |
| WN-05 | Authentication | Nothing to protect while everything is public and read-only |
| WN-06 | A third locale | Two are enough to prove the model; adding one is a key and a route segment |

## Open against the prototype

The prototype is the functional specification, so anything it does that no
requirement above names is a gap in this catalogue, not permission to drop the
behaviour. Recorded as questions, deliberately not written as `MUST` rows —
each needs a decision before it earns an ID.

| # | What the prototype does | Question |
| --- | --- | --- |
| OQ-01 | A fixed nav carrying a mark and a section index (`01 / 06`) that tracks the scrolled section. | Does it ship in v1, and does the index survive sections being added or removed? |
| OQ-02 | A scroll progress bar pinned to the top of the viewport. | Ships, or dropped as decoration? |
| OQ-03 | A marquee strip below the hero, translated by scroll position rather than autoplaying, carrying four fixed phrases. | Ships? If so, its copy is static content and needs an `en` translation. |
| OQ-04 | A closing CTA section — headline plus a call to action — which is also what physically contains the social links of FR-23. | FR-23 and FR-24 specify the links but nothing specifies the section around them. Its copy needs a home in `content/` and an `en` translation. |
| OQ-05 | Each project card and project modal carries a bespoke decorative SVG. | No column holds it and it cannot be derived from `category`. Presentation keyed by `slug`, or a new column? See the extension points in [domain/data-model.md](domain/data-model.md#extension-points). |
| OQ-06 | The card eyebrow embeds an ordinal — `01 — agendamento`. | FR-06 renders `projects.category` there. Is the ordinal derived from `sort_order` at render time, or genuinely part of the category text? Storing it duplicates the ordering in translatable copy. |
| OQ-07 | The availability badge (FR-02) is fixed text. | FR-02 requires it to reflect a boolean. Where does that boolean live — a `content/` constant, or something else? |

Two places where the prototype is wrong and the requirement stands:

- **Ordering.** The prototype renders the timeline oldest-first. FR-11 requires
  `started_on` descending and is correct: the most recent experience comes
  first. The prototype's alternating layout and its expand control both assume
  the old order and are re-derived, not copied.
- **Animation lifetime.** Neither canvas in the prototype cancels its
  `requestAnimationFrame` loop. FR-04 exists to correct that.

One place where the prototype already answers a requirement: the `pt-BR` copy
FR-22 asks for exists in its stat band. Only the `en` translation is new.

## Traceability

Every requirement is delivered by a phase in [roadmap.md](roadmap.md):

| Requirements | Phase |
| --- | --- |
| Schema, seed, repositories behind FR-05…FR-28; FR-34, FR-35, NFR-10, NFR-11 | 1 |
| Use cases behind FR-05…FR-28; FR-31, FR-34, NFR-08, NFR-09 | 2 |
| FR-01…FR-24, FR-29…FR-33, FR-36, NFR-01…NFR-06, NFR-12…NFR-14 | 3 |
| FR-25…FR-28 | 4 |
| NFR-01 verified in production | 5 |
| WN-01 | 6 |
