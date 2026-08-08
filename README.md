<div align="center">

# Personal Portfolio

**Davi Naves' portfolio — a bilingual site whose content lives in a database, not in hardcoded objects.**

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![pnpm](https://img.shields.io/badge/pnpm_9-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

![Status](https://img.shields.io/badge/status-in_development-yellow?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Locales](https://img.shields.io/badge/i18n-pt--BR_%7C_en-informational?style=flat-square)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)](.github/workflows/ci.yml)

[Prototype](https://claude.ai/public/artifacts/4374a464-6647-49d7-9140-050f767c3d3a) ·
[Documentation](docs/README.md) ·
[Roadmap](docs/roadmap.md)

</div>

---

## 🎯 Purpose

This is a portfolio **and** a demonstration piece. It exists to show, in real
code, how I build software when nobody is rushing me: clean layer boundaries, a
typed monorepo, a real test pyramid and documentation kept in sync with the
implementation.

The site started as a static prototype where adding a project meant editing
markup and shipping a deploy. Here, the same experience is rebuilt as a layered
application whose content is data — a project is an insert, not a commit.

**What it is meant to demonstrate**

- 🧱 **Clean Architecture** — domain rules in a package with zero runtime dependencies, testable in milliseconds
- 🌐 **Real internationalization** — translated content per locale with a fallback chain, not a strings file
- 🗄️ **Content as data** — projects, timeline, skills and links modelled in PostgreSQL
- 🧪 **A full test pyramid** — unit, integration, component and end-to-end, each owned by its layer
- 📐 **Design before code** — requirements, data model and roadmap written first and kept honest

## ✨ Features

| | Feature |
| :-- | :-- |
| 🌍 | **Bilingual `pt-BR` / `en`** — the visitor's browser language decides, `pt-BR` covers anything untranslated |
| 🔀 | **Per-locale routes** — every page is addressable in both languages, and the manual switch outranks the browser |
| 🚀 | **Animated hero** — headline, availability badge driven by a boolean, and an interactive particle field |
| 💼 | **Project showcase** — featured cards with category, tags, progress bar and a detail view with the skills applied |
| 📄 | **Shareable project pages** — a public list plus one canonical page per project, same slug in every language |
| 🕒 | **Scroll-aware timeline** — professional, academic and certification entries, ongoing ones worded per kind and locale |
| 🛰️ | **Orbital skill map** — skills grouped by category; picking one reveals everywhere it was used, with context |
| 📊 | **Stat band and social footer** — figures that animate into view, links rendered from inline SVG |
| ♿ | **Accessible by requirement** — keyboard-closable modals with focus return, and a Lighthouse a11y score of 95+ |
| 📱 | **Responsive** — verified at 380 px, 760 px and desktop |
| ⚡ | **Static by default** — pages pre-rendered and revalidated hourly; the database never reaches the client bundle |
| 📈 | **Telemetry-ready** — public access-counting endpoints are designed and deliberately deferred |

## 🛠️ Stack

| Layer | Choice |
| :-- | :-- |
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript 5.6, `strict` |
| Database | PostgreSQL 16+ |
| Monorepo | pnpm 9 workspaces |
| Tests | Vitest, Testing Library, Playwright |
| CI / Hosting | GitHub Actions · Vercel |

Why each of these — and the Server/Client Component split that follows from it —
is argued in [docs/architecture/stack.md](docs/architecture/stack.md).

## 🧭 Architecture at a glance

One deployable, three packages, dependencies pointing inward:

```
apps/web        Next.js — pages and, later, public endpoints
packages/core   Domain + application rules. Framework-free, zero dependencies.
packages/db     Persistence: migrations, mappers, repositories
packages/telemetry  Access counting — self-contained, deferred
```

`web → core ← db`: the domain knows nothing about Next.js, React or a database
driver, so it can outlive all three.
See [clean-architecture.md](docs/architecture/clean-architecture.md) and
[monorepo.md](docs/architecture/monorepo.md).

## 🚦 Status

**Requirements and design are complete; implementation is starting.** The
workspace, TypeScript config, Docker Compose and CI pipeline are in place; the
feature list above describes v1 as specified, not as shipped. Current phase and
what lands next: [docs/roadmap.md](docs/roadmap.md).

## 🏁 Running locally

Requires Node 20+, pnpm 9 and Docker.

```bash
pnpm install && cp .env.example .env && docker compose up -d postgres
```

```bash
pnpm db:migrate && pnpm db:seed && pnpm dev
```

Useful scripts: `pnpm test` (unit + component), `pnpm test:integration` (real
PostgreSQL), `pnpm test:e2e` (Playwright), `pnpm typecheck`, `pnpm build`.
Environment variables are documented in [`.env.example`](.env.example).

## 📚 Documentation

| Document | Purpose |
| :-- | :-- |
| [docs/README.md](docs/README.md) | Index and v1 scope |
| [requirements.md](docs/requirements.md) | What v1 must do — and what it explicitly won't |
| [roadmap.md](docs/roadmap.md) | Phases, deliverables, exit criteria |
| [testing.md](docs/testing.md) | Test levels, tooling, CI |
| [data-model.md](docs/domain/data-model.md) | Tables, enums, conventions |
| [architecture/](docs/architecture/) | Layers, stack rationale, monorepo layout |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branch, commit and pull request conventions |

## 📄 License

[MIT](LICENSE) © Davi Naves
