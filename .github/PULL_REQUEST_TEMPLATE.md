<!--
Title this PR like a commit: <type>(<scope>): <subject>
e.g. feat(web): render project cards from the projects use case
Conventions: CONTRIBUTING.md
-->

## Related issue

Closes #

<!-- Every PR answers a task issue. If there is none, open one first. -->

## What changed

<!-- What this delivers, in behaviour terms. Two or three sentences.
     The diff shows what was touched; explain why it was touched. -->

## Decisions

<!-- Anything a reviewer would otherwise have to reverse-engineer: an approach
     chosen over an obvious alternative, a trade-off, a deviation from docs/.
     Write "None" if the change is mechanical. -->

## Acceptance criteria

<!-- Copy the criteria from the issue and tick the ones this PR satisfies. -->

- [ ]
- [ ]

## How it was verified

<!-- The commands run and what was checked manually — locales, viewports,
     keyboard navigation, a re-run migration, whatever applies. -->

```bash
pnpm typecheck && pnpm test && pnpm build
```

- [ ] `pnpm typecheck`
- [ ] `pnpm test` (unit + component)
- [ ] `pnpm test:integration` — *if the database layer was touched*
- [ ] `pnpm test:e2e` — *if a user-facing flow was touched*
- [ ] Checked in both `pt-BR` and `en` — *if the UI was touched*

## Out of scope

<!-- What this PR deliberately does not do, and where it is tracked.
     "Nothing" is a valid answer. -->

## Checklist

- [ ] Branch follows `<type>/<issue-number>-<slug>`
- [ ] Commits follow `<type>(<scope>): <subject>`
- [ ] Layer boundaries respected — `core` stays framework-free and dependency-free
- [ ] New behaviour is covered by a test at the right level
- [ ] Migrations are forward-only and idempotent — *if any were added*
- [ ] No hardcoded user-facing strings in a single language
- [ ] Documentation in `docs/` updated where this change made it wrong
- [ ] Nothing unrelated is in this diff

## Screenshots

<!-- Before / after, for visual changes. Delete this section otherwise. -->
