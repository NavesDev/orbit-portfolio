# Contributing

How work happens in this repository: where a change starts, what it is named,
how it is committed and what has to be true before it is merged.

The rules below are not bureaucracy for its own sake — this project is a
demonstration piece, and its history is part of what it demonstrates. A reader
should be able to follow `git log` and understand what was built and why.

---

## The loop

Every change follows the same five steps. There are no exceptions for "small"
changes.

1. **An issue exists** — the work is described as a task before it is written.
2. **A branch is cut from `main`** — named after the issue.
3. **Commits are made on that branch** — conventional, scoped, small.
4. **A pull request is opened** — filled in with the template, linked to the issue.
5. **CI is green and the PR is reviewed** — then it is merged and the branch deleted.

> **`main` is protected by convention: never commit to it directly.**
> Not for a typo, not for a README line, not for a one-character fix. If you
> catch yourself with commits on local `main`, move them:
> `git branch <type>/<n>-<slug> && git reset --hard origin/main`.

---

## 1. Work starts as a task issue

No branch exists without an issue behind it. The issue is where the *what* and
the *why* are argued; the pull request is only where the *how* is reviewed.

Open one with the **Task** issue template. A good task issue carries:

| Field | What it holds |
| --- | --- |
| **Description** | What is being delivered, in behaviour terms. |
| **Expected outcome** | What is true afterwards that was not true before. |
| **Acceptance criteria** | Checkable statements. If a criterion cannot fail, it is not a criterion. |
| **Scope boundary** | What this task deliberately does *not* cover. |
| **References** | The documents in [`docs/`](docs/) the task derives from. |

This mirrors how work is already specified in
[`docs/sprints/sprint-01.md`](docs/sprints/sprint-01.md) — a sprint task and a
task issue are the same shape. When a sprint task is picked up, its section is
copied into an issue rather than paraphrased.

**Labels.** Tag the issue with its type (`feat`, `fix`, `docs`, `chore`, …) and
its area (`core`, `db`, `web`, `telemetry`, `ci`, `docs`). The type label decides
the branch and commit prefix, so it is chosen once, at the issue, and reused
everywhere after.

---

## 2. Branch naming

```
<type>/<issue-number>-<short-slug>
```

The type is the issue's type label. The slug is two to four words, lowercase,
hyphen-separated, describing the task — not the implementation.

```bash
git checkout main && git pull
git checkout -b feat/12-project-cards
```

**Examples**

```
feat/12-project-cards
fix/47-locale-fallback-on-empty-translation
docs/8-data-model-conventions
refactor/33-extract-project-mapper
test/21-timeline-repository-integration
chore/5-pin-pnpm-version
ci/16-cache-playwright-browsers
```

**Types**

| Type | Use for |
| --- | --- |
| `feat` | A new capability visible to a user or a caller |
| `fix` | Corrected behaviour that was specified and wrong |
| `docs` | Anything under `docs/`, `README.md`, this file |
| `refactor` | Structure changes with no behaviour change |
| `test` | Tests added or reworked without touching production code |
| `perf` | Measurable performance work |
| `chore` | Dependencies, tooling, configuration, housekeeping |
| `ci` | Pipeline and workflow files |

**Rules**

- One branch, one issue. If the work splits, open a second issue and a second branch.
- Branch from up-to-date `main`, never from another feature branch — unless you
  genuinely depend on it, and then say so in the PR.
- No personal prefixes (`davi/…`), no bare names (`fix-stuff`), no issue-less branches.
- Delete the branch after the PR merges.

---

## 3. Commit messages

[Conventional Commits](https://www.conventionalcommits.org), with the affected
package or area as the scope:

```
<type>(<scope>): <subject>

[optional body — why, not what]

[optional footer — Refs #12]
```

**Scopes** follow the workspace layout: `core`, `db`, `web`, `telemetry`, `docs`,
`ci`, `deps`. Use a narrower scope when it is clearer (`db/migrations`,
`web/home`).

**Subject line**

- Imperative mood: *add*, not *added* or *adds*.
- Lowercase start, no trailing period.
- 72 characters or fewer.
- Describes the change, not the file touched.

**Examples**

```
feat(db): add timeline repository with locale fallback
feat(web): render project cards from the projects use case
fix(core): fall back to pt-BR when a translation key is absent
refactor(core): extract locale resolution into a value object
test(db): cover skill-usage joins against a real PostgreSQL
docs(architecture): document the server/client component split
chore(deps): bump vitest to 2.1.5
ci: run integration tests against postgres 16
```

**Body.** Optional for obvious changes, expected when a decision was made. Explain
the reasoning and the alternative rejected — the diff already shows what changed.

```
fix(web): resolve locale from the header before the cookie

The cookie was read first, so a visitor who had never used the switch
inherited whatever locale the previous tab wrote. The manual switch must
outrank the browser, but only once it has actually been used.

Refs #47
```

**Breaking changes** get a `!` after the scope and a `BREAKING CHANGE:` footer:

```
feat(core)!: return a Result from every use case

BREAKING CHANGE: use cases no longer throw; callers must inspect the Result.
```

**Rules**

- One logical change per commit. A commit that needs "and" in its subject is two commits.
- Every commit compiles and passes `pnpm typecheck`. No "wip", no "fix previous commit".
- Rebase and squash noise out of your branch before requesting review.
- Reference the issue in the footer (`Refs #12`), and close it from the PR body, not from a commit.

---

## 4. Pull requests

Open the PR as soon as the branch has its first meaningful commit — as a draft if
the work is unfinished. An early draft PR is how CI and reviewers see the
direction before it is expensive to change.

**Title.** Same format as a commit subject: `feat(web): render project cards`.

**Body.** The [template](.github/PULL_REQUEST_TEMPLATE.md) is filled in, not
deleted. It asks for the linked issue, what changed, how it was verified and what
was deliberately left out.

**Linking.** Put `Closes #12` in the body so the issue closes on merge. A PR
without a linked issue is missing its justification and will be asked for one.

**Size.** Keep it reviewable — roughly under 400 changed lines of production code.
If a task cannot fit, split the task, not the review.

**Merging.** Squash merge, keeping a conventional-commit subject, so `main` reads
as one commit per task. Requirements before merge:

- CI is green — `typecheck`, `test`, `test:integration`, `build`.
- Every template checkbox is honestly ticked, or explained.
- Review comments are resolved, not just replied to.
- The branch is up to date with `main`.

Self-merging your own PR is acceptable on this repository — it has one
maintainer — but only after CI passes and the template is complete. The process
exists to leave a record, not to simulate a team.

---

## 5. Code standards

The architecture documents are normative. A PR that violates them is a PR that
needs a documentation change first.

- **Layer boundaries.** `web → core ← db`. `packages/core` has zero runtime
  dependencies and imports nothing from `web`, `db` or any framework. See
  [clean-architecture.md](docs/architecture/clean-architecture.md).
- **TypeScript.** `strict`, no `any`, no non-null assertions to silence the
  compiler. Types describe the domain, not the ORM.
- **Tests.** Each layer owns its level: domain logic is unit-tested in `core`,
  repositories are integration-tested against a real PostgreSQL, components are
  tested with Testing Library, and flows with Playwright. See
  [testing.md](docs/testing.md). New behaviour ships with the test that would have
  caught its absence.
- **Database.** Migrations are forward-only and idempotent; never edit a migration
  that has run. Conventions live in [data-model.md](docs/domain/data-model.md).
- **i18n.** No user-facing string is hardcoded in a single language. `pt-BR` is the
  fallback for anything untranslated.
- **Documentation.** If a change makes a document wrong, the document is corrected
  in the same PR.

**Before pushing**

```bash
pnpm typecheck && pnpm test && pnpm build
```

Integration tests need the database up:

```bash
docker compose up -d postgres && pnpm test:integration
```

---

## 6. Setting up

Node 20+, pnpm 9, Docker.

```bash
pnpm install && cp .env.example .env && docker compose up -d postgres
```

```bash
pnpm db:migrate && pnpm db:seed && pnpm dev
```

Full script list and environment variables: [README](README.md#-running-locally)
and [`.env.example`](.env.example).

---

## Quick reference

| | |
| --- | --- |
| Branch | `<type>/<issue>-<slug>` — `feat/12-project-cards` |
| Commit | `<type>(<scope>): <subject>` — `feat(db): add project repository` |
| PR title | Same as a commit subject |
| PR body | Template filled, `Closes #12` |
| Merge | Squash, green CI, branch deleted |
| Never | Commit directly to `main` |
