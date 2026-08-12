# Stack

| Layer | Choice | Version |
| --- | --- | --- |
| Framework | Next.js, App Router | 15 |
| UI | React | 19 |
| Language | TypeScript, `strict` | 5.6 |
| Database | PostgreSQL | 16+ |
| Package manager | pnpm workspaces | 9 |
| Hosting | Vercel | — |

One Next.js project serves the pages and the public endpoints. See
[monorepo.md](monorepo.md) for the workspace layout.

## Why Next.js

Next.js is a React framework, not an alternative to React: components are
ordinary React. What it adds is what this project needs:

| Need | Provided by |
| --- | --- |
| Routes `/en-US`, `/pt-BR/projetos` | File-system routing with a `[locale]` segment |
| Detecting the visitor's language | Middleware, before the page renders |
| Reading Postgres without exposing an API | Server Components |
| Public endpoints for other projects (Phase 6) | Route Handlers under `src/app/api/` |
| Deploy | First-party on Vercel, no configuration |

Plain React (Vite) would leave routing, server rendering and the HTTP surface to
assemble by hand — and the endpoints would need a separate server, which is the
deployment we deliberately removed.

## Server and Client Components

App Router components are **Server Components by default**. They run only on the
server, may query the database directly, and ship no JavaScript to the browser.
A component needs the `'use client'` directive to use state, effects, event
handlers, or any browser API.

This split decides the component tree, so it is settled here rather than
per-component:

| Section | Kind | Why |
| --- | --- | --- |
| Page shells (`page.tsx`, `layout.tsx`) | Server | Fetch content for the requested locale, pass it down as props |
| Language switcher | Client | Writes the cookie, navigates to the other prefix |
| Project cards, timeline cards | Server | Static markup from data |
| Footer links | Server | `icon_svg` is inlined at render time |
| Hero canvas field | **Client** | `requestAnimationFrame`, pointer tracking |
| Skills orbit canvas | **Client** | Canvas animation, hit testing, click handling |
| Skill and project modals | **Client** | Open/close state |
| Scroll progress, timeline spine fill, stat band parallax | **Client** | Scroll listeners |

The rule that follows: **data fetching happens in Server Components and is passed
down as props.** A Client Component never queries the database — it receives
plain serializable data, already resolved to one language: a Client Component
receives `string`, never a `LocalizedText` or raw `jsonb`. The prototype's interactive pieces
(`heroField`, `skillsCanvas`, the modals, the scroll handlers)
all become Client Components fed by a Server Component above them.

## Localization and routing

Locales are `en-US` and `pt-BR`. Every page lives under a `[locale]` segment:

```
src/app/[locale]/page.tsx              /en-US          /pt-BR
src/app/[locale]/projetos/page.tsx     /en-US/projetos /pt-BR/projetos
src/app/[locale]/projetos/[slug]/page.tsx
```

`generateStaticParams` returns both locales, so each page is built once per
language and stays static (NFR-01).

### Choosing the locale

The default is **the visitor's browser language**, not a fixed one. Resolution
order, highest priority first:

| # | Source | Why it wins |
| --- | --- | --- |
| 1 | The URL's `[locale]` segment | An explicit address, and what a shared link carries |
| 2 | A `locale` cookie | The visitor used the language switcher; that choice must outlast one page |
| 3 | `Accept-Language` | The browser's stated preference |
| 4 | `en-US` | Fallback when the header names no supported language |

Only a request to `/` needs resolving — `middleware.ts` negotiates
`Accept-Language` against the supported list and redirects to the matching
prefix. Requests that already carry a locale pass straight through to the static
page.

Two consequences worth stating:

- **The redirect must not be cached across visitors.** A cached `/` → `/en-US`
  would send every later visitor to English regardless of their browser.
  The redirect is per-request; only the destination pages are static.
- **The switcher writes a cookie.** Without it, a Brazilian visitor who picks
  Portuguese is sent back to `/en-US` on the next visit to `/`, and the
  switcher appears broken.

`Accept-Language` is a hint, never an identity. It is read to pick a language
and not stored.

### Two different meanings of "default"

They are easy to conflate and mean different things:

- **Default UI language** — what a visitor gets when they express no preference.
  That is their browser's language.
- **Fallback locale** — what is rendered when a specific field has no
  translation in the requested language. That is always `en-US`, guaranteed by
  the `is_localized` constraint in
  [../domain/data-model.md](../domain/data-model.md).

So a Brazilian visitor sees a Portuguese page with English text in any field
that has not been translated yet — not a missing section, and not an English
page. `en-US` is the language every field is required to carry; `pt-BR` is the
one that may lag behind.

## Data access

Pages import `@portfolio/db` directly. No HTTP hop, no fetch, no cache layer for
the site's own content — the page and the database query run in the same
process.

`@portfolio/db` must never be imported from a Client Component. Doing so leaks a
database driver and connection string into the browser bundle; the boundary is
the composition root in `src/lib/`.

## Rendering strategy

Portfolio content changes rarely, so pages are **statically generated and
revalidated on a timer** rather than rendered per request:

```ts
export const revalidate = 3600;
```

Publishing an edit can force an immediate rebuild through on-demand
revalidation. Route Handlers under `/api/v1` are always dynamic — they run per
request and are never cached.

## TypeScript

`strict`, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` (see
`tsconfig.base.json`). Nullable database columns map to `T | null` in the domain
— the type system carries the same information the schema does.

## Not chosen

| Rejected | Why |
| --- | --- |
| Vite + React SPA | No server rendering, no endpoints without a second deployment |
| A separate API service | Removed — see [monorepo.md](monorepo.md) |
| An ORM | Six tables and hand-written SQL in `packages/db` is less machinery than a schema DSL. Revisit if the table count grows. |
| A CSS framework | The prototype's design is already written in plain CSS with custom properties. Porting it is a copy, not a rewrite. |
