# Design — Bilingual site shell: locale routing, negotiation and switcher

Issue [#3](https://github.com/NavesDev/orbit-portfolio/issues/3) · branch
`feat/3-bilingual-site-shell` · roadmap 3.1–3.2 (and 3.9, brought forward) ·
sprint 1, task 2.

Normative sources: [requirements.md](../../requirements.md) (FR-29–FR-36,
NFR-01–NFR-06, NFR-09, NFR-12–NFR-14), [stack.md](../../architecture/stack.md),
[monorepo.md](../../architecture/monorepo.md),
[data-model.md](../../domain/data-model.md) (length budgets) and
[testing.md](../../testing.md). Where this document and those disagree, they
win.

The [prototype](https://claude.ai/public/artifacts/4374a464-6647-49d7-9140-050f767c3d3a)
is the functional specification for appearance and behaviour. Its `:root` block,
its nav, its progress bar and its scroll-driven strip are **ported**, not
redesigned; the two places this document departs from it are named in
[Divergences from the prototype](#divergences-from-the-prototype).

## Goal

`/en-US` and `/pt-BR` both render the site shell. A visitor landing on `/` is sent
to the language their browser asks for, can change it, and that choice outranks
the browser on every later visit.

Every section that fills the shell — hero, projects, timeline, stat band,
footer — arrives in sprint tasks 3 to 6. This task delivers what surrounds them.

## Scope

**In:** the `Locale` enum and the `LocalizedText` value object in
`packages/core`; the `[locale]` route segment and its layout; locale negotiation
in `proxy.ts`; the `locale` cookie; the language switcher; `content/en-US/`
and `content/pt-BR/`; `tokens.css` and global styles; and the site chrome — the
fixed nav with its section index, the scroll progress bar and the scroll-driven
marquee strip.

**Out:** every content section (tasks 3–6), the skills orbit and the `/projetos`
subpages (later sprints), the Playwright harness (see
[Deferred: the E2E journey](#deferred-the-e2e-journey)), and every repository,
port and use case — this task reads nothing from the database.

## Decisions taken here

Three gaps that [sprint-01.md](../../sprints/sprint-01.md) records as
unresolved are answered by this document. They are decisions, not discoveries.

| Gap | Decision |
| --- | --- |
| **U-2** — the nav, progress bar and strip are covered by no `FR` | All three ship, driven by a section registry rather than by the prototype's hardcoded list. Their `pt-BR` copy is authored here and listed below. |
| **U-4** — `locale` cookie attributes | `Max-Age` one year, `SameSite=Lax`, `Path=/`, `Secure` outside development, readable by the client. |
| Unknown locale segment | `/fr` returns 404. Nothing renders a shell with a `lang` the site does not have. |

## Components

### 1. `Locale` — `packages/core/src/domain/enums/locale.ts`

```ts
export const LOCALES = ['en-US', 'pt-BR'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en-US';
export function isLocale(value: string): value is Locale;
```

`LOCALES` is the single list. The route's `generateStaticParams`, the
negotiator, the switcher and the content record all derive from it, so adding a
third locale (`WN-06` keeps that out of v1) is one edit plus one migration to
`is_localized`, never a search for hardcoded pairs.

`DEFAULT_LOCALE` is the **fallback** of [stack.md](../../architecture/stack.md)
§ "Two different meanings of default" — what renders when a field lacks a
translation. It is not the default UI language, which is the visitor's browser.
`en-US` is the locale every localized field must carry; `pt-BR` may lag behind.

### 2. Length budgets — `packages/core/src/domain/constants/text-budgets.ts`

The table in [data-model.md § Length budgets](../../domain/data-model.md) as
named constants:

```ts
export const TITLE_MAX_LENGTH = 160;
export const CATEGORY_MAX_LENGTH = 40;
export const TAG_MAX_LENGTH = 60;
export const TAGS_MAX_ITEMS = 8;
export const USAGE_NOTE_MAX_LENGTH = 240;
export const DESCRIPTION_MAX_LENGTH = 8000;
```

They exist now, before the entities that use them, because `LocalizedText`
takes a budget and a call site passing a bare `160` is the magic number this
file removes. `migrations/002_localization_functions.sql` enforces the same
numbers as the second line of defence (NFR-08); the constants and the migration
are two expressions of one table, and both cite it.

### 3. `LocalizedText` — `packages/core/src/domain/value-objects/`

```ts
LocalizedText.create(values: Record<string, unknown>, maxLength: number): LocalizedText
localizedText.resolve(locale: Locale): string
```

`create` throws `InvalidLocalizedTextError` when the value is not a plain
object, when `en-US` is absent, when any key is outside `LOCALES`, when any
value is not a string, or when any value exceeds `maxLength` (NFR-10, NFR-11).
The error carries a reason code so a caller can distinguish the five without
parsing a message.

`resolve` returns `values[locale] ?? values[DEFAULT_LOCALE]`. Because `create`
guarantees `en-US`, it always returns a non-empty string — FR-34 holds by
construction rather than by a null check at every call site.

**The budget is an argument, not a subclass.** One value object serves every
localized column; a new column is a new constant, not new code.

**Instances never reach presentation.** Use cases resolve to `string` when
building output DTOs (NFR-13). Nothing in this task constructs one from a
database row — there is no repository yet — so its only consumer here is its
own unit tests. It ships now because task 2 is where FR-34 is specified, and
tasks 4–6 all depend on it.

### 4. Errors — `packages/core/src/domain/errors/`

`DomainError` as the base every later invariant extends, and
`InvalidLocalizedTextError`. Failures are thrown at construction: an invalid
value object never exists to be passed around, so no downstream code has to ask
whether it is valid.

### 5. Route segment — `apps/web/src/app/`

| File | Change |
| --- | --- |
| `app/layout.tsx` | Becomes a pass-through returning `children`. |
| `app/[locale]/layout.tsx` | New. Renders `<html lang>`, `<body>`, the chrome and `children`. |
| `app/[locale]/page.tsx` | New. The home page, empty of sections until task 3. |
| `app/page.tsx` | Deleted — `proxy.ts` owns `/`. |

`<html>` and `<body>` belong to the `[locale]` layout, because `lang` must be
the resolved locale and only that layout knows it. The root layout stays as a
pass-through because the App Router requires a file at `app/layout.tsx`; its
existing comment already anticipates exactly this move.

The segment exports `generateStaticParams` over `LOCALES` and
`revalidate = 3600` (NFR-01), and calls `notFound()` when the segment is not a
known locale — an unrecognized prefix is an error, not a locale to guess at.

### 6. Negotiation — `proxy.ts` and `src/lib/locale/`

The matcher is `['/']`. Only `/` needs resolving, so `/api`, `/_next` and the
static pages never enter the proxy at all — a narrower matcher than an
exclusion pattern, and one that cannot accidentally start matching something
new. When [monorepo.md](../../architecture/monorepo.md)'s Phase 6 CORS and rate
limiting arrive, they widen the matcher and live in their own function.

Resolution order (FR-30, FR-31, FR-33), highest first:

1. the `locale` cookie, if its value is a known locale;
2. `Accept-Language`, best match by q-value, matching `en-GB` → `en-US` and
   `pt` → `pt-BR` by primary subtag;
3. `DEFAULT_LOCALE` (`en-US`).

The response is a `307` carrying `Cache-Control: no-store` — NFR-12 is the
whole reason this is proxy and not a page. The header is read to pick a
prefix and written nowhere (NFR-14).

Two pure modules do the work, and the proxy only wires them:

- `src/lib/locale/negotiate-locale.ts` — parses the header. No framework
  import, so its tests call it directly with a string.
- `src/lib/locale/locale-cookie.ts` — the cookie's name and attributes.

**Accept-Language parsing lives in `apps/web`, not in `core`.** It is an HTTP
concern, and `core` holds domain and application layers that must not know how
a request reaches them.

### 7. The cookie — `src/lib/locale/locale-cookie.ts`

| Attribute | Value | Why |
| --- | --- | --- |
| Name | `locale` | Named by [stack.md](../../architecture/stack.md). |
| `Max-Age` | `60 * 60 * 24 * 365` | Survives closing the tab (FR-33). |
| `SameSite` | `Lax` | Still sent on the top-level navigation to `/`, which is the only read. |
| `Path` | `/` | Read on `/`, written from any page. |
| `Secure` | outside development | It travels on every request; there is no reason for it to travel in clear. |
| `HttpOnly` | no | The switcher is a Client Component and writes it. Nothing secret is in it. |

One module holds them, read by the proxy and written by the switcher, so
the two cannot drift apart.

### 8. Static content — `apps/web/src/content/`

`content/en-US/index.ts` is authored first and **defines the shape**;
`content/pt-BR/index.ts` is annotated with that shape, so a missing key is a
compile error rather than a blank space — the property
[monorepo.md](../../architecture/monorepo.md) asks of this folder.
`content/index.ts` exposes `getContent(locale)` over a `Record<Locale,
SiteContent>`, which is exhaustive over `LOCALES` by type.

This task's copy is the chrome's: the nav mark, the skip link, the switcher's
labels and accessible names, and the strip's four phrases.

**New `en-US` copy authored here** (U-2 records that no requirement owns it).
Proper nouns are not translated (FR-35), so the strip is nearly unchanged:

| `pt-BR` | `en` |
| --- | --- |
| `Claude Code · automation` | `Claude Code · automação` |
| `PostgreSQL · REST APIs` | `PostgreSQL · APIs REST` |
| `Next.js · React · Node` | unchanged |
| `UNIP · ADS · Brasília` | unchanged |

### 9. The chrome — `apps/web/src/components/ui/`

The prototype hardcodes `sections = ['hero','work','timeline','skills','band','cta']`
and the literal `' / 06'`, and every section it names is added by a later task.
Ported as written, this issue would ship a nav counting sections that do not
exist.

`section-registry.ts` holds an ordered `SECTION_IDS` array — **empty in this
issue** — that each later task appends to. The index derives both its position
and its total from it. **While the registry is empty the index renders
nothing**: an index reading `00 / 00` is noise, and hiding it needs no
coordination with the tasks that will fill it.

| Component | Kind | Notes |
| --- | --- | --- |
| `site-nav.tsx` | Server | Mark, plus the switcher and the index as children. |
| `section-index.tsx` | Client | Tracks the active section; renders nothing on an empty registry. |
| `scroll-progress.tsx` | Client | Width from scroll fraction. `aria-hidden`. |
| `marquee-strip.tsx` | Client | Translated by scroll offset, not autoplaying. Duplicate phrase set `aria-hidden`. |
| `language-switcher.tsx` | Client | See below. |

All three scroll-driven pieces subscribe to one hook,
`src/hooks/use-scroll-progress.ts`: a single `requestAnimationFrame`-throttled
`scroll` listener with a subscriber list, unsubscribed on unmount and cancelled
when the last subscriber leaves. This is roadmap 3.9 ("scroll behaviours
consolidated into one hook") arriving now instead of as a later refactor —
three components each attaching their own listener would be more code to write
and then more code to remove.

The progress bar and the strip's duplicate set are `aria-hidden`. Both restate
what the scrollbar already conveys, and announcing them costs an accessibility
score rather than earning one (NFR-06).

### 10. The switcher — `language-switcher.tsx`

One link per locale, rendered with `next/link`, the current one marked
`aria-current="true"`. Links, not buttons: the switcher works without
JavaScript, is keyboard-operable and focusable for free, and a shared URL
carries the language (FR-32).

Activating a link writes the cookie through `locale-cookie.ts`, then navigates
to the same path under the other prefix — the path is read from `usePathname`
and its first segment replaced, so the switcher keeps working when
`/[locale]/projetos` exists without being edited.

### 11. Styles — `apps/web/src/styles/`

`tokens.css` is the prototype's `:root` ported verbatim — `--bg`, `--ink`,
`--ink-soft`, `--ink-faint`, `--line`, `--line-strong`, `--blue`, `--blue-soft`,
`--blue-line`, `--ease` — plus the horizontal page padding, which the prototype
repeats as a literal `48px` / `24px` across nine rules, as one responsive token.

`globals.css` carries the reset, `body` typography, `::selection` and the focus
ring. Everything after that is a CSS Module beside its component.

Breakpoints stay at the prototype's `760px` and `420px`; NFR-04's 380 px is
inside the smallest of them.

## Divergences from the prototype

Both are deliberate, and both are reported in the pull request's **Decisions**
section.

1. **Fonts.** The prototype pulls Inter Tight and Newsreader through a Google
   Fonts `@import` inside its stylesheet — render-blocking, and a third-party
   request on every page load. Replaced with `next/font/google`, which
   self-hosts them at build time. Same faces, same weights.
2. **A `:focus-visible` ring.** The prototype has none, so its nav and its
   buttons are invisible to a keyboard. NFR-06 requires ≥ 95 and NFR-05 assumes
   a visible focus path, so one is added on the tokens' `--blue`.

## Testing

Following the levels in [testing.md](../../testing.md) — **which this task
amends**. That document's table assumed `apps/web` held React components and
nothing else, so it had no row for the proxy and the `lib/locale` modules
this task introduces. Calling them component tests would have been a lie about
what they do, and calling them integration tests would have contradicted the
axis that makes `pnpm test` fast. The amendment lands in the same pull request,
as [CLAUDE.md](../../../CLAUDE.md) requires when the document is the thing that
is wrong.

**Unit — `packages/core`.** `LocalizedText` rejects a non-object, a missing
`pt-BR`, an unknown locale key, a non-string value and an over-budget value —
one test each, because each is a separate rule. `resolve('pt-BR')` on a field
holding only `en-US` returns the English text (FR-34); `resolve` on a field
holding both returns the requested one. `isLocale` accepts both locales and
rejects `en` and `en_US`.

**Unit — `apps/web/src/lib` and `apps/web/src/proxy.ts`.** The level
[testing.md](../../testing.md) gains in this task, for request-level logic that
is neither domain nor component. Two files.

`lib/locale/negotiate-locale.test.ts` covers an English header, a Portuguese
header, `en-GB`, an unsupported language, a q-value list whose preferred entry
is not first, an empty header and an absent one; plus the cookie module's
attributes, including `Secure` following the environment.

`proxy.test.ts` covers the acceptance criteria phrased as "a request to
`/`" by calling the handler with a `NextRequest` and reading the response — no
browser, no running server, in the fast suite:

| Request to `/` | Expected |
| --- | --- |
| `Accept-Language: en-GB,en;q=0.9` | `307` to `/en-US` (FR-30) |
| `Accept-Language: pt-BR,pt;q=0.9` | `307` to `/pt-BR` (FR-30) |
| `Accept-Language: fr` | `307` to `/en-US` (FR-31) |
| no `Accept-Language` | `307` to `/en-US` (FR-31) |
| cookie `locale=pt-BR` plus an English header | `307` to `/pt-BR` (FR-33) |
| cookie `locale=xx` plus an English header | `307` to `/en-US` — a corrupt cookie is ignored, not trusted |
| any of the above | `Cache-Control: no-store` (NFR-12) |

This is the layer that actually closes those criteria. It exercises the real
proxy rather than only the pure function underneath it, so a wiring
mistake — reading the cookie after the header, forgetting the cache header —
fails a test instead of surviving to the browser.

`NextRequest` needs Web APIs rather than a DOM, so this file declares
`@vitest-environment node` while the rest of the `web` project stays on
`jsdom`.

**Component — `apps/web/src/components`.** Through Testing Library, by role and
accessible name, never by class:

- the switcher renders a link per locale and marks the current with
  `aria-current`;
- activating the other locale writes the cookie and navigates to the same path
  under the other prefix;
- the section index renders nothing while `SECTION_IDS` is empty;
- the layout sets `lang` to the resolved locale.

**New dev dependencies in `apps/web`**, none of which are installed yet:
`@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`,
`jsdom` and `@vitejs/plugin-react`, plus a Vitest setup file. The existing
`vitest.config.ts` already declares the `web` project and the `jsdom`
environment; it gains the React plugin and the setup file.

### Deferred: the E2E journey

[testing.md](../../testing.md) lists journey 6 — a request to `/` with an
English `Accept-Language` lands on `/en-US`, an unsupported language lands on
`/en-US`, and the switcher's choice then outranks the header on the next visit.
It restates this task's acceptance criteria almost word for word — but **it is
not the level those criteria need.** "A request to `/`" is an HTTP request, and
`proxy.ts` is a directly callable function, so the proxy tests above
close FR-30, FR-31, NFR-12 and the cookie's precedence in the fast suite. What
E2E adds over them is a real browser, not a real request.

The journey is still deferred, for a reason that is now much narrower.
`testing.md`'s per-phase table closes Phase 3 on "component per section; locale
negotiation and fallback; accessibility checks" and assigns the six E2E
journeys to Phase 4 — this task is roadmap 3.1–3.2. And Playwright is not
installed; scaffolding a browser harness is its own decision with its own CI
question, which [CLAUDE.md](../../../CLAUDE.md) forbids riding along inside
feature work.

**What a browser would add that this task's tests do not.** One round trip: the
switcher writing the cookie through a real cookie jar, that jar persisting it
across a restart, and the next request to `/` carrying it back. The proxy
tests prove the proxy honours a cookie that is present; the component
tests prove the switcher asks for one with a year's `Max-Age`. Nothing here
proves a browser then does what it was asked. That is the gap, it is one
criterion wide (FR-33's "survives closing the tab"), and it is verified by hand
against a running app until the deferred issue lands.

**A `test` issue is opened alongside this one**: the Playwright harness, and
journey 6 as the browser round trip the proxy tests cannot reach — switch
language, restart the browser, request `/`, land on the chosen locale. Until it
lands, that round trip is verified by hand against a running app and what was
checked is written down in the pull request.

## Verification before the pull request

- `pnpm typecheck`, `pnpm test`, `pnpm build` green. `pnpm test` now includes
  the proxy tests, which is where FR-30, FR-31, NFR-12 and the cookie's
  precedence are proven.
- Against `pnpm dev`, by hand — only what the suite cannot reach: the switcher
  writes the cookie, the choice survives a browser restart, and the next visit
  to `/` honours it over an English header (FR-33). Plus `/fr` returning 404.
- Layout at 380 px, 760 px and desktop (NFR-04).
- `web-design-guidelines` run before the pull request opens, as
  [CLAUDE.md](../../../CLAUDE.md) requires of any PR touching components.

## Requirements covered

FR-29, FR-30, FR-31, FR-32, FR-33, FR-34, FR-35; NFR-01, NFR-04, NFR-06,
NFR-09, NFR-10, NFR-11, NFR-12, NFR-14.

FR-36 (one `slug` across locales) has nothing to bind to until `/projetos`
exists in sprint 2. NFR-02, NFR-03 and NFR-13 are structural here and asserted
by inspection: no component in this task imports `@portfolio/db`, because
nothing in this task reads the database.
