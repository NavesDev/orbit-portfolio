# Sprint 2 — Continuous delivery and first release

Derived from [roadmap.md](../roadmap.md) Phase 5,
[architecture/stack.md](../architecture/stack.md),
[testing.md](../testing.md) and [sprint-01.md](sprint-01.md), whose output is
what this sprint publishes.

## How this sprint relates to the roadmap phases

Sprint 1 built a site that runs. This one makes it run somewhere other than a
laptop. It covers roadmap Phase 5 — **5.1, 5.2, 5.3 and 5.5** — and leaves
**5.4**, the custom domain, out: the sprint ends on the `*.vercel.app` URL and
a domain is a purchase, not an engineering task.

Nothing from Phase 3 or Phase 4 is pulled in. The skills orbit (3.7) and the
`/projetos` list page (4.1) are the two visitor-facing gaps Sprint 1 left, and
both are deliberately out of scope here — once delivery is automated they are
published by merging a pull request, which is the point of doing this sprint
first.

## Sprint Objective

A push to `main` migrates the production database and, only if that succeeds,
triggers the build. The portfolio is reachable on the public internet, its
content served from a hosted PostgreSQL, and a release is a merge rather than a
sequence of remembered commands.

## The delivery mechanism, and why it is not the default one

Vercel's default is to build on every push. That default is wrong here for one
reason: **the pages are statically generated from database rows.** `next build`
reads content, so a build that starts before its migration has run renders
against the old schema — or fails outright on a column that does not exist yet.

So the order is inverted and the trigger is taken away from Git:

1. A merge to `main` starts `.github/workflows/cd.yml`.
2. Its `migrate` job runs `pnpm db:migrate` against Neon.
3. Its `deploy` job — `needs: migrate` — POSTs to a Vercel Deploy Hook.

Git-triggered deployment is disabled in `vercel.json`, which is what makes step
3 the only way a deployment can begin. The alternative considered and rejected
was putting `pnpm db:migrate` inside Vercel's build command: fewer moving parts,
but it ties schema changes to Vercel's build environment, gives a failed
migration a half-built deployment to explain, and has no answer for a preview
build that must not touch production data.

## Sprint Tasks

### 1. Neon production database and its secrets

- **Description:** Provision the content database on Neon — project, `portfolio`
  database, pooled connection string — and write `docs/deployment.md`: where
  each secret lives, how to migrate and seed by hand, how to rotate the
  connection string, how to restore through Neon's point-in-time restore. The
  connection string is stored as the `DATABASE_URL` secret of a GitHub Actions
  **environment** named `production`, not as a repository secret: an environment
  secret has an audit trail and a place to attach a required reviewer, while a
  repository secret is reachable from any workflow on any branch. Roadmap 5.1.
- **Expected outcome:** There is a database to deploy against, its schema matches
  `packages/db/src/migrations/`, and the operational knowledge is in a document
  rather than in one person's memory.
- **Acceptance criteria:**
  - `pnpm db:migrate` against Neon from a workstation applies every migration; a
    second run prints `Schema is up to date; nothing to apply.`
  - `pnpm db:seed` populates all six tables, in both locales.
  - `docs/deployment.md` answers — without reference to the issue that produced
    it — which secrets exist, where each lives, how to migrate and seed by hand,
    how to rotate, how to restore.
  - The `production` environment holds `DATABASE_URL`; no connection string
    appears in a tracked file, a commit message or a workflow log.
  - `.env.example` still describes a local checkout; the Neon string is not
    added to it.

**The seed is applied by hand, and stays that way.** A seed that runs on every
push is a seed that overwrites content edited in production. `pnpm db:seed` is a
bootstrap command, run once against an empty database, not a step in the
pipeline.

### 2. Vercel project, with Git deployment turned off

- **Description:** Import the repository on Vercel with root directory
  `apps/web`, set the production environment variables (`DATABASE_URL`,
  `GITHUB_LOGIN`, and `GITHUB_TOKEN` if one is issued), create a Deploy Hook for
  `main` and store its URL as `VERCEL_DEPLOY_HOOK_URL` in the `production`
  environment. In the repository, add a root `vercel.json` that disables
  Git-triggered deployments for `main` and for every other branch. Roadmap 5.2.
- **Expected outcome:** A project that builds this app correctly and deploys only
  when something asks it to.
- **Acceptance criteria:**
  - A POST to the Deploy Hook produces a green production build; `/pt-BR` and
    `/en-US` render on the `*.vercel.app` URL with content from Neon.
  - Pushing to any branch, and opening a pull request, produces no deployment.
  - `vercel.json` is tracked and disables Git deployments for every branch.
  - `DATABASE_URL` is not `NEXT_PUBLIC_`-prefixed and no connection string
    reaches the client bundle (NFR-02, NFR-03).
  - `VERCEL_DEPLOY_HOOK_URL` exists as a `production` environment secret.

**Preview deployments are off — a decision.** A preview needs a database, and
both honest options cost more than they return today: a Neon branch per pull
request is real infrastructure to maintain for a repository with one
maintainer, and pointing previews at production means a pull request that adds a
migration breaks its own preview until it merges. Reviewing against `pnpm dev`
is enough while the site has one author. This is revisited the moment a second
person reviews a pull request here; see U-2.

### 3. The CD workflow

- **Description:** `.github/workflows/cd.yml`, `on: push: branches: [main]`. Job
  `migrate` under the `production` environment: frozen-lockfile install, then
  `pnpm db:migrate` with the secret. Job `deploy`, `needs: migrate`: one
  `curl --fail --silent --show-error -X POST` against the hook.
  `concurrency: production` with `cancel-in-progress: false` — two merges in
  quick succession queue rather than race, and cancelling a migration run is the
  exact failure the job exists to prevent.
- **Expected outcome:** Merging a pull request is the entire release procedure.
- **Acceptance criteria:**
  - A merge with no new migration logs `Schema is up to date; nothing to apply.`
    and produces a deployment carrying that commit.
  - A merge that adds a migration applies it before `deploy` starts, and the
    deployed page reflects the new schema.
  - A deliberately failing migration — proven on a branch, never on `main` —
    leaves `deploy` skipped and the previous deployment serving.
  - Neither the connection string nor the hook URL is printed in a log.
  - The workflow is the only thing that starts a production deployment.
  - `main` is protected: a pull request and a green `ci.yml` are required.

**CD does not re-run the test suite.** `ci.yml` is the gate on the pull request
and `main` receives only merges of green pull requests; running the suite again
spends minutes re-proving what the merge already required. The cost of being
wrong about that is a deployment of code whose tests passed before a merge
conflict resolution — which branch protection's "branch must be up to date"
requirement is what actually prevents.

### 4. Verify the release and correct the documents

- **Description:** Confirm roadmap 5.3 — the pages are static and revalidate
  hourly rather than rendering per request, and `/` still redirects per visitor
  (NFR-01, NFR-12) — by changing a Neon row and watching the deployed page
  change. Then 5.5: walk the production URL through every section Sprint 1
  shipped, in both locales, at 380 px, 760 px and desktop, with a Lighthouse
  accessibility run. Correct `roadmap.md`'s status table, `testing.md`'s E2E
  target, `stack.md`'s deploy row and `README.md`'s live URL. Roadmap 5.3, 5.5.
- **Expected outcome:** The site is verified as published rather than assumed to
  be, and no document describes a deployment that does not exist.
- **Acceptance criteria:**
  - Editing a Neon row changes the deployed page after revalidation, recorded —
    what was changed, what was observed.
  - Response headers confirm the home page is served from the static cache;
    `/` redirects per visitor.
  - Every Sprint 1 section behaves on production as it does locally, in both
    locales, at all three viewports.
  - Lighthouse accessibility ≥ 95 on the deployed home page (NFR-06), score
    recorded.
  - `roadmap.md`, `testing.md`, `stack.md` and `README.md` match what runs.
    `testing.md` currently sends E2E at a Vercel preview this sprint
    deliberately does not create; it names a real target instead, argued in the
    same pull request rather than left standing as a contradiction.
  - Anything found and not fixed becomes an issue, not a sentence in a pull
    request.

## Sprint Definition of Done

1. Four tasks delivered; each one's acceptance criteria checked against a
   running system, not against the diff that implemented it.
2. A merge to `main` migrates and then deploys, in that order, with no manual
   step between them.
3. A failed migration cannot produce a deployment — demonstrated, not reasoned
   about.
4. The public URL serves both locales from Neon rows, and changing a row changes
   the page.
5. No secret is in a tracked file, a commit message or a workflow log.
6. Documentation matches the running system; where it did not, it was corrected
   in the pull request that made it wrong.
7. Nothing found during verification is left as an undocumented known issue.

## Uncertainties — documented gaps, not invented solutions

| # | Gap | Blocks | Why it is not resolvable yet |
| --- | --- | --- | --- |
| U-1 | **The pipeline cannot tell whether the deployment it triggered succeeded.** A Deploy Hook answers as soon as the build is queued, so the `deploy` job goes green on a build that may still fail. | Task 3 | Reading the build's outcome needs a Vercel access token in GitHub Actions, and [CLAUDE.md](../../CLAUDE.md) puts the Vercel CLI and its tokens in human hands only. A read-scoped token polling the deployment is the obvious future answer; it is a deliberate decision with its own issue, not something to add while writing the workflow. Until then a failed build is caught by looking, and the previous deployment keeps serving in the meantime. |
| U-2 | **No preview environment, so a pull request has nothing deployed to review.** | Task 2 | Decided against on cost (see task 2), not on merit. The trigger for reconsidering is a second reviewer, or a change whose risk is not visible in `pnpm dev` — a caching or revalidation behaviour, for instance, which is exactly what task 4 has to verify by hand on production for this reason. |
| U-3 | **Neon's free tier suspends idle compute**, so the first request after a quiet period pays a cold start. | None | Static pages make this nearly invisible to a visitor: the cost lands on the hourly revalidation, not on a page view. Recorded rather than acted on, because the fix is a paid tier and the evidence for needing one does not exist yet. |
| U-4 | `GITHUB_TOKEN` for the stat band is optional and may be left unset. | Task 2 | Both queries answer unauthenticated; the token only raises the search API's limit from 10 requests a minute to 30 (see [.env.example](../../.env.example)). One build an hour is far inside the unauthenticated limit, so leaving it unset is a valid choice rather than a gap — what is unknown is whether on-demand revalidation later changes that arithmetic. |
| U-5 | **`main` may not be protected today.** The workflow's safety depends on `main` receiving only merges of green pull requests. | Task 3 | Branch protection is configured in GitHub, outside the repository, and its current state is not recorded anywhere in `docs/`. Task 3 both sets it and states what it set, so the next reader does not have to check the settings page to know what the pipeline assumes. |

## Scope

**In scope:** Neon provisioning and its runbook, the Vercel project with Git
deployment disabled, the migrate-then-deploy workflow, release verification and
the documentation corrections it forces.

**Out of scope:** the custom domain (roadmap 5.4); the skills orbit (3.7) and
`/projetos` (4.1), which ship through this pipeline in a later sprint; per-pull-request
preview databases; real portfolio content, which stays a manual seed and its own
future task; telemetry (Phase 6).
