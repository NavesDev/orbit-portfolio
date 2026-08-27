# Featured Projects Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the home page's featured-projects section from PostgreSQL, top to bottom through every architectural layer, with a client-side detail modal and per-project decorative SVGs that can carry predefined CSS animations.

**Architecture:** A `Project` aggregate in `@portfolio/core` (four new value objects: `Slug`, `Url`, `DateRange`, `ProgressPercent`, plus a `LocalizedTagList`), a `ProjectRepository` port with a `PostgresProjectRepository` implementation in `@portfolio/db`, a `ListFeaturedProjects(locale, limit)` use case producing two DTOs (`ProjectCardView`, `ProjectDetailView`), and Server + Client Components in `apps/web` wiring it into the home page. `IconSvg` is extended (not duplicated) to sanitize a `class` attribute against a fixed whitelist of animation names, which is what lets `projects.visual_svg` carry animated decoration safely.

**Tech Stack:** TypeScript (strict, `verbatimModuleSyntax`), Vitest (`core`, `db-unit`, `db`, `web` projects), `pg` (hand-written SQL, no ORM), Next.js App Router (Server Components + `'use client'` islands), Testing Library.

## Global Constraints

- Zero runtime dependencies in `@portfolio/core` — no framework, no driver (`packages/core` may only import from itself).
- `packages/db` may import `core`; never the reverse; `@portfolio/db` is never imported from a Client Component (NFR-02).
- Repositories take no `Locale`; only use cases do. A repository returns entities holding full `LocalizedText`/`LocalizedTagList`.
- A `LocalizedText`/`LocalizedTagList` never crosses into presentation — output DTOs carry resolved `string`s (NFR-13).
- Join tables (`project_skill`) are read through the owning aggregate's repository; they never get a repository of their own.
- `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` are on — `import type` for type-only imports, explicit `.ts` extensions on relative imports inside `packages/core` and `packages/db` (matches every existing file in both packages).
- No magic numbers/strings — a literal used more than once, or one that encodes a rule, gets a named constant in that module's `constants/` folder, imported as a namespace (`import * as X_CONSTANTS from './constants/x.ts'`).
- Migrations are forward-only and idempotent; never edit one that has already run.
- Components are tested by role and accessible name, never by CSS class (`testing.md`).
- Conventional Commits scoped by package; this branch is `feat/6-featured-projects-section` (already checked out).
- Default ordering for a collection: `sort_order ASC, started_on DESC NULLS LAST`.

---

## File Structure

**New files, `@portfolio/core`:**
- `src/domain/constants/slug.ts`, `src/domain/errors/invalid-slug-error.ts`, `src/domain/value-objects/slug.ts` (+ `.test.ts`)
- `src/domain/constants/url.ts`, `src/domain/errors/invalid-url-error.ts`, `src/domain/value-objects/url.ts` (+ `.test.ts`)
- `src/domain/errors/invalid-date-range-error.ts`, `src/domain/value-objects/date-range.ts` (+ `.test.ts`)
- `src/domain/errors/invalid-progress-percent-error.ts`, `src/domain/value-objects/progress-percent.ts` (+ `.test.ts`)
- `src/domain/errors/invalid-localized-tag-list-error.ts`, `src/domain/value-objects/localized-tag-list.ts` (+ `.test.ts`)
- `src/domain/errors/invalid-project-error.ts`, `src/domain/entities/project.ts` (+ `.test.ts`)
- `src/application/read-models/project-skill-usage.ts`
- `src/application/ports/project-repository.ts`, `src/application/ports/__fakes__/fake-project-repository.ts`
- `src/application/dto/project-card-view.ts`, `src/application/dto/project-skill-view.ts`, `src/application/dto/project-detail-view.ts`
- `src/application/use-cases/projects/list-featured-projects.ts` (+ `.test.ts`)

**Modified, `@portfolio/core`:**
- `src/domain/constants/icon-svg.ts` — add `class` to `ALLOWED_ATTRIBUTES`, add `ALLOWED_ANIMATION_CLASSES`
- `src/domain/errors/invalid-icon-svg-error.ts` — add `DISALLOWED_CLASS` violation
- `src/domain/value-objects/icon-svg.ts` — validate `class` attribute values against the whitelist
- `src/domain/value-objects/icon-svg.test.ts` — new cases for the above
- `src/index.ts` — barrel exports

**New files, `@portfolio/db`:**
- `src/migrations/010_projects_visual.sql`
- `src/mappers/project.mapper.ts`
- `src/repositories/postgres-project.repository.ts`
- `tests/integration/repositories/project.repository.test.ts`

**Modified, `@portfolio/db`:**
- `src/index.ts` — export `PostgresProjectRepository`
- `src/seed/data.ts` — `SeedProject.visualSvg: string | null`
- `src/seed/strategies/projects.strategy.ts` — write `visual_svg`
- `tests/unit/seed/data.test.ts` — cover the new field if that file asserts per-field shape (checked in Task 12)

**New files, `apps/web`:**
- `src/lib/projects/constants/projects-provider.ts`
- `src/lib/projects/projects-provider.ts`
- `src/components/projects/constants/project-visual.ts`
- `src/components/projects/project-visual.module.css`
- `src/components/projects/progress-bar.tsx` (+ `.test.tsx`)
- `src/components/projects/project-modal.tsx` (+ `.test.tsx`)
- `src/components/projects/project-card.tsx` (+ `.test.tsx`)
- `src/components/projects/project-card.module.css`
- `src/components/projects/projects-section.tsx` (+ `.test.tsx`)
- `src/components/projects/projects-section.module.css`

**Modified, `apps/web`:**
- `src/content/types.ts` — `ProjectsContent` + `SiteContent.projects`
- `src/content/en-US/index.ts`, `src/content/pt-BR/index.ts` — the new copy
- `src/content/index.test.ts` — one assertion for the new section, matching the file's existing style
- `src/components/ui/section-registry.ts` — `PROJECTS_SECTION_ID`
- `src/app/[locale]/page.tsx` — mount `<ProjectsSection>`

**Modified, `docs/`:**
- `docs/domain/data-model.md` — document `projects.visual_svg`
- `docs/sprints/sprint-01.md` — record U-5 and U-6 as resolved, same style as U-2/U-3/U-4

---

## Task 1: `Slug` value object

**Files:**
- Create: `packages/core/src/domain/constants/slug.ts`
- Create: `packages/core/src/domain/errors/invalid-slug-error.ts`
- Create: `packages/core/src/domain/value-objects/slug.ts`
- Test: `packages/core/src/domain/value-objects/slug.test.ts`

**Interfaces:**
- Consumes: `DomainError` from `../errors/domain-error.ts`.
- Produces: `Slug.create(value: unknown): Slug`, `Slug#toString(): string`, `Slug#toJSON(): string`, `Slug#equals(other: Slug): boolean`. `SLUG_VIOLATIONS`, `InvalidSlugError`, `type SlugViolation`. Task 7 (`Project` entity) and Task 9 (mapper) consume `Slug.create` and `Slug#toString()`.

- [ ] **Step 1: Write the failing test**

```typescript
// packages/core/src/domain/value-objects/slug.test.ts
import { describe, expect, it } from 'vitest';

import { InvalidSlugError, SLUG_VIOLATIONS } from '../errors/invalid-slug-error.ts';
import * as SLUG_CONSTANTS from '../constants/slug.ts';
import { Slug } from './slug.ts';

function violationOf(value: unknown): string {
  try {
    Slug.create(value);
  } catch (error) {
    if (error instanceof InvalidSlugError) {
      return error.violation;
    }

    throw error;
  }

  throw new Error(`Expected ${JSON.stringify(value)} to be rejected, and it was not.`);
}

describe('Slug', () => {
  it('accepts a lowercase, hyphenated slug', () => {
    expect(Slug.create('orbit-portfolio').toString()).toBe('orbit-portfolio');
  });

  it('accepts a slug of digits and letters with no hyphen', () => {
    expect(() => Slug.create('portfolio2')).not.toThrow();
  });

  it('rejects a non-string', () => {
    expect(violationOf(42)).toBe(SLUG_VIOLATIONS.NOT_A_STRING);
  });

  it('rejects a blank string', () => {
    expect(violationOf('   ')).toBe(SLUG_VIOLATIONS.EMPTY);
  });

  it('rejects a slug over its budget', () => {
    expect(violationOf('a'.repeat(SLUG_CONSTANTS.MAX_LENGTH + 1))).toBe(
      SLUG_VIOLATIONS.OVER_BUDGET,
    );
  });

  it('rejects uppercase letters', () => {
    expect(violationOf('Orbit-Portfolio')).toBe(SLUG_VIOLATIONS.MALFORMED);
  });

  it('rejects a space', () => {
    expect(violationOf('orbit portfolio')).toBe(SLUG_VIOLATIONS.MALFORMED);
  });

  it('rejects a leading hyphen', () => {
    expect(violationOf('-orbit')).toBe(SLUG_VIOLATIONS.MALFORMED);
  });

  it('rejects a trailing hyphen', () => {
    expect(violationOf('orbit-')).toBe(SLUG_VIOLATIONS.MALFORMED);
  });

  it('rejects a doubled hyphen', () => {
    expect(violationOf('orbit--portfolio')).toBe(SLUG_VIOLATIONS.MALFORMED);
  });

  it('rejects an underscore', () => {
    expect(violationOf('orbit_portfolio')).toBe(SLUG_VIOLATIONS.MALFORMED);
  });

  it('two slugs of the same value are equal', () => {
    expect(Slug.create('orbit-portfolio').equals(Slug.create('orbit-portfolio'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project core src/domain/value-objects/slug.test.ts`
Expected: FAIL — `Cannot find module './slug.ts'` (or the constants/error modules it imports).

- [ ] **Step 3: Write the constants, the error and the value object**

```typescript
// packages/core/src/domain/constants/slug.ts
/**
 * The shape of a project's slug (data-model.md § 3): `varchar(120)`, single
 * and untranslated across locales because it is also the URL segment.
 *
 * Lowercase letters, digits and single hyphens only — anything a URL would
 * need to percent-encode is refused here rather than encoded, so a slug reads
 * identically whether it is quoted from a database row or from an address bar.
 */
export const MAX_LENGTH = 120;

export const PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
```

```typescript
// packages/core/src/domain/errors/invalid-slug-error.ts
import { DomainError } from './domain-error.ts';

export const SLUG_VIOLATIONS = {
  NOT_A_STRING: 'not-a-string',
  EMPTY: 'empty',
  OVER_BUDGET: 'over-budget',
  MALFORMED: 'malformed',
} as const;

export type SlugViolation = (typeof SLUG_VIOLATIONS)[keyof typeof SLUG_VIOLATIONS];

export class InvalidSlugError extends DomainError {
  readonly violation: SlugViolation;

  constructor(violation: SlugViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
```

```typescript
// packages/core/src/domain/value-objects/slug.ts
import * as SLUG_CONSTANTS from '../constants/slug.ts';
import { InvalidSlugError, SLUG_VIOLATIONS } from '../errors/invalid-slug-error.ts';

/**
 * A project's URL and deep-link target (data-model.md § 3).
 *
 * Single and untranslated across locales — one project, one canonical URL.
 * Restricted to what a URL segment needs no encoding for: lowercase letters,
 * digits and single hyphens, never leading, trailing or doubled.
 */
export class Slug {
  private constructor(private readonly value: string) {}

  static create(value: unknown): Slug {
    if (typeof value !== 'string') {
      throw new InvalidSlugError(SLUG_VIOLATIONS.NOT_A_STRING, 'A slug must be a string.');
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new InvalidSlugError(SLUG_VIOLATIONS.EMPTY, 'A slug must not be blank.');
    }

    if (trimmed.length > SLUG_CONSTANTS.MAX_LENGTH) {
      throw new InvalidSlugError(
        SLUG_VIOLATIONS.OVER_BUDGET,
        `A slug exceeds its budget of ${SLUG_CONSTANTS.MAX_LENGTH} characters.`,
      );
    }

    if (!SLUG_CONSTANTS.PATTERN.test(trimmed)) {
      throw new InvalidSlugError(
        SLUG_VIOLATIONS.MALFORMED,
        'A slug must be lowercase letters, digits and single hyphens, with no leading, trailing or doubled hyphen.',
      );
    }

    return new Slug(trimmed);
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }

  equals(other: Slug): boolean {
    return this.value === other.value;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project core src/domain/value-objects/slug.test.ts`
Expected: PASS (13 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/constants/slug.ts packages/core/src/domain/errors/invalid-slug-error.ts packages/core/src/domain/value-objects/slug.ts packages/core/src/domain/value-objects/slug.test.ts
git commit -m "feat(core): add Slug value object

Refs #6"
```

---

## Task 2: `Url` value object

**Files:**
- Create: `packages/core/src/domain/constants/url.ts`
- Create: `packages/core/src/domain/errors/invalid-url-error.ts`
- Create: `packages/core/src/domain/value-objects/url.ts`
- Test: `packages/core/src/domain/value-objects/url.test.ts`

**Interfaces:**
- Consumes: `DomainError`.
- Produces: `Url.create(value: unknown): Url`, `Url#toString(): string`, `Url#equals(other: Url): boolean`. `URL_VIOLATIONS`, `InvalidUrlError`. Consumed by Task 7 (`Project.repoUrl`, `Project.liveUrl`) and Task 9 (mapper).

- [ ] **Step 1: Write the failing test**

```typescript
// packages/core/src/domain/value-objects/url.test.ts
import { describe, expect, it } from 'vitest';

import { InvalidUrlError, URL_VIOLATIONS } from '../errors/invalid-url-error.ts';
import * as URL_CONSTANTS from '../constants/url.ts';
import { Url } from './url.ts';

function violationOf(value: unknown): string {
  try {
    Url.create(value);
  } catch (error) {
    if (error instanceof InvalidUrlError) {
      return error.violation;
    }

    throw error;
  }

  throw new Error(`Expected ${JSON.stringify(value)} to be rejected, and it was not.`);
}

describe('Url', () => {
  it('accepts an absolute https URL', () => {
    expect(Url.create('https://github.com/NavesDev/orbit-portfolio').toString()).toBe(
      'https://github.com/NavesDev/orbit-portfolio',
    );
  });

  it('rejects a non-string', () => {
    expect(violationOf(42)).toBe(URL_VIOLATIONS.NOT_A_STRING);
  });

  it('rejects a blank string', () => {
    expect(violationOf('  ')).toBe(URL_VIOLATIONS.EMPTY);
  });

  it('rejects a URL over its budget', () => {
    const overBudget = `https://example.com/${'a'.repeat(URL_CONSTANTS.MAX_LENGTH)}`;
    expect(violationOf(overBudget)).toBe(URL_VIOLATIONS.OVER_BUDGET);
  });

  it('rejects a relative path', () => {
    expect(violationOf('/projetos/orbit-portfolio')).toBe(URL_VIOLATIONS.NOT_ABSOLUTE);
  });

  it('rejects an http URL', () => {
    expect(violationOf('http://example.com')).toBe(URL_VIOLATIONS.SCHEME_NOT_ALLOWED);
  });

  it('rejects a mailto URL', () => {
    expect(violationOf('mailto:someone@example.com')).toBe(URL_VIOLATIONS.SCHEME_NOT_ALLOWED);
  });

  it('rejects a javascript URL', () => {
    expect(violationOf('javascript:alert(1)')).toBe(URL_VIOLATIONS.SCHEME_NOT_ALLOWED);
  });

  it('two URLs of the same value are equal', () => {
    expect(Url.create('https://example.com').equals(Url.create('https://example.com'))).toBe(
      true,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project core src/domain/value-objects/url.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the constants, the error and the value object**

```typescript
// packages/core/src/domain/constants/url.ts
/**
 * The shape of `projects.repo_url` and `.live_url` (data-model.md § 3):
 * `varchar(2048)`, absolute `https`.
 *
 * `https:` only, unlike `SocialLink`'s own check, which also allows `mailto:`
 * for the footer's e-mail link — nothing about a project points at an address.
 * `social-link.ts` keeps its inline check rather than being rewritten onto
 * this: its rule is narrower in a different way (`mailto:` allowed, a
 * relative path never), so sharing it would mean widening one case against
 * the other.
 */
export const MAX_LENGTH = 2048;

export const ALLOWED_SCHEMES: readonly string[] = ['https:'];
```

```typescript
// packages/core/src/domain/errors/invalid-url-error.ts
import { DomainError } from './domain-error.ts';

export const URL_VIOLATIONS = {
  NOT_A_STRING: 'not-a-string',
  EMPTY: 'empty',
  OVER_BUDGET: 'over-budget',
  NOT_ABSOLUTE: 'not-absolute',
  SCHEME_NOT_ALLOWED: 'scheme-not-allowed',
} as const;

export type UrlViolation = (typeof URL_VIOLATIONS)[keyof typeof URL_VIOLATIONS];

export class InvalidUrlError extends DomainError {
  readonly violation: UrlViolation;

  constructor(violation: UrlViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
```

```typescript
// packages/core/src/domain/value-objects/url.ts
import * as URL_CONSTANTS from '../constants/url.ts';
import { InvalidUrlError, URL_VIOLATIONS } from '../errors/invalid-url-error.ts';

const ALLOWED_SCHEMES = new Set(URL_CONSTANTS.ALLOWED_SCHEMES);

/**
 * An absolute `https` URL — `projects.repo_url` and `.live_url`.
 *
 * The generic URL check `social-link.ts`'s docstring predicted a third call
 * site would justify: `repo_url` and `live_url` make two here, both narrower
 * than `SocialLink`'s own rule (no `mailto:`), which is why that one keeps its
 * inline check rather than being widened onto this.
 */
export class Url {
  private constructor(private readonly value: string) {}

  static create(value: unknown): Url {
    if (typeof value !== 'string') {
      throw new InvalidUrlError(URL_VIOLATIONS.NOT_A_STRING, 'A URL must be a string.');
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new InvalidUrlError(URL_VIOLATIONS.EMPTY, 'A URL must not be blank.');
    }

    if (trimmed.length > URL_CONSTANTS.MAX_LENGTH) {
      throw new InvalidUrlError(
        URL_VIOLATIONS.OVER_BUDGET,
        `A URL exceeds its budget of ${URL_CONSTANTS.MAX_LENGTH} characters.`,
      );
    }

    let parsed: URL;

    try {
      parsed = new URL(trimmed);
    } catch {
      throw new InvalidUrlError(URL_VIOLATIONS.NOT_ABSOLUTE, `"${trimmed}" is not an absolute URL.`);
    }

    if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
      throw new InvalidUrlError(
        URL_VIOLATIONS.SCHEME_NOT_ALLOWED,
        `"${parsed.protocol}" is not a scheme this URL may use.`,
      );
    }

    return new Url(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Url): boolean {
    return this.value === other.value;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project core src/domain/value-objects/url.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/constants/url.ts packages/core/src/domain/errors/invalid-url-error.ts packages/core/src/domain/value-objects/url.ts packages/core/src/domain/value-objects/url.test.ts
git commit -m "feat(core): add Url value object

Refs #6"
```

---

## Task 3: `DateRange` value object

**Files:**
- Create: `packages/core/src/domain/constants/date-range.ts`
- Create: `packages/core/src/domain/errors/invalid-date-range-error.ts`
- Create: `packages/core/src/domain/value-objects/date-range.ts`
- Test: `packages/core/src/domain/value-objects/date-range.test.ts`

**Interfaces:**
- Consumes: `DomainError`.
- Produces: `DateRange.create({ startedOn, endedOn }): DateRange`, `DateRange#startedOn: string | null`, `DateRange#endedOn: string | null`. `DATE_RANGE_VIOLATIONS`, `InvalidDateRangeError`. Consumed by Task 7 (`Project.period`) and Task 9 (mapper, reading `started_on`/`ended_on` as `date::text`).

- [ ] **Step 1: Write the failing test**

```typescript
// packages/core/src/domain/value-objects/date-range.test.ts
import { describe, expect, it } from 'vitest';

import { DATE_RANGE_VIOLATIONS, InvalidDateRangeError } from '../errors/invalid-date-range-error.ts';
import { DateRange } from './date-range.ts';

function violationOf(startedOn: unknown, endedOn: unknown): string {
  try {
    DateRange.create({ startedOn, endedOn } as never);
  } catch (error) {
    if (error instanceof InvalidDateRangeError) {
      return error.violation;
    }

    throw error;
  }

  throw new Error('Expected the range to be rejected, and it was not.');
}

describe('DateRange', () => {
  it('accepts a started date with no end — open, ongoing', () => {
    const range = DateRange.create({ startedOn: '2026-01-01', endedOn: null });

    expect(range.startedOn).toBe('2026-01-01');
    expect(range.endedOn).toBeNull();
  });

  it('accepts both dates equal — a project started and finished the same day', () => {
    expect(() =>
      DateRange.create({ startedOn: '2026-01-01', endedOn: '2026-01-01' }),
    ).not.toThrow();
  });

  it('accepts both dates null', () => {
    expect(() => DateRange.create({ startedOn: null, endedOn: null })).not.toThrow();
  });

  it('rejects an end date before the start date', () => {
    expect(violationOf('2026-02-01', '2026-01-01')).toBe(
      DATE_RANGE_VIOLATIONS.END_BEFORE_START,
    );
  });

  it('rejects a malformed started_on', () => {
    expect(violationOf('01/01/2026', null)).toBe(DATE_RANGE_VIOLATIONS.MALFORMED_DATE);
  });

  it('rejects a malformed ended_on', () => {
    expect(violationOf('2026-01-01', 'not-a-date')).toBe(DATE_RANGE_VIOLATIONS.MALFORMED_DATE);
  });

  it('rejects a non-string, non-null started_on', () => {
    expect(violationOf(20260101, null)).toBe(DATE_RANGE_VIOLATIONS.MALFORMED_DATE);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project core src/domain/value-objects/date-range.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the constants, the error and the value object**

```typescript
// packages/core/src/domain/constants/date-range.ts
/** `date-model.md § Conventions`: `started_on` / `ended_on date`, `ended_on IS NULL` means open. */
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
```

```typescript
// packages/core/src/domain/errors/invalid-date-range-error.ts
import { DomainError } from './domain-error.ts';

export const DATE_RANGE_VIOLATIONS = {
  MALFORMED_DATE: 'malformed-date',
  END_BEFORE_START: 'end-before-start',
} as const;

export type DateRangeViolation = (typeof DATE_RANGE_VIOLATIONS)[keyof typeof DATE_RANGE_VIOLATIONS];

export class InvalidDateRangeError extends DomainError {
  readonly violation: DateRangeViolation;

  constructor(violation: DateRangeViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
```

```typescript
// packages/core/src/domain/value-objects/date-range.ts
import * as DATE_RANGE_CONSTANTS from '../constants/date-range.ts';
import { DATE_RANGE_VIOLATIONS, InvalidDateRangeError } from '../errors/invalid-date-range-error.ts';

export interface DateRangeProperties {
  readonly startedOn: string | null;
  readonly endedOn: string | null;
}

/**
 * A period with an open end (data-model.md § Conventions).
 *
 * `ended_on IS NULL` means open — ongoing, current, or never expires — never a
 * separate `is_current` flag, so `endedOn: null` is a value in its own right,
 * not the absence of one.
 *
 * Dates are plain `YYYY-MM-DD` strings, not `Date` objects: a `date` column has
 * no time component, and a `Date` would invite a timezone to attach itself to
 * a value that never had one. `packages/db`'s mapper is what keeps this true —
 * it reads the columns as `::text`, so this value object never has to parse a
 * driver's own date type.
 */
export class DateRange {
  private constructor(
    private readonly startedOnValue: string | null,
    private readonly endedOnValue: string | null,
  ) {}

  static create(properties: DateRangeProperties): DateRange {
    requireIsoDateOrNull(properties.startedOn);
    requireIsoDateOrNull(properties.endedOn);

    if (
      properties.startedOn !== null &&
      properties.endedOn !== null &&
      properties.endedOn < properties.startedOn
    ) {
      throw new InvalidDateRangeError(
        DATE_RANGE_VIOLATIONS.END_BEFORE_START,
        `"${properties.endedOn}" ends before it starts, "${properties.startedOn}".`,
      );
    }

    return new DateRange(properties.startedOn, properties.endedOn);
  }

  get startedOn(): string | null {
    return this.startedOnValue;
  }

  get endedOn(): string | null {
    return this.endedOnValue;
  }
}

function requireIsoDateOrNull(value: string | null): void {
  if (value === null) {
    return;
  }

  if (typeof value !== 'string' || !DATE_RANGE_CONSTANTS.ISO_DATE_PATTERN.test(value)) {
    throw new InvalidDateRangeError(
      DATE_RANGE_VIOLATIONS.MALFORMED_DATE,
      `"${String(value)}" is not a "YYYY-MM-DD" date.`,
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project core src/domain/value-objects/date-range.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/constants/date-range.ts packages/core/src/domain/errors/invalid-date-range-error.ts packages/core/src/domain/value-objects/date-range.ts packages/core/src/domain/value-objects/date-range.test.ts
git commit -m "feat(core): add DateRange value object

Refs #6"
```

---

## Task 4: `ProgressPercent` value object

**Files:**
- Create: `packages/core/src/domain/errors/invalid-progress-percent-error.ts`
- Create: `packages/core/src/domain/value-objects/progress-percent.ts`
- Test: `packages/core/src/domain/value-objects/progress-percent.test.ts`

**Interfaces:**
- Consumes: `DomainError`.
- Produces: `ProgressPercent.create(value: unknown): ProgressPercent`, `ProgressPercent#value: number | null`. `PROGRESS_PERCENT_VIOLATIONS`, `InvalidProgressPercentError`. Consumed by Task 7 and Task 9.

- [ ] **Step 1: Write the failing test**

```typescript
// packages/core/src/domain/value-objects/progress-percent.test.ts
import { describe, expect, it } from 'vitest';

import {
  InvalidProgressPercentError,
  PROGRESS_PERCENT_VIOLATIONS,
} from '../errors/invalid-progress-percent-error.ts';
import { ProgressPercent } from './progress-percent.ts';

function violationOf(value: unknown): string {
  try {
    ProgressPercent.create(value);
  } catch (error) {
    if (error instanceof InvalidProgressPercentError) {
      return error.violation;
    }

    throw error;
  }

  throw new Error(`Expected ${JSON.stringify(value)} to be rejected, and it was not.`);
}

describe('ProgressPercent', () => {
  it('accepts null — a card renders no bar', () => {
    expect(ProgressPercent.create(null).value).toBeNull();
  });

  it('accepts 0', () => {
    expect(ProgressPercent.create(0).value).toBe(0);
  });

  it('accepts 100', () => {
    expect(ProgressPercent.create(100).value).toBe(100);
  });

  it('rejects a value below 0', () => {
    expect(violationOf(-1)).toBe(PROGRESS_PERCENT_VIOLATIONS.OUT_OF_RANGE);
  });

  it('rejects a value above 100', () => {
    expect(violationOf(150)).toBe(PROGRESS_PERCENT_VIOLATIONS.OUT_OF_RANGE);
  });

  it('rejects a non-integer', () => {
    expect(violationOf(50.5)).toBe(PROGRESS_PERCENT_VIOLATIONS.NOT_AN_INTEGER);
  });

  it('rejects a non-number, non-null value', () => {
    expect(violationOf('50')).toBe(PROGRESS_PERCENT_VIOLATIONS.NOT_AN_INTEGER);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project core src/domain/value-objects/progress-percent.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the error and the value object**

```typescript
// packages/core/src/domain/errors/invalid-progress-percent-error.ts
import { DomainError } from './domain-error.ts';

export const PROGRESS_PERCENT_VIOLATIONS = {
  NOT_AN_INTEGER: 'not-an-integer',
  OUT_OF_RANGE: 'out-of-range',
} as const;

export type ProgressPercentViolation =
  (typeof PROGRESS_PERCENT_VIOLATIONS)[keyof typeof PROGRESS_PERCENT_VIOLATIONS];

export class InvalidProgressPercentError extends DomainError {
  readonly violation: ProgressPercentViolation;

  constructor(violation: ProgressPercentViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
```

```typescript
// packages/core/src/domain/value-objects/progress-percent.ts
import {
  InvalidProgressPercentError,
  PROGRESS_PERCENT_VIOLATIONS,
} from '../errors/invalid-progress-percent-error.ts';

const MIN = 0;
const MAX = 100;

/**
 * The card's progress bar (data-model.md § 3): `smallint`, `0`–`100`, nullable
 * — a project with no reported progress renders no bar at all rather than one
 * stuck at zero.
 */
export class ProgressPercent {
  private constructor(private readonly percent: number | null) {}

  static create(value: unknown): ProgressPercent {
    if (value === null) {
      return new ProgressPercent(null);
    }

    if (typeof value !== 'number' || !Number.isInteger(value)) {
      throw new InvalidProgressPercentError(
        PROGRESS_PERCENT_VIOLATIONS.NOT_AN_INTEGER,
        'A progress percent must be an integer, or null.',
      );
    }

    if (value < MIN || value > MAX) {
      throw new InvalidProgressPercentError(
        PROGRESS_PERCENT_VIOLATIONS.OUT_OF_RANGE,
        `A progress percent must be between ${MIN} and ${MAX}.`,
      );
    }

    return new ProgressPercent(value);
  }

  get value(): number | null {
    return this.percent;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project core src/domain/value-objects/progress-percent.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/errors/invalid-progress-percent-error.ts packages/core/src/domain/value-objects/progress-percent.ts packages/core/src/domain/value-objects/progress-percent.test.ts
git commit -m "feat(core): add ProgressPercent value object

Refs #6"
```

---

## Task 5: `LocalizedTagList` value object

**Files:**
- Create: `packages/core/src/domain/errors/invalid-localized-tag-list-error.ts`
- Create: `packages/core/src/domain/value-objects/localized-tag-list.ts`
- Test: `packages/core/src/domain/value-objects/localized-tag-list.test.ts`

**Interfaces:**
- Consumes: `DEFAULT_LOCALE`, `isLocale`, `type Locale` from `../enums/locale.ts`.
- Produces: `LocalizedTagList.create(values: unknown, maxItemLength: number, maxItems: number): LocalizedTagList`, `LocalizedTagList#resolve(locale: Locale): readonly string[]`, `LocalizedTagList#toJSON()`. `LOCALIZED_TAG_LIST_VIOLATIONS`, `InvalidLocalizedTagListError`. Consumed by Task 7 (`Project.tags`) and Task 9 (mapper, with `TAG_MAX_LENGTH`/`TAGS_MAX_ITEMS` from `text-budgets.ts`).

- [ ] **Step 1: Write the failing test**

```typescript
// packages/core/src/domain/value-objects/localized-tag-list.test.ts
import { describe, expect, it } from 'vitest';

import {
  InvalidLocalizedTagListError,
  LOCALIZED_TAG_LIST_VIOLATIONS,
} from '../errors/invalid-localized-tag-list-error.ts';
import { LocalizedTagList } from './localized-tag-list.ts';

const MAX_ITEM_LENGTH = 60;
const MAX_ITEMS = 8;

function violationOf(values: unknown): string {
  try {
    LocalizedTagList.create(values, MAX_ITEM_LENGTH, MAX_ITEMS);
  } catch (error) {
    if (error instanceof InvalidLocalizedTagListError) {
      return error.violation;
    }

    throw error;
  }

  throw new Error(`Expected ${JSON.stringify(values)} to be rejected, and it was not.`);
}

describe('LocalizedTagList', () => {
  it('resolves the requested locale', () => {
    const tags = LocalizedTagList.create(
      { 'en-US': ['Real-time calendar'], 'pt-BR': ['Calendário em tempo real'] },
      MAX_ITEM_LENGTH,
      MAX_ITEMS,
    );

    expect(tags.resolve('pt-BR')).toEqual(['Calendário em tempo real']);
    expect(tags.resolve('en-US')).toEqual(['Real-time calendar']);
  });

  it('falls back to en-US when the requested locale has no entry (FR-34)', () => {
    const tags = LocalizedTagList.create({ 'en-US': ['Next.js'] }, MAX_ITEM_LENGTH, MAX_ITEMS);

    expect(tags.resolve('pt-BR')).toEqual(['Next.js']);
  });

  it('rejects a non-object', () => {
    expect(violationOf('Next.js')).toBe(LOCALIZED_TAG_LIST_VIOLATIONS.NOT_AN_OBJECT);
  });

  it('rejects an array at the top level', () => {
    expect(violationOf(['Next.js'])).toBe(LOCALIZED_TAG_LIST_VIOLATIONS.NOT_AN_OBJECT);
  });

  it('rejects an unknown locale key', () => {
    expect(violationOf({ 'en-US': ['Next.js'], fr: ['Next.js'] })).toBe(
      LOCALIZED_TAG_LIST_VIOLATIONS.UNKNOWN_LOCALE_KEY,
    );
  });

  it('rejects a locale entry that is not an array', () => {
    expect(violationOf({ 'en-US': 'Next.js' })).toBe(LOCALIZED_TAG_LIST_VIOLATIONS.NOT_AN_ARRAY);
  });

  it('rejects an item that is not a string', () => {
    expect(violationOf({ 'en-US': [42] })).toBe(LOCALIZED_TAG_LIST_VIOLATIONS.ITEM_NOT_A_STRING);
  });

  it('rejects an item over its budget', () => {
    expect(violationOf({ 'en-US': ['a'.repeat(MAX_ITEM_LENGTH + 1)] })).toBe(
      LOCALIZED_TAG_LIST_VIOLATIONS.ITEM_OVER_BUDGET,
    );
  });

  it('rejects more items than the cap', () => {
    expect(violationOf({ 'en-US': Array.from({ length: MAX_ITEMS + 1 }, () => 'x') })).toBe(
      LOCALIZED_TAG_LIST_VIOLATIONS.TOO_MANY_ITEMS,
    );
  });

  it('rejects a missing en-US entry (FR-34)', () => {
    expect(violationOf({ 'pt-BR': ['Next.js'] })).toBe(
      LOCALIZED_TAG_LIST_VIOLATIONS.MISSING_DEFAULT_LOCALE,
    );
  });

  it('accepts an empty list for the required locale', () => {
    expect(() => LocalizedTagList.create({ 'en-US': [] }, MAX_ITEM_LENGTH, MAX_ITEMS)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project core src/domain/value-objects/localized-tag-list.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the error and the value object**

```typescript
// packages/core/src/domain/errors/invalid-localized-tag-list-error.ts
import { DomainError } from './domain-error.ts';

export const LOCALIZED_TAG_LIST_VIOLATIONS = {
  NOT_AN_OBJECT: 'not-an-object',
  UNKNOWN_LOCALE_KEY: 'unknown-locale-key',
  NOT_AN_ARRAY: 'not-an-array',
  ITEM_NOT_A_STRING: 'item-not-a-string',
  ITEM_OVER_BUDGET: 'item-over-budget',
  TOO_MANY_ITEMS: 'too-many-items',
  MISSING_DEFAULT_LOCALE: 'missing-default-locale',
} as const;

export type LocalizedTagListViolation =
  (typeof LOCALIZED_TAG_LIST_VIOLATIONS)[keyof typeof LOCALIZED_TAG_LIST_VIOLATIONS];

export class InvalidLocalizedTagListError extends DomainError {
  readonly violation: LocalizedTagListViolation;

  constructor(violation: LocalizedTagListViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
```

```typescript
// packages/core/src/domain/value-objects/localized-tag-list.ts
import { DEFAULT_LOCALE, isLocale, type Locale } from '../enums/locale.ts';
import {
  InvalidLocalizedTagListError,
  LOCALIZED_TAG_LIST_VIOLATIONS,
} from '../errors/invalid-localized-tag-list-error.ts';

type LocalizedTagValues = Partial<Record<Locale, readonly string[]>>;

/**
 * `projects.tags` (data-model.md § 3): one array of free labels per locale,
 * capped in count and per-item length, mirroring the database's
 * `is_localized_array`.
 *
 * A sibling of `LocalizedText` rather than a generalization of it: the two are
 * validated differently enough — an item count cap, a per-item length check
 * inside an array — that one class branching on "string vs string[]" would be
 * harder to read than two short, separately-testable ones.
 */
export class LocalizedTagList {
  private constructor(
    private readonly values: Readonly<LocalizedTagValues>,
    private readonly fallback: readonly string[],
  ) {}

  static create(values: unknown, maxItemLength: number, maxItems: number): LocalizedTagList {
    if (typeof values !== 'object' || values === null || Array.isArray(values)) {
      throw new InvalidLocalizedTagListError(
        LOCALIZED_TAG_LIST_VIOLATIONS.NOT_AN_OBJECT,
        'A localized tag list must be an object keyed by locale.',
      );
    }

    const validated: Record<string, readonly string[]> = {};

    for (const [key, entry] of Object.entries(values as Record<string, unknown>)) {
      if (!isLocale(key)) {
        throw new InvalidLocalizedTagListError(
          LOCALIZED_TAG_LIST_VIOLATIONS.UNKNOWN_LOCALE_KEY,
          `"${key}" is not a supported locale.`,
        );
      }

      if (!Array.isArray(entry)) {
        throw new InvalidLocalizedTagListError(
          LOCALIZED_TAG_LIST_VIOLATIONS.NOT_AN_ARRAY,
          `The "${key}" entry must be an array of strings.`,
        );
      }

      if (entry.length > maxItems) {
        throw new InvalidLocalizedTagListError(
          LOCALIZED_TAG_LIST_VIOLATIONS.TOO_MANY_ITEMS,
          `The "${key}" entry exceeds its cap of ${maxItems} items.`,
        );
      }

      for (const item of entry) {
        if (typeof item !== 'string') {
          throw new InvalidLocalizedTagListError(
            LOCALIZED_TAG_LIST_VIOLATIONS.ITEM_NOT_A_STRING,
            `An item of the "${key}" entry must be a string.`,
          );
        }

        if (item.length > maxItemLength) {
          throw new InvalidLocalizedTagListError(
            LOCALIZED_TAG_LIST_VIOLATIONS.ITEM_OVER_BUDGET,
            `An item of the "${key}" entry exceeds its budget of ${maxItemLength} characters.`,
          );
        }
      }

      validated[key] = entry;
    }

    const fallback = validated[DEFAULT_LOCALE];

    if (fallback === undefined) {
      throw new InvalidLocalizedTagListError(
        LOCALIZED_TAG_LIST_VIOLATIONS.MISSING_DEFAULT_LOCALE,
        `A localized tag list must carry a "${DEFAULT_LOCALE}" entry.`,
      );
    }

    return new LocalizedTagList(validated, fallback);
  }

  /** The requested locale, or `en-US` when it has no entry (FR-34). */
  resolve(locale: Locale): readonly string[] {
    return this.values[locale] ?? this.fallback;
  }

  toJSON(): LocalizedTagValues {
    return { ...this.values };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project core src/domain/value-objects/localized-tag-list.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/errors/invalid-localized-tag-list-error.ts packages/core/src/domain/value-objects/localized-tag-list.ts packages/core/src/domain/value-objects/localized-tag-list.test.ts
git commit -m "feat(core): add LocalizedTagList value object

Refs #6"
```

---

## Task 6: `IconSvg` — sanitize a `class` attribute for animation names (U-5)

**Files:**
- Modify: `packages/core/src/domain/constants/icon-svg.ts`
- Modify: `packages/core/src/domain/errors/invalid-icon-svg-error.ts`
- Modify: `packages/core/src/domain/value-objects/icon-svg.ts`
- Modify: `packages/core/src/domain/value-objects/icon-svg.test.ts`

**Interfaces:**
- Produces: `ICON_SVG_CONSTANTS.ALLOWED_ANIMATION_CLASSES: readonly string[]`, a new `ICON_SVG_VIOLATIONS.DISALLOWED_CLASS`. `IconSvg.create` now accepts a `class` attribute whose value is one or more space-separated names from that whitelist, and rejects any other value for it. Consumed by Task 12 (the CSS module naming the same four classes) and Task 9's seed data (Task 12).

- [ ] **Step 1: Write the failing tests**

Read the current end of `packages/core/src/domain/value-objects/icon-svg.test.ts` first (it ends with a `describe` block of rejection cases). Add these cases inside the existing `describe('IconSvg', ...)` block, right after the `'accepts every whitelisted shape element'` test:

```typescript
  it('accepts a class attribute naming one whitelisted animation', () => {
    const markup = '<svg viewBox="0 0 24 24"><path class="orbit-pulse" d="M0 0"/></svg>';

    expect(() => IconSvg.create(markup)).not.toThrow();
  });

  it('accepts a class attribute naming more than one whitelisted animation', () => {
    const markup = '<svg viewBox="0 0 24 24"><path class="orbit-pulse orbit-drift" d="M0 0"/></svg>';

    expect(() => IconSvg.create(markup)).not.toThrow();
  });

  it('rejects a class attribute naming an unlisted animation', () => {
    const markup = '<svg viewBox="0 0 24 24"><path class="spin-forever" d="M0 0"/></svg>';

    expect(violationOf(markup)).toBe(ICON_SVG_VIOLATIONS.DISALLOWED_CLASS);
  });

  it('rejects a class attribute where one of several tokens is unlisted', () => {
    const markup = '<svg viewBox="0 0 24 24"><path class="orbit-pulse spin-forever" d="M0 0"/></svg>';

    expect(violationOf(markup)).toBe(ICON_SVG_VIOLATIONS.DISALLOWED_CLASS);
  });

  it('rejects a blank class attribute', () => {
    const markup = '<svg viewBox="0 0 24 24"><path class="" d="M0 0"/></svg>';

    expect(violationOf(markup)).toBe(ICON_SVG_VIOLATIONS.DISALLOWED_CLASS);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project core src/domain/value-objects/icon-svg.test.ts`
Expected: FAIL — `class` is currently rejected as `DISALLOWED_ATTRIBUTE`, not accepted/rejected as designed above; the three "rejects" cases fail because `error.violation` is `disallowed-attribute`, not `disallowed-class` (which does not exist yet).

- [ ] **Step 3: Extend the constants and the error**

In `packages/core/src/domain/constants/icon-svg.ts`, add `'class'` to `ALLOWED_ATTRIBUTES` and a new export, placed after `ALLOWED_ATTRIBUTES`:

```typescript
export const ALLOWED_ATTRIBUTES: readonly string[] = [
  'xmlns',
  'viewbox',
  'width',
  'height',
  'fill',
  'fill-rule',
  'clip-rule',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'stroke-dashoffset',
  'opacity',
  'transform',
  'd',
  'points',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'aria-hidden',
  'focusable',
  'class',
];

/**
 * The only values a `class` attribute may hold — one or more of these,
 * space-separated (U-5).
 *
 * The animation itself — its `@keyframes` — is authored once in `apps/web`,
 * in a stylesheet that names these same four classes; a stored SVG only ever
 * *names* one, it never carries the animation's definition. That split is
 * what keeps `visual_svg` a data column instead of a place CSS could be
 * smuggled in: this whitelist bounds it to four fixed tokens, not to
 * "anything that looks like a class name".
 */
export const ALLOWED_ANIMATION_CLASSES: readonly string[] = [
  'orbit-pulse',
  'orbit-draw',
  'orbit-drift',
  'orbit-spin',
];
```

In `packages/core/src/domain/errors/invalid-icon-svg-error.ts`, add one entry to `ICON_SVG_VIOLATIONS`:

```typescript
export const ICON_SVG_VIOLATIONS = {
  NOT_A_STRING: 'not-a-string',
  EMPTY: 'empty',
  OVER_BUDGET: 'over-budget',
  NOT_ROOTED_IN_SVG: 'not-rooted-in-svg',
  DISALLOWED_TAG: 'disallowed-tag',
  DISALLOWED_ATTRIBUTE: 'disallowed-attribute',
  DISALLOWED_CLASS: 'disallowed-class',
  EVENT_HANDLER: 'event-handler',
  DENIED_SCHEME: 'denied-scheme',
  MALFORMED: 'malformed',
} as const;
```

- [ ] **Step 4: Branch the scanner's attribute-value check on `class`**

In `packages/core/src/domain/value-objects/icon-svg.ts`, add a set beside `ALLOWED_ATTRIBUTES` at the top of the file:

```typescript
const ALLOWED_ATTRIBUTES = new Set(ICON_SVG_CONSTANTS.ALLOWED_ATTRIBUTES);
const ALLOWED_ANIMATION_CLASSES = new Set(ICON_SVG_CONSTANTS.ALLOWED_ANIMATION_CLASSES);
```

Replace the `readAttributeValue` function's call to `requireAllowedScheme` with a branch on the attribute name:

```typescript
function readAttributeValue(markup: string, from: number, attribute: string): number {
  const quote = markup[from];
  let index = from;
  let value: string;

  if (quote === '"' || quote === "'") {
    const close = markup.indexOf(quote, from + 1);

    if (close === -1) {
      throw new InvalidIconSvgError(
        ICON_SVG_VIOLATIONS.MALFORMED,
        `"${attribute}" has an unterminated value.`,
      );
    }

    value = markup.slice(from + 1, close);
    index = close + 1;
  } else {
    while (index < markup.length && !ATTRIBUTE_NAME_END.test(markup[index] ?? '')) {
      index += 1;
    }

    value = markup.slice(from, index);
  }

  if (attribute === 'class') {
    requireAllowedAnimationClasses(value);
  } else {
    requireAllowedScheme(value, attribute);
  }

  return index;
}

/**
 * A `class` is not a URL — the scheme denylist every other attribute goes
 * through does not apply to it, and never should. Each space-separated token
 * has to name one of the four animations the front end actually defines.
 */
function requireAllowedAnimationClasses(value: string): void {
  const tokens = value.trim().split(WHITESPACE_EVERYWHERE).filter((token) => token.length > 0);

  if (tokens.length === 0) {
    throw new InvalidIconSvgError(
      ICON_SVG_VIOLATIONS.DISALLOWED_CLASS,
      'A "class" attribute must not be blank.',
    );
  }

  for (const token of tokens) {
    if (!ALLOWED_ANIMATION_CLASSES.has(token)) {
      throw new InvalidIconSvgError(
        ICON_SVG_VIOLATIONS.DISALLOWED_CLASS,
        `"${token}" is not an allowed animation class.`,
      );
    }
  }
}
```

Leave every other function in the file untouched — `readAttribute`'s call into `ALLOWED_ATTRIBUTES.has(attribute)` already accepts `class` once it is in the whitelist constant from Step 3.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run --project core src/domain/value-objects/icon-svg.test.ts`
Expected: PASS (every prior case plus the 5 new ones).

- [ ] **Step 6: Run the whole `core` suite and typecheck**

Run: `pnpm vitest run --project core`
Expected: PASS, no regressions in `social-link.test.ts` (it never sets `class`, so its icons are unaffected).

Run: `pnpm --filter @portfolio/core typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/domain/constants/icon-svg.ts packages/core/src/domain/errors/invalid-icon-svg-error.ts packages/core/src/domain/value-objects/icon-svg.ts packages/core/src/domain/value-objects/icon-svg.test.ts
git commit -m "feat(core): let IconSvg carry a whitelisted animation class

Resolves U-5: the per-project decorative visual is a sanitized SVG, and its
elements can now name one of four predefined animations by class.

Refs #6"
```

---

## Task 7: `Project` entity

**Files:**
- Create: `packages/core/src/domain/errors/invalid-project-error.ts`
- Create: `packages/core/src/domain/entities/project.ts`
- Test: `packages/core/src/domain/entities/project.test.ts`

**Interfaces:**
- Consumes: `Entity`, `type EntityProperties` from `./entity.ts`; `Slug` (Task 1); `Url` (Task 2); `DateRange` (Task 3); `ProgressPercent` (Task 4); `LocalizedTagList` (Task 5); `LocalizedText`, `IconSvg` (existing).
- Produces: `Project.create(properties: ProjectProperties): Project` and getters `slug: Slug`, `title: LocalizedText`, `category: LocalizedText | null`, `description: LocalizedText | null`, `tags: LocalizedTagList | null`, `repoUrl: Url | null`, `liveUrl: Url | null`, `progress: ProgressPercent`, `period: DateRange`, `visualSvg: IconSvg | null`, `isFeatured: boolean`, `isPublished: boolean`, `sortOrder: number`. `type ProjectProperties`. Consumed by Task 8 (port/fake), Task 10 (use case), Task 15 (mapper).

- [ ] **Step 1: Write the failing test**

```typescript
// packages/core/src/domain/entities/project.test.ts
import { describe, expect, it } from 'vitest';

import { ENTITY_VIOLATIONS, InvalidEntityError } from '../errors/invalid-entity-error.ts';
import { InvalidProjectError, PROJECT_VIOLATIONS } from '../errors/invalid-project-error.ts';
import { DateRange } from '../value-objects/date-range.ts';
import { LocalizedText } from '../value-objects/localized-text.ts';
import { ProgressPercent } from '../value-objects/progress-percent.ts';
import { Slug } from '../value-objects/slug.ts';
import { Url } from '../value-objects/url.ts';
import { Project, type ProjectProperties } from './project.ts';

function properties(overrides: Partial<ProjectProperties> = {}): ProjectProperties {
  return {
    id: '5f1f1f1f-1f1f-4f1f-8f1f-1f1f1f1f1f1f',
    slug: Slug.create('orbit-portfolio'),
    title: LocalizedText.create({ 'en-US': 'Orbit Portfolio' }, 160),
    category: null,
    description: null,
    tags: null,
    repoUrl: null,
    liveUrl: null,
    progress: ProgressPercent.create(100),
    period: DateRange.create({ startedOn: '2026-08-08', endedOn: null }),
    visualSvg: null,
    isFeatured: true,
    isPublished: true,
    sortOrder: 0,
    ...overrides,
  };
}

function violationOf(overrides: Partial<ProjectProperties>): string {
  try {
    Project.create(properties(overrides));
  } catch (error) {
    if (error instanceof InvalidProjectError || error instanceof InvalidEntityError) {
      return error.violation;
    }

    throw error;
  }

  throw new Error('Expected the project to be rejected, and it was not.');
}

describe('Project', () => {
  it('holds every property it was created with', () => {
    const repoUrl = Url.create('https://github.com/NavesDev/orbit-portfolio');
    const project = Project.create(properties({ repoUrl }));

    expect(project.slug.toString()).toBe('orbit-portfolio');
    expect(project.title.resolve('en-US')).toBe('Orbit Portfolio');
    expect(project.repoUrl).toBe(repoUrl);
    expect(project.isFeatured).toBe(true);
    expect(project.isPublished).toBe(true);
  });

  it('rejects a missing id, from the shared Entity base', () => {
    expect(violationOf({ id: '' })).toBe(ENTITY_VIOLATIONS.MISSING_ID);
  });

  it('rejects a non-integer sort order', () => {
    expect(violationOf({ sortOrder: 1.5 })).toBe(PROJECT_VIOLATIONS.SORT_ORDER_NOT_AN_INTEGER);
  });

  it('two projects sharing an id are equal even with different content', () => {
    const first = Project.create(properties());
    const second = Project.create(properties({ isFeatured: false }));

    expect(first.equals(second)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project core src/domain/entities/project.test.ts`
Expected: FAIL — `./project.ts` and `../errors/invalid-project-error.ts` not found.

- [ ] **Step 3: Write the error and the entity**

```typescript
// packages/core/src/domain/errors/invalid-project-error.ts
import { DomainError } from './domain-error.ts';

export const PROJECT_VIOLATIONS = {
  SORT_ORDER_NOT_AN_INTEGER: 'sort-order-not-an-integer',
} as const;

export type ProjectViolation = (typeof PROJECT_VIOLATIONS)[keyof typeof PROJECT_VIOLATIONS];

export class InvalidProjectError extends DomainError {
  readonly violation: ProjectViolation;

  constructor(violation: ProjectViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
```

```typescript
// packages/core/src/domain/entities/project.ts
import { PROJECT_VIOLATIONS, InvalidProjectError } from '../errors/invalid-project-error.ts';
import type { DateRange } from '../value-objects/date-range.ts';
import type { IconSvg } from '../value-objects/icon-svg.ts';
import type { LocalizedTagList } from '../value-objects/localized-tag-list.ts';
import type { LocalizedText } from '../value-objects/localized-text.ts';
import type { ProgressPercent } from '../value-objects/progress-percent.ts';
import type { Slug } from '../value-objects/slug.ts';
import type { Url } from '../value-objects/url.ts';
import { Entity, type EntityProperties } from './entity.ts';

export interface ProjectProperties extends EntityProperties {
  readonly slug: Slug;
  readonly title: LocalizedText;
  readonly category: LocalizedText | null;
  readonly description: LocalizedText | null;
  readonly tags: LocalizedTagList | null;
  readonly repoUrl: Url | null;
  readonly liveUrl: Url | null;
  readonly progress: ProgressPercent;
  readonly period: DateRange;
  /** U-5 — the decorative visual, sanitized the same way `SocialLink.iconSvg` is. */
  readonly visualSvg: IconSvg | null;
  readonly isFeatured: boolean;
  readonly isPublished: boolean;
  readonly sortOrder: number;
}

/**
 * Portfolio work (FR-05–FR-10).
 *
 * Skills are referenced by id, never nested here: `project_skill` is read
 * through `ProjectRepository.listSkillUsage`, a read model, not through this
 * entity — the same separation `data-model.md` draws between an aggregate and
 * its join tables.
 *
 * The eyebrow's ordinal (`01 — agendamento`) is not a field here (U-6): it has
 * no home in the domain because it is not a fact about a project, only about
 * its position among the others on a given render.
 */
export class Project extends Entity<ProjectProperties> {
  private constructor(properties: ProjectProperties) {
    super(properties);
  }

  static create(properties: ProjectProperties): Project {
    if (!Number.isInteger(properties.sortOrder)) {
      throw new InvalidProjectError(
        PROJECT_VIOLATIONS.SORT_ORDER_NOT_AN_INTEGER,
        'A sort order must be an integer.',
      );
    }

    return new Project(properties);
  }

  get slug(): Slug {
    return this.properties.slug;
  }

  get title(): LocalizedText {
    return this.properties.title;
  }

  get category(): LocalizedText | null {
    return this.properties.category;
  }

  get description(): LocalizedText | null {
    return this.properties.description;
  }

  get tags(): LocalizedTagList | null {
    return this.properties.tags;
  }

  get repoUrl(): Url | null {
    return this.properties.repoUrl;
  }

  get liveUrl(): Url | null {
    return this.properties.liveUrl;
  }

  get progress(): ProgressPercent {
    return this.properties.progress;
  }

  get period(): DateRange {
    return this.properties.period;
  }

  get visualSvg(): IconSvg | null {
    return this.properties.visualSvg;
  }

  get isFeatured(): boolean {
    return this.properties.isFeatured;
  }

  get isPublished(): boolean {
    return this.properties.isPublished;
  }

  get sortOrder(): number {
    return this.properties.sortOrder;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project core src/domain/entities/project.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/errors/invalid-project-error.ts packages/core/src/domain/entities/project.ts packages/core/src/domain/entities/project.test.ts
git commit -m "feat(core): add Project entity

Refs #6"
```

---

## Task 8: `ProjectSkillUsage` read model, `ProjectRepository` port and its fake

**Files:**
- Create: `packages/core/src/application/read-models/project-skill-usage.ts`
- Create: `packages/core/src/application/ports/project-repository.ts`
- Create: `packages/core/src/application/ports/__fakes__/fake-project-repository.ts`

**Interfaces:**
- Consumes: `Project` (Task 7), `LocalizedText` (existing).
- Produces: `interface ProjectSkillUsage { skillName: string; usageNote: LocalizedText | null }`; `interface ProjectRepository { listFeatured(): Promise<Project[]>; listSkillUsage(projectId: string): Promise<ProjectSkillUsage[]> }`; `class FakeProjectRepository` — constructed with `readonly Project[]` and a `Map<string, ProjectSkillUsage[]>` of skill usages keyed by project id. Consumed by Task 10 (use case), Task 11 (use-case test), Task 15 (Postgres implementation).

This task has no test of its own — a port is an interface and a fake has no
behaviour beyond what Task 11's use-case tests exercise through it. It is
verified by `pnpm --filter @portfolio/core typecheck` passing once Task 10
compiles against it.

- [ ] **Step 1: Write the read model**

```typescript
// packages/core/src/application/read-models/project-skill-usage.ts
import type { LocalizedText } from '../../domain/value-objects/localized-text.ts';

/**
 * One row of `project_skill`, joined to the skill's name (data-model.md § 5).
 *
 * A read model, not an entity: `usage_note` belongs to the pairing, and this
 * type exists only to carry it back out. `skillName` is a plain string because
 * `skills.name` is a proper noun, never translated.
 */
export interface ProjectSkillUsage {
  readonly skillName: string;
  readonly usageNote: LocalizedText | null;
}
```

- [ ] **Step 2: Write the port**

```typescript
// packages/core/src/application/ports/project-repository.ts
import type { Project } from '../../domain/entities/project.ts';
import type { ProjectSkillUsage } from '../read-models/project-skill-usage.ts';

/**
 * Persistence for portfolio work, declared here and implemented by
 * `@portfolio/db` (clean-architecture.md § 5).
 *
 * `listFeatured` takes no argument and no locale: "featured and published" is
 * a fact about the rows, not a parameter a caller supplies, and a repository
 * never resolves a language — `ListFeaturedProjects` does. Ordering is not
 * guaranteed by this contract either; the use case sorts, the same way
 * `ListSocialLinks` re-sorts what `SocialLinkRepository.listPublished`
 * returns, so both a real and a fake implementation produce the same order.
 *
 * `listSkillUsage` is the read side of `project_skill` (data-model.md § 5) —
 * that join table is persisted by this aggregate root and never gets a
 * repository of its own.
 */
export interface ProjectRepository {
  listFeatured(): Promise<Project[]>;
  listSkillUsage(projectId: string): Promise<ProjectSkillUsage[]>;
}
```

- [ ] **Step 3: Write the fake**

```typescript
// packages/core/src/application/ports/__fakes__/fake-project-repository.ts
import type { Project } from '../../../domain/entities/project.ts';
import type { ProjectSkillUsage } from '../../read-models/project-skill-usage.ts';
import type { ProjectRepository } from '../project-repository.ts';

/**
 * In-memory `ProjectRepository` for use-case tests.
 *
 * It holds unfeatured and unpublished projects too, and drops them in
 * `listFeatured` — mirroring `FakeSocialLinkRepository`'s shape — so "only
 * featured, published projects reach the page" is a fact a unit test can
 * establish with no database. Insertion order is deliberately arbitrary: the
 * use case owns the ordering contract.
 */
export class FakeProjectRepository implements ProjectRepository {
  private readonly projects = new Map<string, Project>();
  private readonly skillUsagesByProjectId: ReadonlyMap<string, readonly ProjectSkillUsage[]>;

  constructor(
    projects: readonly Project[] = [],
    skillUsagesByProjectId: ReadonlyMap<string, readonly ProjectSkillUsage[]> = new Map(),
  ) {
    for (const project of projects) {
      this.projects.set(project.id, project);
    }

    this.skillUsagesByProjectId = skillUsagesByProjectId;
  }

  listFeatured(): Promise<Project[]> {
    return Promise.resolve(
      [...this.projects.values()].filter((project) => project.isFeatured && project.isPublished),
    );
  }

  listSkillUsage(projectId: string): Promise<ProjectSkillUsage[]> {
    return Promise.resolve([...(this.skillUsagesByProjectId.get(projectId) ?? [])]);
  }
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @portfolio/core typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/application/read-models/project-skill-usage.ts packages/core/src/application/ports/project-repository.ts packages/core/src/application/ports/__fakes__/fake-project-repository.ts
git commit -m "feat(core): add ProjectRepository port and its fake

Refs #6"
```

---

## Task 9: DTOs — `ProjectCardView`, `ProjectSkillView`, `ProjectDetailView`

**Files:**
- Create: `packages/core/src/application/dto/project-card-view.ts`
- Create: `packages/core/src/application/dto/project-skill-view.ts`
- Create: `packages/core/src/application/dto/project-detail-view.ts`

**Interfaces:**
- Produces: `interface ProjectCardView`, `interface ProjectSkillView`, `interface ProjectDetailView extends ProjectCardView`. Consumed by Task 10 (use case), and by every `apps/web` component task (16–20).

No test — these are structural types with no behaviour; Task 11 exercises the shapes they take through the use case.

- [ ] **Step 1: Write the DTOs**

```typescript
// packages/core/src/application/dto/project-card-view.ts
/**
 * One card of the featured-projects section, as presentation receives it
 * (NFR-13).
 *
 * Plain strings and numbers only — no `LocalizedText`, no `Slug`, no
 * `IconSvg`, no entity. `slug` is a string here because it doubles as the
 * lookup key into `ListFeaturedProjectsOutput.details` and as the `key` prop
 * a list of cards renders with.
 */
export interface ProjectCardView {
  readonly slug: string;
  readonly title: string;
  /** `null` when the project has no category (data-model.md § 3 — nullable). */
  readonly category: string | null;
  readonly tags: readonly string[];
  /** `null` when there is nothing to show a bar for (FR-07). */
  readonly progressPercent: number | null;
  /** Sanitized SVG markup, or `null` when the project has none (U-5). */
  readonly visualSvg: string | null;
}
```

```typescript
// packages/core/src/application/dto/project-skill-view.ts
/** One applied skill, as the detail modal lists it. */
export interface ProjectSkillView {
  readonly name: string;
  readonly usageNote: string | null;
}
```

```typescript
// packages/core/src/application/dto/project-detail-view.ts
import type { ProjectCardView } from './project-card-view.ts';
import type { ProjectSkillView } from './project-skill-view.ts';

/**
 * Everything the detail modal shows, beyond what the card already carries.
 *
 * Extends `ProjectCardView` rather than duplicating its fields: the modal
 * opens from a card and shows everything the card shows plus more, never
 * less.
 */
export interface ProjectDetailView extends ProjectCardView {
  readonly description: string | null;
  /** Omitted from the modal's controls when `null` (FR-09). */
  readonly repoUrl: string | null;
  readonly liveUrl: string | null;
  readonly skills: readonly ProjectSkillView[];
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @portfolio/core typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/application/dto/project-card-view.ts packages/core/src/application/dto/project-skill-view.ts packages/core/src/application/dto/project-detail-view.ts
git commit -m "feat(core): add project view DTOs

Refs #6"
```

---

## Task 10 & 11: `ListFeaturedProjects` use case, TDD

**Files:**
- Create: `packages/core/src/application/use-cases/projects/list-featured-projects.ts`
- Test: `packages/core/src/application/use-cases/projects/list-featured-projects.test.ts`

**Interfaces:**
- Consumes: `Project` (Task 7), `ProjectRepository` (Task 8), `FakeProjectRepository` (Task 8), `ProjectSkillUsage` (Task 8), `ProjectCardView`/`ProjectDetailView`/`ProjectSkillView` (Task 9), `type Locale` from `../../../domain/enums/locale.ts`, `LocalizedText` (existing).
- Produces: `interface ListFeaturedProjectsOutput { projects: readonly ProjectCardView[]; details: Readonly<Record<string, ProjectDetailView>> }`; `class ListFeaturedProjects { constructor(repository: ProjectRepository); execute(locale: Locale, limit: number): Promise<ListFeaturedProjectsOutput> }`. Consumed by Task 16 (`apps/web`'s composition root) and the barrel (Task 12).

- [ ] **Step 1: Write the failing test**

```typescript
// packages/core/src/application/use-cases/projects/list-featured-projects.test.ts
import { describe, expect, it } from 'vitest';

import { Project, type ProjectProperties } from '../../../domain/entities/project.ts';
import { DateRange } from '../../../domain/value-objects/date-range.ts';
import { IconSvg } from '../../../domain/value-objects/icon-svg.ts';
import { LocalizedText } from '../../../domain/value-objects/localized-text.ts';
import { LocalizedTagList } from '../../../domain/value-objects/localized-tag-list.ts';
import { ProgressPercent } from '../../../domain/value-objects/progress-percent.ts';
import { Slug } from '../../../domain/value-objects/slug.ts';
import { Url } from '../../../domain/value-objects/url.ts';
import { FakeProjectRepository } from '../../ports/__fakes__/fake-project-repository.ts';
import type { ProjectSkillUsage } from '../../read-models/project-skill-usage.ts';
import { ListFeaturedProjects } from './list-featured-projects.ts';

function project(overrides: Partial<ProjectProperties> = {}): Project {
  return Project.create({
    id: overrides.slug?.toString() ?? 'orbit-portfolio',
    slug: Slug.create('orbit-portfolio'),
    title: LocalizedText.create({ 'en-US': 'Orbit Portfolio', 'pt-BR': 'Orbit Portfolio' }, 160),
    category: LocalizedText.create({ 'en-US': 'Personal portfolio' }, 40),
    description: LocalizedText.create({ 'en-US': 'A bilingual portfolio.' }, 8000),
    tags: LocalizedTagList.create({ 'en-US': ['Next.js'] }, 60, 8),
    repoUrl: Url.create('https://github.com/NavesDev/orbit-portfolio'),
    liveUrl: null,
    progress: ProgressPercent.create(100),
    period: DateRange.create({ startedOn: '2026-08-08', endedOn: null }),
    visualSvg: null,
    isFeatured: true,
    isPublished: true,
    sortOrder: 0,
    ...overrides,
  });
}

function useCase(
  projects: Project[],
  skillUsages: ReadonlyMap<string, readonly ProjectSkillUsage[]> = new Map(),
): ListFeaturedProjects {
  return new ListFeaturedProjects(new FakeProjectRepository(projects, skillUsages));
}

describe('ListFeaturedProjects', () => {
  it('orders projects by sort_order regardless of the order they arrive in', async () => {
    const { projects } = await useCase([
      project({ id: 'c', slug: Slug.create('c-project'), sortOrder: 2 }),
      project({ id: 'a', slug: Slug.create('a-project'), sortOrder: 0 }),
      project({ id: 'b', slug: Slug.create('b-project'), sortOrder: 1 }),
    ]).execute('en-US', 10);

    expect(projects.map((view) => view.slug)).toEqual(['a-project', 'b-project', 'c-project']);
  });

  it('breaks a sort_order tie on started_on, most recent first', async () => {
    const { projects } = await useCase([
      project({
        id: 'older',
        slug: Slug.create('older'),
        sortOrder: 0,
        period: DateRange.create({ startedOn: '2025-01-01', endedOn: null }),
      }),
      project({
        id: 'newer',
        slug: Slug.create('newer'),
        sortOrder: 0,
        period: DateRange.create({ startedOn: '2026-01-01', endedOn: null }),
      }),
    ]).execute('en-US', 10);

    expect(projects.map((view) => view.slug)).toEqual(['newer', 'older']);
  });

  it('never returns an unpublished or unfeatured project (FR-05, FR-28)', async () => {
    const { projects } = await useCase([
      project({ id: 'shown', slug: Slug.create('shown'), sortOrder: 0 }),
      project({ id: 'unpublished', slug: Slug.create('unpublished'), sortOrder: 1, isPublished: false }),
      project({ id: 'unfeatured', slug: Slug.create('unfeatured'), sortOrder: 2, isFeatured: false }),
    ]).execute('en-US', 10);

    expect(projects.map((view) => view.slug)).toEqual(['shown']);
  });

  it('honours the limit after sorting', async () => {
    const { projects } = await useCase([
      project({ id: 'a', slug: Slug.create('a-project'), sortOrder: 0 }),
      project({ id: 'b', slug: Slug.create('b-project'), sortOrder: 1 }),
    ]).execute('en-US', 1);

    expect(projects.map((view) => view.slug)).toEqual(['a-project']);
  });

  it('resolves a field with no pt-BR translation to its en-US text (FR-34)', async () => {
    const { projects } = await useCase([
      project({ title: LocalizedText.create({ 'en-US': 'English only' }, 160) }),
    ]).execute('pt-BR', 10);

    expect(projects[0]?.title).toBe('English only');
  });

  it('hands the card presentation plain strings, not value objects (NFR-13)', async () => {
    const { projects } = await useCase([project()]).execute('en-US', 10);

    expect(projects[0]).toEqual({
      slug: 'orbit-portfolio',
      title: 'Orbit Portfolio',
      category: 'Personal portfolio',
      tags: ['Next.js'],
      progressPercent: 100,
      visualSvg: null,
    });
  });

  it('carries a visualSvg string through when the project has one', async () => {
    const icon = IconSvg.create('<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>');
    const { projects } = await useCase([project({ visualSvg: icon })]).execute('en-US', 10);

    expect(projects[0]?.visualSvg).toBe(icon.toString());
  });

  it('keys the detail view by slug and includes applied skills with usage notes', async () => {
    const shown = project();
    const usages: ProjectSkillUsage[] = [
      {
        skillName: 'Next.js',
        usageNote: LocalizedText.create({ 'en-US': 'App Router throughout.' }, 240),
      },
      { skillName: 'PostgreSQL', usageNote: null },
    ];

    const { details } = await useCase([shown], new Map([[shown.id, usages]])).execute('en-US', 10);

    expect(details['orbit-portfolio']).toEqual({
      slug: 'orbit-portfolio',
      title: 'Orbit Portfolio',
      category: 'Personal portfolio',
      tags: ['Next.js'],
      progressPercent: 100,
      visualSvg: null,
      description: 'A bilingual portfolio.',
      repoUrl: 'https://github.com/NavesDev/orbit-portfolio',
      liveUrl: null,
      skills: [
        { name: 'Next.js', usageNote: 'App Router throughout.' },
        { name: 'PostgreSQL', usageNote: null },
      ],
    });
  });

  it('omits repoUrl and liveUrl from the detail view when the project has none', async () => {
    const { details } = await useCase([project({ repoUrl: null, liveUrl: null })]).execute(
      'en-US',
      10,
    );

    expect(details['orbit-portfolio']?.repoUrl).toBeNull();
    expect(details['orbit-portfolio']?.liveUrl).toBeNull();
  });

  it('returns nothing when there are no featured, published projects', async () => {
    const { projects, details } = await useCase([]).execute('en-US', 10);

    expect(projects).toEqual([]);
    expect(details).toEqual({});
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project core src/application/use-cases/projects/list-featured-projects.test.ts`
Expected: FAIL — `./list-featured-projects.ts` not found.

- [ ] **Step 3: Write the use case**

```typescript
// packages/core/src/application/use-cases/projects/list-featured-projects.ts
import type { Project } from '../../../domain/entities/project.ts';
import type { Locale } from '../../../domain/enums/locale.ts';
import type { ProjectCardView } from '../../dto/project-card-view.ts';
import type { ProjectDetailView } from '../../dto/project-detail-view.ts';
import type { ProjectSkillView } from '../../dto/project-skill-view.ts';
import type { ProjectRepository } from '../../ports/project-repository.ts';
import type { ProjectSkillUsage } from '../../read-models/project-skill-usage.ts';

export interface ListFeaturedProjectsOutput {
  readonly projects: readonly ProjectCardView[];
  /** The same projects, keyed by `slug`, for the detail modal (FR-06–FR-10). */
  readonly details: Readonly<Record<string, ProjectDetailView>>;
}

/**
 * The featured-projects section's data (FR-05–FR-10, NFR-13).
 *
 * `limit` is applied after sorting, not before: `ProjectRepository.listFeatured`
 * returns every featured, published project with no cap, and capping earlier
 * than the sort could drop the very row `sort_order` would have put first.
 *
 * The card and the detail view are produced together, in one pass, because
 * this sprint has exactly one caller for both — the home page. A second use
 * case for the modal's data would have no second call site to justify it.
 */
export class ListFeaturedProjects {
  constructor(private readonly repository: ProjectRepository) {}

  async execute(locale: Locale, limit: number): Promise<ListFeaturedProjectsOutput> {
    const featured = [...(await this.repository.listFeatured())].sort(byOrder).slice(0, limit);

    const projects: ProjectCardView[] = [];
    const details: Record<string, ProjectDetailView> = {};

    for (const project of featured) {
      const usages = await this.repository.listSkillUsage(project.id);
      const card = toCardView(project, locale);

      projects.push(card);
      details[card.slug] = toDetailView(project, locale, usages);
    }

    return { projects, details };
  }
}

/**
 * `sort_order` first, then `started_on` descending — the default ordering
 * `data-model.md` documents for any collection, applied here the same way
 * `ListSocialLinks` applies its own tiebreak: in the use case, so a fake
 * repository and the real one produce identical output.
 */
function byOrder(left: Project, right: Project): number {
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }

  const leftStarted = left.period.startedOn ?? '';
  const rightStarted = right.period.startedOn ?? '';

  return rightStarted.localeCompare(leftStarted);
}

function toCardView(project: Project, locale: Locale): ProjectCardView {
  return {
    slug: project.slug.toString(),
    title: project.title.resolve(locale),
    category: project.category?.resolve(locale) ?? null,
    tags: project.tags === null ? [] : [...project.tags.resolve(locale)],
    progressPercent: project.progress.value,
    visualSvg: project.visualSvg?.toString() ?? null,
  };
}

function toDetailView(
  project: Project,
  locale: Locale,
  usages: readonly ProjectSkillUsage[],
): ProjectDetailView {
  return {
    ...toCardView(project, locale),
    description: project.description?.resolve(locale) ?? null,
    repoUrl: project.repoUrl?.toString() ?? null,
    liveUrl: project.liveUrl?.toString() ?? null,
    skills: usages.map((usage) => toSkillView(usage, locale)),
  };
}

function toSkillView(usage: ProjectSkillUsage, locale: Locale): ProjectSkillView {
  return {
    name: usage.skillName,
    usageNote: usage.usageNote?.resolve(locale) ?? null,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project core src/application/use-cases/projects/list-featured-projects.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Run the whole `core` suite and typecheck**

Run: `pnpm vitest run --project core`
Run: `pnpm --filter @portfolio/core typecheck`
Expected: both pass with no regressions.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/application/use-cases/projects/list-featured-projects.ts packages/core/src/application/use-cases/projects/list-featured-projects.test.ts
git commit -m "feat(core): add ListFeaturedProjects use case

Refs #6"
```

---

## Task 12: `@portfolio/core` barrel exports

**Files:**
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: everything created in Tasks 1–11.
- Produces: every one of those names, re-exported from `@portfolio/core`. Consumed by `@portfolio/db` (Task 15) and `apps/web` (Tasks 16+).

- [ ] **Step 1: Add the new exports**

Append to `packages/core/src/index.ts`, after the existing `ListSocialLinks` export block, in the same style (grouped by kind: value objects and their errors, then the entity and its error, then the port/fake/DTOs/use case):

```typescript
export {
  InvalidSlugError,
  SLUG_VIOLATIONS,
  type SlugViolation,
} from './domain/errors/invalid-slug-error.ts';
export { Slug } from './domain/value-objects/slug.ts';
export {
  InvalidUrlError,
  URL_VIOLATIONS,
  type UrlViolation,
} from './domain/errors/invalid-url-error.ts';
export { Url } from './domain/value-objects/url.ts';
export {
  DATE_RANGE_VIOLATIONS,
  InvalidDateRangeError,
  type DateRangeViolation,
} from './domain/errors/invalid-date-range-error.ts';
export { DateRange, type DateRangeProperties } from './domain/value-objects/date-range.ts';
export {
  InvalidProgressPercentError,
  PROGRESS_PERCENT_VIOLATIONS,
  type ProgressPercentViolation,
} from './domain/errors/invalid-progress-percent-error.ts';
export { ProgressPercent } from './domain/value-objects/progress-percent.ts';
export {
  InvalidLocalizedTagListError,
  LOCALIZED_TAG_LIST_VIOLATIONS,
  type LocalizedTagListViolation,
} from './domain/errors/invalid-localized-tag-list-error.ts';
export { LocalizedTagList } from './domain/value-objects/localized-tag-list.ts';
export {
  InvalidProjectError,
  PROJECT_VIOLATIONS,
  type ProjectViolation,
} from './domain/errors/invalid-project-error.ts';
export { Project, type ProjectProperties } from './domain/entities/project.ts';
export type { ProjectSkillUsage } from './application/read-models/project-skill-usage.ts';
export type { ProjectRepository } from './application/ports/project-repository.ts';
export type { ProjectCardView } from './application/dto/project-card-view.ts';
export type { ProjectSkillView } from './application/dto/project-skill-view.ts';
export type { ProjectDetailView } from './application/dto/project-detail-view.ts';
export {
  ListFeaturedProjects,
  type ListFeaturedProjectsOutput,
} from './application/use-cases/projects/list-featured-projects.ts';
```

`FakeProjectRepository` is deliberately not exported here — `FakeSocialLinkRepository` is not either; fakes are test-only and reached by tests through a relative import into `packages/core/src`, never through the package's public surface.

- [ ] **Step 2: Typecheck and run the full `core` suite**

Run: `pnpm --filter @portfolio/core typecheck`
Run: `pnpm vitest run --project core`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/index.ts
git commit -m "feat(core): export the Project slice from the package barrel

Refs #6"
```

---

## Task 13: Migration `010_projects_visual.sql` and `data-model.md`

**Files:**
- Create: `packages/db/src/migrations/010_projects_visual.sql`
- Modify: `docs/domain/data-model.md`

**Interfaces:**
- Produces: `projects.visual_svg text` (nullable). Consumed by Task 15 (repository/mapper) and Task 14 (seed).

- [ ] **Step 1: Write the migration**

```sql
-- packages/db/src/migrations/010_projects_visual.sql
-- The per-project decorative visual (U-5, sprint-01.md).
--
-- `text`, not `varchar(n)`: the length ceiling for this column is `IconSvg`'s
-- own MAX_LENGTH (4096), enforced in the domain exactly like `icon_svg`'s is
-- on social_links — a CHECK here would just restate that number a second time
-- with no independent value, since sanitization (the actual risk) is not
-- something SQL can express. No CHECK is added for the same reason
-- `icon_svg` has none beyond its own column type.
-- data-model.md § 3

ALTER TABLE projects ADD COLUMN visual_svg text;
```

- [ ] **Step 2: Document the column in `data-model.md`**

In `docs/domain/data-model.md`, in the `## 3. \`projects\`` table, add a row
right after `progress_percent`:

```markdown
| `visual_svg` | `text` | yes | Sanitized inline SVG, the card and modal's decorative visual (U-5). Same `IconSvg` value object as `social_links.icon_svg`; its whitelist additionally accepts a `class` attribute naming one of four predefined animations. |
```

Immediately below the existing "`tags` holds one array per locale…" paragraph, add:

```markdown
**Why `visual_svg` lives on the aggregate rather than being derived from
`category` (U-5).** The prototype's artwork — a node grid, concentric rings, a
line chart — differs per project in a way `category` cannot predict, unlike the
skills orbit's ring colours, which are a fixed function of `skill_category`.
Reusing `IconSvg` rather than introducing a second sanitizer keeps the one
security boundary (NFR-07) responsible for every piece of markup this database
ever renders as-is.
```

- [ ] **Step 3: Verify the migration is idempotent and runs clean**

This requires `TEST_DATABASE_URL` set and Docker's `postgres` service up
(`docker compose up -d postgres`). If neither is available in this environment,
skip running it now and let Task 15's integration tests (which run every
migration against a scratch database) be the first execution — note that in
the commit body.

Run: `pnpm db:migrate`
Expected: `010_projects_visual.sql` applied; running it again does nothing
(the migration runner tracks applied migrations by filename — confirm this
against `packages/db/src/migrate.ts` if unfamiliar with it before assuming).

- [ ] **Step 4: Commit**

```bash
git add packages/db/src/migrations/010_projects_visual.sql docs/domain/data-model.md
git commit -m "feat(db): add projects.visual_svg column

Refs #6"
```

---

## Task 14: Seed — `visualSvg` on `SeedProject`

**Files:**
- Modify: `packages/db/src/seed/data.ts`
- Modify: `packages/db/src/seed/strategies/projects.strategy.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `SeedProject.visualSvg: string | null`, written to `projects.visual_svg`. No new export — internal to the seed.

- [ ] **Step 1: Add the field to the type and to each seeded project**

In `packages/db/src/seed/data.ts`, add `visualSvg: string | null;` to the
`SeedProject` interface, immediately after `tags: LocalizedList;`:

```typescript
export interface SeedProject {
  slug: string;
  title: Localized;
  category: Localized;
  description: Localized;
  tags: LocalizedList;
  visualSvg: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
  progressPercent: number;
  startedOn: string;
  endedOn: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  skills: SkillUsage;
}
```

Read every object currently in the `projects: [...]` array (there are three,
confirmed in Task 0's exploration — re-open the file and confirm the exact
count before editing, since the array is the author's own content and may have
grown). For each one, add a `visualSvg` field placed after `tags`. Use a small
node-grid SVG for the first (matching the prototype's own decoration for its
first card), authored with one animated element:

```typescript
      visualSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 225">' +
        '<line x1="0" y1="75" x2="300" y2="75" stroke="rgb(37,106,191)" stroke-opacity="0.25"/>' +
        '<line x1="100" y1="0" x2="100" y2="225" stroke="rgb(37,106,191)" stroke-opacity="0.25"/>' +
        '<circle class="orbit-pulse" cx="96" cy="54" r="4" fill="rgb(37,106,191)"/>' +
        '</svg>',
```

For each remaining seeded project, author a similarly small SVG (concentric
rings for the second, an ascending line for the third — matching the
prototype's own per-card motifs) with at least one element carrying a
`class="orbit-draw"`, `"orbit-drift"` or `"orbit-spin"` value, so the section
demonstrates more than one animation in `pnpm dev`. If a fourth project exists
that the exploration above did not anticipate, give it `visualSvg: null` rather
than inventing a fourth animated motif — `visual_svg` is nullable and a project
with no authored visual is a valid, expected state.

- [ ] **Step 2: Write it in the strategy**

In `packages/db/src/seed/strategies/projects.strategy.ts`, add `visual_svg` to
the column list, the parameter list and the `ON CONFLICT` update:

```typescript
      await client.query(
        `INSERT INTO projects (id, slug, title, category, description, tags, visual_svg,
                               repo_url, live_url, progress_percent, started_on, ended_on,
                               is_featured, is_published, sort_order)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO UPDATE
                SET slug = EXCLUDED.slug,
                    title = EXCLUDED.title,
                    category = EXCLUDED.category,
                    description = EXCLUDED.description,
                    tags = EXCLUDED.tags,
                    visual_svg = EXCLUDED.visual_svg,
                    repo_url = EXCLUDED.repo_url,
                    live_url = EXCLUDED.live_url,
                    progress_percent = EXCLUDED.progress_percent,
                    started_on = EXCLUDED.started_on,
                    ended_on = EXCLUDED.ended_on,
                    is_featured = EXCLUDED.is_featured,
                    is_published = EXCLUDED.is_published,
                    sort_order = EXCLUDED.sort_order,
                    updated_at = now()`,
        [
          id,
          project.slug,
          json(project.title),
          json(project.category),
          json(project.description),
          json(project.tags),
          project.visualSvg,
          project.repoUrl,
          project.liveUrl,
          project.progressPercent,
          project.startedOn,
          project.endedOn,
          project.isFeatured,
          project.isPublished,
          project.sortOrder,
        ],
      );
```

- [ ] **Step 2: Check the existing seed test for a shape assertion to extend**

Read `packages/db/tests/unit/seed/data.test.ts`. If it asserts on the full
shape of a `SeedProject` (e.g. `Object.keys`), add `visualSvg` there. If it
only asserts relational facts (skill names exist, slugs are unique — matching
what Task 0's exploration of `support.ts` suggested `usages()` guards), no
change is needed; state which case applied in the commit body.

- [ ] **Step 3: Run the db-unit suite**

Run: `pnpm vitest run --project db-unit`
Expected: PASS, no regressions.

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @portfolio/db typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/seed/data.ts packages/db/src/seed/strategies/projects.strategy.ts
git commit -m "feat(db): seed projects.visual_svg

Refs #6"
```

---

## Task 15: `PostgresProjectRepository`, `project.mapper.ts`, integration tests

**Files:**
- Create: `packages/db/src/mappers/project.mapper.ts`
- Create: `packages/db/src/repositories/postgres-project.repository.ts`
- Modify: `packages/db/src/index.ts`
- Test: `packages/db/tests/integration/repositories/project.repository.test.ts`

**Interfaces:**
- Consumes: `Project`, `ProjectRepository`, `ProjectSkillUsage`, `Slug`, `Url`, `DateRange`, `ProgressPercent`, `LocalizedText`, `LocalizedTagList`, `IconSvg`, `TITLE_MAX_LENGTH`, `CATEGORY_MAX_LENGTH`, `DESCRIPTION_MAX_LENGTH`, `TAG_MAX_LENGTH`, `TAGS_MAX_ITEMS`, `USAGE_NOTE_MAX_LENGTH` — all from `@portfolio/core`; `BaseRepository`, `type Queryable` from `../repositories/base.repository.ts`.
- Produces: `class PostgresProjectRepository extends BaseRepository implements ProjectRepository`, exported from `@portfolio/db`. `projectMapper.toDomain(row: ProjectRow): Project`. Consumed by Task 16 (`apps/web`'s composition root).

- [ ] **Step 1: Write the mapper**

```typescript
// packages/db/src/mappers/project.mapper.ts
import {
  CATEGORY_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  DateRange,
  IconSvg,
  LocalizedTagList,
  LocalizedText,
  Project,
  Slug,
  TAGS_MAX_ITEMS,
  TAG_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  Url,
} from '@portfolio/core';

/**
 * The `projects` row, exactly as the driver returns it.
 *
 * `started_on` and `ended_on` are selected as `::text` by the repository, not
 * left as the driver's own `date` type — `pg`'s default date parser returns a
 * JS `Date` built from local-time fields, and round-tripping that through
 * `toISOString()` (UTC) can shift the calendar day. Casting in SQL sidesteps
 * the driver's date type entirely, so this mapper only ever sees the
 * `YYYY-MM-DD` string `DateRange` already expects.
 */
export interface ProjectRow {
  readonly id: string;
  readonly slug: string;
  readonly title: unknown;
  readonly category: unknown | null;
  readonly description: unknown | null;
  readonly tags: unknown | null;
  readonly repo_url: string | null;
  readonly live_url: string | null;
  readonly progress_percent: number | null;
  readonly started_on: string | null;
  readonly ended_on: string | null;
  readonly visual_svg: string | null;
  readonly is_featured: boolean;
  readonly is_published: boolean;
  readonly sort_order: number;
}

/**
 * Row ⇒ entity for `projects`. Read-only: this slice has no writer yet — the
 * seed writes `projects` directly with hand-written SQL, the same way it
 * already writes every other table, and nothing in this task needs a `save`.
 *
 * `visual_svg` passes through `IconSvg.create` here, exactly as `icon_svg`
 * does in `social-link.mapper.ts`: a row edited by hand into carrying
 * something outside the whitelist fails at this boundary, not in the browser
 * (NFR-07).
 */
export const projectMapper = {
  toDomain(row: ProjectRow): Project {
    return Project.create({
      id: row.id,
      slug: Slug.create(row.slug),
      title: LocalizedText.create(row.title, TITLE_MAX_LENGTH),
      category: row.category === null ? null : LocalizedText.create(row.category, CATEGORY_MAX_LENGTH),
      description:
        row.description === null ? null : LocalizedText.create(row.description, DESCRIPTION_MAX_LENGTH),
      tags: row.tags === null ? null : LocalizedTagList.create(row.tags, TAG_MAX_LENGTH, TAGS_MAX_ITEMS),
      repoUrl: row.repo_url === null ? null : Url.create(row.repo_url),
      liveUrl: row.live_url === null ? null : Url.create(row.live_url),
      progress: row.progress_percent === null ? ProgressPercentOfNull() : ProgressPercentOf(row.progress_percent),
      period: DateRange.create({ startedOn: row.started_on, endedOn: row.ended_on }),
      visualSvg: row.visual_svg === null ? null : IconSvg.create(row.visual_svg),
      isFeatured: row.is_featured,
      isPublished: row.is_published,
      sortOrder: row.sort_order,
    });
  },
};
```

Wait — remove the two throwaway helper names above; `ProgressPercent.create`
already accepts `number | null` directly. Replace that one line with:

```typescript
      progress: ProgressPercent.create(row.progress_percent),
```

and add `ProgressPercent` to the `@portfolio/core` import list at the top of
the file, alphabetically among the others:

```typescript
import {
  CATEGORY_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  DateRange,
  IconSvg,
  LocalizedTagList,
  LocalizedText,
  ProgressPercent,
  Project,
  Slug,
  TAGS_MAX_ITEMS,
  TAG_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  Url,
} from '@portfolio/core';
```

- [ ] **Step 2: Write the repository**

```typescript
// packages/db/src/repositories/postgres-project.repository.ts
import { LocalizedText, USAGE_NOTE_MAX_LENGTH, type Project, type ProjectRepository, type ProjectSkillUsage } from '@portfolio/core';

import { projectMapper, type ProjectRow } from '../mappers/project.mapper.ts';
import { BaseRepository, type Queryable } from './base.repository.ts';

const PROJECT_COLUMNS =
  'id, slug, title, category, description, tags, repo_url, live_url, progress_percent, ' +
  "started_on::text AS started_on, ended_on::text AS ended_on, visual_svg, is_featured, " +
  'is_published, sort_order';

interface ProjectSkillUsageRow {
  readonly name: string;
  readonly usage_note: unknown | null;
}

/**
 * `ProjectRepository` over PostgreSQL (FR-05).
 *
 * `listFeatured` filters `is_published` and `is_featured` in SQL — the same
 * shape as `PostgresSocialLinkRepository.listPublished` — and orders in SQL
 * too, even though `ListFeaturedProjects` re-sorts: the index on
 * `(is_published, is_featured, sort_order)` makes the `ORDER BY` free here,
 * while the use case's own sort is what makes the contract true for every
 * implementation, `FakeProjectRepository` included.
 *
 * `listSkillUsage` runs one query per project rather than one join across all
 * of them. At this project's scale — a handful of featured projects — the
 * extra round trips cost nothing worth avoiding, and keeping the query a
 * single, obvious `WHERE project_id = $1` is worth more than folding it into
 * `listFeatured`'s own query.
 */
export class PostgresProjectRepository extends BaseRepository implements ProjectRepository {
  constructor(db: Queryable) {
    super(db);
  }

  async listFeatured(): Promise<Project[]> {
    const rows = await this.rows<ProjectRow>(
      `SELECT ${PROJECT_COLUMNS}
         FROM projects
        WHERE is_published = true AND is_featured = true
        ORDER BY sort_order ASC, started_on DESC NULLS LAST`,
    );

    return rows.map((row) => projectMapper.toDomain(row));
  }

  async listSkillUsage(projectId: string): Promise<ProjectSkillUsage[]> {
    const rows = await this.rows<ProjectSkillUsageRow>(
      `SELECT s.name, ps.usage_note
         FROM project_skill ps
         JOIN skills s ON s.id = ps.skill_id
        WHERE ps.project_id = $1
        ORDER BY s.sort_order ASC`,
      [projectId],
    );

    return rows.map((row) => ({
      skillName: row.name,
      usageNote: row.usage_note === null ? null : LocalizedText.create(row.usage_note, USAGE_NOTE_MAX_LENGTH),
    }));
  }
}
```

- [ ] **Step 3: Export it from the package barrel**

In `packages/db/src/index.ts`, add after `PostgresSocialLinkRepository`:

```typescript
export { PostgresProjectRepository } from './repositories/postgres-project.repository.ts';
```

- [ ] **Step 4: Write the failing integration test**

```typescript
// packages/db/tests/integration/repositories/project.repository.test.ts
import { IconSvg, Project, type ProjectProperties } from '@portfolio/core';
import { DateRange, LocalizedTagList, LocalizedText, ProgressPercent, Slug, Url } from '@portfolio/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { PostgresProjectRepository } from '../../../src/repositories/postgres-project.repository.ts';
import { withScratchDatabase } from '../../helpers/scratch-database.ts';

const { pool } = withScratchDatabase();

function project(overrides: Partial<ProjectProperties> = {}): Project {
  return Project.create({
    id: '00000000-0000-4000-8000-000000000001',
    slug: Slug.create('orbit-portfolio'),
    title: LocalizedText.create({ 'en-US': 'Orbit Portfolio' }, 160),
    category: LocalizedText.create({ 'en-US': 'Personal portfolio' }, 40),
    description: null,
    tags: LocalizedTagList.create({ 'en-US': ['Next.js'] }, 60, 8),
    repoUrl: Url.create('https://github.com/NavesDev/orbit-portfolio'),
    liveUrl: null,
    progress: ProgressPercent.create(100),
    period: DateRange.create({ startedOn: '2026-08-08', endedOn: null }),
    visualSvg: null,
    isFeatured: true,
    isPublished: true,
    sortOrder: 0,
    ...overrides,
  });
}

async function insertProject(client: ReturnType<typeof pool>, values: Project): Promise<void> {
  await client.query(
    `INSERT INTO projects (id, slug, title, category, description, tags, repo_url, live_url,
                           progress_percent, started_on, ended_on, visual_svg,
                           is_featured, is_published, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      values.id,
      values.slug.toString(),
      JSON.stringify(values.title.toJSON()),
      values.category === null ? null : JSON.stringify(values.category.toJSON()),
      values.description === null ? null : JSON.stringify(values.description.toJSON()),
      values.tags === null ? null : JSON.stringify(values.tags.toJSON()),
      values.repoUrl?.toString() ?? null,
      values.liveUrl?.toString() ?? null,
      values.progress.value,
      values.period.startedOn,
      values.period.endedOn,
      values.visualSvg?.toString() ?? null,
      values.isFeatured,
      values.isPublished,
      values.sortOrder,
    ],
  );
}

function repository(): PostgresProjectRepository {
  return new PostgresProjectRepository(pool());
}

beforeEach(async () => {
  await pool().query('DELETE FROM projects');
});

describe('PostgresProjectRepository', () => {
  it('returns featured, published projects in sort_order', async () => {
    await insertProject(pool(), project({ id: '00000000-0000-4000-8000-000000000002', slug: Slug.create('second'), sortOrder: 1 }));
    await insertProject(pool(), project({ id: '00000000-0000-4000-8000-000000000001', slug: Slug.create('first'), sortOrder: 0 }));

    const found = await repository().listFeatured();

    expect(found.map((row) => row.slug.toString())).toEqual(['first', 'second']);
  });

  it('excludes an unpublished project', async () => {
    await insertProject(pool(), project({ isPublished: false }));

    expect(await repository().listFeatured()).toEqual([]);
  });

  it('excludes an unfeatured project', async () => {
    await insertProject(pool(), project({ isFeatured: false }));

    expect(await repository().listFeatured()).toEqual([]);
  });

  it('reads a stored visual_svg back through IconSvg', async () => {
    const icon = IconSvg.create('<svg viewBox="0 0 24 24"><path class="orbit-pulse" d="M0 0"/></svg>');
    await insertProject(pool(), project({ visualSvg: icon }));

    const [found] = await repository().listFeatured();

    expect(found?.visualSvg?.toString()).toBe(icon.toString());
  });

  it('reads started_on and ended_on as plain ISO dates, not shifted by timezone', async () => {
    await insertProject(
      pool(),
      project({ period: DateRange.create({ startedOn: '2026-01-01', endedOn: '2026-01-02' }) }),
    );

    const [found] = await repository().listFeatured();

    expect(found?.period.startedOn).toBe('2026-01-01');
    expect(found?.period.endedOn).toBe('2026-01-02');
  });

  it('lists a project’s applied skills with their usage note, resolved to LocalizedText', async () => {
    await insertProject(pool(), project());
    const [skill] = (
      await pool().query<{ id: string }>(
        `INSERT INTO skills (name, category, sort_order) VALUES ($1, 'frontend', 0) RETURNING id`,
        ['Next.js'],
      )
    ).rows;
    await pool().query(
      `INSERT INTO project_skill (project_id, skill_id, usage_note) VALUES ($1, $2, $3)`,
      ['00000000-0000-4000-8000-000000000001', skill?.id, JSON.stringify({ 'en-US': 'App Router.' })],
    );

    const usages = await repository().listSkillUsage('00000000-0000-4000-8000-000000000001');

    expect(usages).toHaveLength(1);
    expect(usages[0]?.skillName).toBe('Next.js');
    expect(usages[0]?.usageNote?.resolve('en-US')).toBe('App Router.');
  });

  it('returns no skill usage for a project with none', async () => {
    await insertProject(pool(), project());

    expect(await repository().listSkillUsage('00000000-0000-4000-8000-000000000001')).toEqual([]);
  });

  /* NFR-07, same boundary as social_links: a row is reachable by hand. */
  it('refuses to load a project whose visual_svg carries an event handler', async () => {
    await pool().query(
      `INSERT INTO projects (id, slug, title, visual_svg, is_featured, is_published, sort_order)
            VALUES ($1, $2, $3, $4, true, true, 0)`,
      [
        '00000000-0000-4000-8000-000000000099',
        'unsafe',
        JSON.stringify({ 'en-US': 'Unsafe' }),
        '<svg onload="alert(1)"><path d="M0 0"/></svg>',
      ],
    );

    await expect(repository().listFeatured()).rejects.toThrow(/event handler/i);
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Requires `TEST_DATABASE_URL` and Docker's `postgres` service up
(`docker compose up -d postgres`).

Run: `pnpm vitest run --project db tests/integration/repositories/project.repository.test.ts`
Expected: FAIL — `../../../src/repositories/postgres-project.repository.ts` not
found (before Step 2) or, if run after Step 2/3, FAIL because migration `010`
has not been applied to the scratch database yet — check
`packages/db/tests/helpers/scratch-database.ts` to confirm it runs every
migration in `src/migrations/` before each test file; if it does, the column
exists automatically once Task 13 is committed and this step should already be
close to passing once Steps 2–3 are done, failing only on any typo.

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm vitest run --project db tests/integration/repositories/project.repository.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 7: Run the full integration suite and typecheck**

Run: `pnpm test:integration`
Run: `pnpm --filter @portfolio/db typecheck`
Expected: both pass, no regressions in `social-link.repository.test.ts`,
`constraints.test.ts`, `migrate.test.ts`, `seed/run.test.ts`.

- [ ] **Step 8: Commit**

```bash
git add packages/db/src/mappers/project.mapper.ts packages/db/src/repositories/postgres-project.repository.ts packages/db/src/index.ts packages/db/tests/integration/repositories/project.repository.test.ts
git commit -m "feat(db): add PostgresProjectRepository

Refs #6"
```

---

## Task 16: Web content — `SiteContent.projects`

**Files:**
- Modify: `apps/web/src/content/types.ts`
- Modify: `apps/web/src/content/en-US/index.ts`
- Modify: `apps/web/src/content/pt-BR/index.ts`
- Modify: `apps/web/src/content/index.test.ts`

**Interfaces:**
- Produces: `interface ProjectsContent` and `SiteContent.projects: ProjectsContent`. Consumed by Tasks 18–20.

- [ ] **Step 1: Write the failing test**

Add to `apps/web/src/content/index.test.ts`, inside the `describe('getContent', ...)` block:

```typescript
  it('carries a heading for the projects section in both locales', () => {
    for (const locale of LOCALES) {
      expect(getContent(locale).projects.heading.length).toBeGreaterThan(0);
    }
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @portfolio/web test src/content/index.test.ts`
Expected: FAIL — `getContent(locale).projects` is `undefined`.

- [ ] **Step 3: Add the type**

In `apps/web/src/content/types.ts`, add before the closing `}` of
`SiteContent` (after `closing`):

```typescript
  /**
   * The featured-projects section (FR-05–FR-10).
   *
   * `detailsCta` and `repoCta` are the card's two buttons; `modalTagsHeading`
   * and `modalSkillsHeading` label the two lists inside the detail modal. The
   * eyebrow's ordinal (`01 —`) is not copy — it is computed from list
   * position (U-6) — so nothing here represents it.
   */
  readonly projects: {
    readonly kicker: string;
    readonly heading: string;
    readonly viewAll: string;
    readonly detailsCta: string;
    readonly repoCta: string;
    readonly modalTagsHeading: string;
    readonly modalSkillsHeading: string;
    readonly closeModal: string;
  };
```

- [ ] **Step 4: Add the copy to both locales**

In `apps/web/src/content/en-US/index.ts`, add before the closing `};`:

```typescript
  projects: {
    kicker: 'Selected work',
    heading: "Each card below is a real problem solved start to finish.",
    viewAll: 'See all projects',
    detailsCta: 'View details',
    repoCta: 'Repository',
    modalTagsHeading: 'Tags',
    modalSkillsHeading: 'Applied skills',
    closeModal: 'Close',
  },
```

In `apps/web/src/content/pt-BR/index.ts`, add before the closing `};`:

```typescript
  projects: {
    kicker: 'Projetos selecionados',
    heading: 'Cada card abaixo representa um problema real resolvido do início ao fim.',
    viewAll: 'Ver todos os projetos',
    detailsCta: 'Ver detalhes',
    repoCta: 'Repositório',
    modalTagsHeading: 'Tags',
    modalSkillsHeading: 'Habilidades aplicadas',
    closeModal: 'Fechar',
  },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @portfolio/web test src/content/index.test.ts`
Expected: PASS.

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter @portfolio/web typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/content/types.ts apps/web/src/content/en-US/index.ts apps/web/src/content/pt-BR/index.ts apps/web/src/content/index.test.ts
git commit -m "feat(web): add projects section copy

Refs #6"
```

---

## Task 17: `section-registry.ts` — `PROJECTS_SECTION_ID`

**Files:**
- Modify: `apps/web/src/components/ui/section-registry.ts`

**Interfaces:**
- Produces: `PROJECTS_SECTION_ID = 'projects'`, appended into `SECTION_IDS`. Consumed by Task 19 (`ProjectsSection`).

- [ ] **Step 1: Add the constant and slot it into the page order**

```typescript
export const HERO_SECTION_ID = 'hero';
export const PROJECTS_SECTION_ID = 'projects';
export const BAND_SECTION_ID = 'band';
export const CLOSING_SECTION_ID = 'closing';

export const SECTION_IDS: readonly string[] = [
  HERO_SECTION_ID,
  PROJECTS_SECTION_ID,
  BAND_SECTION_ID,
  CLOSING_SECTION_ID,
];
```

This places the projects section between the hero and the band, matching
`roadmap.md`'s page order (hero → projects → timeline → skills → band →
closing) — timeline and skills are still to come in later sprint-1 tasks.

- [ ] **Step 2: Run the existing section-index tests**

Run: `pnpm --filter @portfolio/web test src/components/ui/section-index`
Expected: PASS — `section-index.counting.test.ts` and `section-index.test.ts`
read `SECTION_IDS.length`/order generically; confirm this by reading them
first if either hardcodes the prior 3-section total.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/section-registry.ts
git commit -m "feat(web): register the projects section in the nav index

Refs #6"
```

---

## Task 18: `useHasBeenInView`-driven `ProgressBar`

**Files:**
- Create: `apps/web/src/components/projects/progress-bar.tsx`
- Test: `apps/web/src/components/projects/progress-bar.test.tsx`

**Interfaces:**
- Consumes: `useHasBeenInView` from `../../hooks/use-in-view.ts`; `REDUCED_MOTION_QUERY` from `../../constants/media-queries.ts`.
- Produces: `function ProgressBar({ percent, label }: { percent: number; label: string })`. Consumed by Task 20 (`ProjectCard`).

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/src/components/projects/progress-bar.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProgressBar } from './progress-bar';

/**
 * `IntersectionObserver` does not exist in jsdom. `useHasBeenInView` (already
 * exercised by `stat-figure.test.tsx`) treats that as "always in view", which
 * is what this test relies on to assert the filled state without simulating a
 * real observer callback.
 */
describe('ProgressBar', () => {
  it('renders a progressbar with the given value and label', () => {
    render(<ProgressBar percent={82} label="Progress: 82%" />);

    const bar = screen.getByRole('progressbar', { name: 'Progress: 82%' });
    expect(bar).toHaveAttribute('aria-valuenow', '82');
  });

  it('reaches its full width once in view', () => {
    render(<ProgressBar percent={82} label="Progress: 82%" />);

    const fill = screen.getByTestId('progress-bar-fill');
    expect(fill).toHaveStyle({ width: '82%' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @portfolio/web test src/components/projects/progress-bar.test.tsx`
Expected: FAIL — `./progress-bar` not found.

- [ ] **Step 3: Write the component**

```typescript
// apps/web/src/components/projects/progress-bar.tsx
'use client';

import { useHasBeenInView } from '../../hooks/use-in-view';
import styles from './progress-bar.module.css';

/**
 * A project card's progress bar (FR-07).
 *
 * Starts at rest — `width: 0` — and animates to `percent` only once, the first
 * time it scrolls into view, the same "enhancement over an already-correct
 * page" shape `StatFigure` uses. A visitor without JavaScript, or one who
 * never scrolls the card into view, still gets a bar; it simply never fills,
 * which is a strictly worse but never broken result.
 */
export function ProgressBar({ percent, label }: { readonly percent: number; readonly label: string }) {
  const [ref, hasBeenInView] = useHasBeenInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={styles.track}
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={styles.fill}
        data-testid="progress-bar-fill"
        style={{ width: hasBeenInView ? `${percent}%` : '0%' }}
      />
    </div>
  );
}
```

```css
/* apps/web/src/components/projects/progress-bar.module.css */
.track {
  height: 2px;
  background: var(--line);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}

.fill {
  display: block;
  height: 100%;
  background: var(--blue);
  transition: width 1.4s var(--ease);
}

@media (prefers-reduced-motion: reduce) {
  .fill {
    transition: none;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @portfolio/web test src/components/projects/progress-bar.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/projects/progress-bar.tsx apps/web/src/components/projects/progress-bar.module.css apps/web/src/components/projects/progress-bar.test.tsx
git commit -m "feat(web): add the project card's progress bar

Refs #6"
```

---

## Task 19: `ProjectModal` — `Escape` closes, focus returns (NFR-05)

**Files:**
- Create: `apps/web/src/components/projects/project-modal.tsx`
- Test: `apps/web/src/components/projects/project-modal.test.tsx`

**Interfaces:**
- Consumes: `type ProjectDetailView` from `@portfolio/core`; `type SiteContent` from `../../content/types`.
- Produces: `function ProjectModal({ detail, content, onClose, returnFocusTo }: { detail: ProjectDetailView; content: SiteContent['projects']; onClose: () => void; returnFocusTo: React.RefObject<HTMLElement | null> })`. Consumed by Task 20 (`ProjectCard`).

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/src/components/projects/project-modal.test.tsx
import type { ProjectDetailView } from '@portfolio/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { getContent } from '../../content/index';
import { ProjectModal } from './project-modal';

const DETAIL: ProjectDetailView = {
  slug: 'orbit-portfolio',
  title: 'Orbit Portfolio',
  category: 'Personal portfolio',
  tags: ['Next.js', 'PostgreSQL'],
  progressPercent: 100,
  visualSvg: null,
  description: 'A bilingual portfolio built on persisted content.',
  repoUrl: 'https://github.com/NavesDev/orbit-portfolio',
  liveUrl: null,
  skills: [{ name: 'Next.js', usageNote: 'App Router throughout.' }],
};

function renderModal(onClose: () => void, returnFocusTo = createRef<HTMLButtonElement>()) {
  return render(
    <ProjectModal
      detail={DETAIL}
      content={getContent('en-US').projects}
      onClose={onClose}
      returnFocusTo={returnFocusTo}
    />,
  );
}

describe('ProjectModal', () => {
  it('renders the title, description, tags and applied skills', () => {
    renderModal(vi.fn());

    expect(screen.getByRole('heading', { name: 'Orbit Portfolio' })).toBeInTheDocument();
    expect(screen.getByText(DETAIL.description!)).toBeInTheDocument();
    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.getByText('App Router throughout.')).toBeInTheDocument();
  });

  it('links to the repository when repoUrl is present', () => {
    renderModal(vi.fn());

    expect(screen.getByRole('link', { name: getContent('en-US').projects.repoCta })).toHaveAttribute(
      'href',
      DETAIL.repoUrl,
    );
  });

  /* FR-09, the same rule ClosingSection already applies to its own action. */
  it('omits the repository control when repoUrl is absent', () => {
    render(
      <ProjectModal
        detail={{ ...DETAIL, repoUrl: null }}
        content={getContent('en-US').projects}
        onClose={vi.fn()}
        returnFocusTo={createRef<HTMLButtonElement>()}
      />,
    );

    expect(
      screen.queryByRole('link', { name: getContent('en-US').projects.repoCta }),
    ).not.toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn();
    renderModal(onClose);

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the close button is activated', async () => {
    const onClose = vi.fn();
    renderModal(onClose);

    await userEvent.click(screen.getByRole('button', { name: getContent('en-US').projects.closeModal }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  /* NFR-05 */
  it('returns focus to the trigger on unmount', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    const returnFocusTo = { current: trigger };

    const { unmount } = renderModal(vi.fn(), returnFocusTo);
    unmount();

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @portfolio/web test src/components/projects/project-modal.test.tsx`
Expected: FAIL — `./project-modal` not found.

- [ ] **Step 3: Write the component**

```typescript
// apps/web/src/components/projects/project-modal.tsx
'use client';

import type { ProjectDetailView } from '@portfolio/core';
import { useEffect, type RefObject } from 'react';

import type { SiteContent } from '../../content/types';
import styles from './project-modal.module.css';

const ESCAPE_KEY = 'Escape';

/**
 * The project detail modal (FR-06–FR-10, NFR-05).
 *
 * Closing is two things, not one: `onClose` flips the parent's `open` state so
 * this component unmounts, and the unmount's own cleanup is what returns focus
 * to `returnFocusTo` — the button that opened it. Doing the refocus in the
 * `Escape` handler instead would miss the case where a mouse click on the
 * close button ends the same way; anchoring it to unmount makes every path
 * out of the modal return focus identically.
 *
 * `visualSvg` renders through `dangerouslySetInnerHTML`, which is safe
 * specifically because the string here has already passed `IconSvg.create` on
 * the server (`ListFeaturedProjects`) — nothing between that call and this
 * render is user input.
 */
export function ProjectModal({
  detail,
  content,
  onClose,
  returnFocusTo,
}: {
  readonly detail: ProjectDetailView;
  readonly content: SiteContent['projects'];
  readonly onClose: () => void;
  readonly returnFocusTo: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === ESCAPE_KEY) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      returnFocusTo.current?.focus();
    };
  }, [onClose, returnFocusTo]);

  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.card} role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
        <button type="button" className={styles.close} onClick={onClose}>
          {content.closeModal}
        </button>

        {detail.visualSvg === null ? null : (
          <div className={styles.visual} dangerouslySetInnerHTML={{ __html: detail.visualSvg }} />
        )}

        {detail.category === null ? null : <p className={styles.kicker}>{detail.category}</p>}
        <h3 id="project-modal-title" className={styles.title}>
          {detail.title}
        </h3>

        {detail.description === null ? null : <p className={styles.description}>{detail.description}</p>}

        <section className={styles.section}>
          <h4 className={styles.sectionHeading}>{content.modalTagsHeading}</h4>
          <div className={styles.chips}>
            {detail.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h4 className={styles.sectionHeading}>{content.modalSkillsHeading}</h4>
          <div className={styles.chips}>
            {detail.skills.map((skill) => (
              <span key={skill.name} title={skill.usageNote ?? undefined}>
                {skill.name}
              </span>
            ))}
          </div>
        </section>

        {detail.repoUrl === null ? null : (
          <a className={styles.action} href={detail.repoUrl} target="_blank" rel="noopener">
            {content.repoCta}
          </a>
        )}
      </div>
    </div>
  );
}
```

```css
/* apps/web/src/components/projects/project-modal.module.css */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(25, 25, 24, 0.5);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.card {
  background: var(--bg);
  border-radius: 16px;
  border: 0.5px solid var(--line-strong);
  max-width: 440px;
  width: 100%;
  padding: 32px;
  position: relative;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

.close {
  position: absolute;
  top: 20px;
  right: 20px;
  border-radius: 24px;
  border: 0.5px solid var(--line-strong);
  background: none;
  padding: 6px 12px;
  cursor: pointer;
  color: var(--ink-soft);
  font-family: inherit;
  font-size: 12px;
}

.close:hover,
.close:focus-visible {
  border-color: var(--blue);
  color: var(--blue);
}

.visual {
  aspect-ratio: 21 / 9;
  border-radius: 12px;
  background: var(--blue-soft, rgba(37, 106, 191, 0.1));
  border: 0.5px solid var(--line);
  margin-bottom: 22px;
  overflow: hidden;
}

.kicker {
  font-size: 11px;
  color: var(--blue);
  font-weight: 500;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.title {
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 14px;
}

.description {
  font-size: 14px;
  color: var(--ink-soft);
  line-height: 1.65;
  margin-bottom: 22px;
  white-space: pre-wrap;
}

.section {
  margin-bottom: 20px;
}

.sectionHeading {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-faint);
  font-weight: 500;
  margin-bottom: 10px;
}

.chips {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.chips span {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  border: 0.5px solid var(--line-strong);
  color: var(--ink-soft);
}

.action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 500;
  padding: 9px 16px;
  border-radius: 24px;
  text-decoration: none;
  background: var(--ink);
  color: var(--bg);
  margin-top: 6px;
}

.action:hover,
.action:focus-visible {
  background: var(--blue);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @portfolio/web test src/components/projects/project-modal.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/projects/project-modal.tsx apps/web/src/components/projects/project-modal.module.css apps/web/src/components/projects/project-modal.test.tsx
git commit -m "feat(web): add the project detail modal

Refs #6"
```

---

## Task 20: `ProjectCard` — eyebrow ordinal (U-6), tags, repo link, modal trigger

**Files:**
- Create: `apps/web/src/components/projects/project-card.tsx`
- Create: `apps/web/src/components/projects/project-visual.module.css`
- Test: `apps/web/src/components/projects/project-card.test.tsx`

**Interfaces:**
- Consumes: `type ProjectCardView`, `type ProjectDetailView` from `@portfolio/core`; `type SiteContent`; `ProgressBar` (Task 18); `ProjectModal` (Task 19).
- Produces: `function ProjectCard({ ordinal, card, detail, content }: { ordinal: number; card: ProjectCardView; detail: ProjectDetailView; content: SiteContent['projects'] })`. Consumed by Task 21 (`ProjectsSection`).

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/src/components/projects/project-card.test.tsx
import type { ProjectCardView, ProjectDetailView } from '@portfolio/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { getContent } from '../../content/index';
import { ProjectCard } from './project-card';

const CARD: ProjectCardView = {
  slug: 'orbit-portfolio',
  title: 'Orbit Portfolio',
  category: 'Personal portfolio',
  tags: ['Next.js'],
  progressPercent: 100,
  visualSvg: null,
};

const DETAIL: ProjectDetailView = {
  ...CARD,
  description: 'A bilingual portfolio.',
  repoUrl: 'https://github.com/NavesDev/orbit-portfolio',
  liveUrl: null,
  skills: [],
};

function renderCard(ordinal = 1, detail = DETAIL) {
  return render(
    <ProjectCard ordinal={ordinal} card={CARD} detail={detail} content={getContent('en-US').projects} />,
  );
}

describe('ProjectCard', () => {
  it('renders the eyebrow as a zero-padded ordinal plus the category (U-6)', () => {
    renderCard(1);

    expect(screen.getByText('01 — Personal portfolio')).toBeInTheDocument();
  });

  it('pads a two-digit ordinal without truncating it', () => {
    renderCard(12);

    expect(screen.getByText('12 — Personal portfolio')).toBeInTheDocument();
  });

  it('renders every tag', () => {
    renderCard();

    expect(screen.getByText('Next.js')).toBeInTheDocument();
  });

  it('links to the repository when repoUrl is present', () => {
    renderCard();

    expect(screen.getByRole('link', { name: getContent('en-US').projects.repoCta })).toHaveAttribute(
      'href',
      DETAIL.repoUrl,
    );
  });

  /* FR-09 */
  it('omits the repository control when repoUrl is absent', () => {
    renderCard(1, { ...DETAIL, repoUrl: null });

    expect(
      screen.queryByRole('link', { name: getContent('en-US').projects.repoCta }),
    ).not.toBeInTheDocument();
  });

  it('opens the detail modal on click and closes it on Escape', async () => {
    renderCard();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: getContent('en-US').projects.detailsCta }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('returns focus to the details button after the modal closes (NFR-05)', async () => {
    renderCard();
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: getContent('en-US').projects.detailsCta });

    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(trigger).toHaveFocus();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @portfolio/web test src/components/projects/project-card.test.tsx`
Expected: FAIL — `./project-card` not found.

- [ ] **Step 3: Write the constants and the component**

```typescript
// apps/web/src/components/projects/constants/project-visual.ts
/** How wide the eyebrow's ordinal is padded to (U-6): "1" renders as "01". */
export const ORDINAL_PAD_LENGTH = 2;
export const ORDINAL_PAD_CHARACTER = '0';
```

```css
/* apps/web/src/components/projects/project-visual.module.css */
/**
 * The four animation names IconSvg's whitelist allows a stored SVG's elements
 * to name (U-5). `:global` is required: a class set inside
 * `dangerouslySetInnerHTML`'d markup is never run through this module's own
 * hashing, so an unwrapped `.orbitPulse` selector would never match it.
 */
@keyframes orbit-pulse {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.3);
  }
}

@keyframes orbit-draw {
  from {
    stroke-dashoffset: 240;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes orbit-drift {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes orbit-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

:global(.orbit-pulse) {
  animation: orbit-pulse 2.4s ease-in-out infinite;
  transform-origin: center;
}

:global(.orbit-draw) {
  stroke-dasharray: 240;
  animation: orbit-draw 1.8s ease-out forwards;
}

:global(.orbit-drift) {
  animation: orbit-drift 3.2s ease-in-out infinite;
}

:global(.orbit-spin) {
  animation: orbit-spin 12s linear infinite;
  transform-origin: center;
}

@media (prefers-reduced-motion: reduce) {
  :global(.orbit-pulse),
  :global(.orbit-draw),
  :global(.orbit-drift),
  :global(.orbit-spin) {
    animation: none;
  }
}
```

```typescript
// apps/web/src/components/projects/project-card.tsx
'use client';

import type { ProjectCardView, ProjectDetailView } from '@portfolio/core';
import { useRef, useState } from 'react';

import type { SiteContent } from '../../content/types';
import * as PROJECT_VISUAL_CONSTANTS from './constants/project-visual';
import { ProgressBar } from './progress-bar';
import { ProjectModal } from './project-modal';
import styles from './project-card.module.css';
import './project-visual.module.css';

/**
 * One project card (FR-05–FR-09).
 *
 * A Client Component, not split further, because its two interactive pieces —
 * the progress bar's once-only animation and the detail modal's open/close and
 * focus-return state — are both listed as Client Component categories
 * (`monorepo.md`: "hero canvas, skills orbit, modals") and share this card as
 * their one caller.
 *
 * The eyebrow's ordinal is `ordinal`, a prop, not a field on `card` (U-6): it
 * is the project's position among the others on this render, computed by
 * `ProjectsSection` from array index, so reordering `sort_order` changes it
 * for free.
 */
export function ProjectCard({
  ordinal,
  card,
  detail,
  content,
}: {
  readonly ordinal: number;
  readonly card: ProjectCardView;
  readonly detail: ProjectDetailView;
  readonly content: SiteContent['projects'];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const eyebrow = `${ordinal
    .toString()
    .padStart(
      PROJECT_VISUAL_CONSTANTS.ORDINAL_PAD_LENGTH,
      PROJECT_VISUAL_CONSTANTS.ORDINAL_PAD_CHARACTER,
    )} — ${card.category ?? ''}`;

  return (
    <article className={styles.card}>
      {card.visualSvg === null ? null : (
        <div className={styles.visual} dangerouslySetInnerHTML={{ __html: card.visualSvg }} />
      )}

      <div className={styles.meta}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h3 className={styles.title}>{card.title}</h3>

        <div className={styles.tags}>
          {card.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        {card.progressPercent === null ? null : (
          <ProgressBar percent={card.progressPercent} label={`${card.title}: ${card.progressPercent}%`} />
        )}

        <div className={styles.actions}>
          <button
            type="button"
            ref={triggerRef}
            className={styles.detailsButton}
            onClick={() => setIsOpen(true)}
          >
            {content.detailsCta}
          </button>

          {detail.repoUrl === null ? null : (
            <a className={styles.repoLink} href={detail.repoUrl} target="_blank" rel="noopener">
              {content.repoCta}
            </a>
          )}
        </div>
      </div>

      {isOpen ? (
        <ProjectModal
          detail={detail}
          content={content}
          onClose={() => setIsOpen(false)}
          returnFocusTo={triggerRef}
        />
      ) : null}
    </article>
  );
}
```

```css
/* apps/web/src/components/projects/project-card.module.css */
.card {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 64px;
  align-items: center;
  padding: 70px 0;
  border-top: 0.5px solid var(--line);
}

.visual {
  aspect-ratio: 4 / 3;
  border-radius: 14px;
  overflow: hidden;
  background: var(--blue-soft, rgba(37, 106, 191, 0.1));
  border: 0.5px solid var(--blue-line, rgba(37, 106, 191, 0.35));
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.eyebrow {
  font-size: 13px;
  color: var(--blue);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.title {
  font-size: clamp(22px, 2.4vw, 30px);
  font-weight: 500;
  letter-spacing: -0.01em;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tags span {
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 20px;
  border: 0.5px solid var(--line-strong);
  color: var(--ink-soft);
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}

.detailsButton,
.repoLink {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 500;
  padding: 9px 16px;
  border-radius: 24px;
  cursor: pointer;
  font-family: inherit;
  text-decoration: none;
  border: 0.5px solid transparent;
}

.detailsButton {
  background: var(--ink);
  color: var(--bg);
}

.detailsButton:hover,
.detailsButton:focus-visible {
  background: var(--blue);
}

.repoLink {
  background: none;
  color: var(--ink);
  border-color: var(--line-strong);
}

.repoLink:hover,
.repoLink:focus-visible {
  border-color: var(--blue-line, rgba(37, 106, 191, 0.35));
  color: var(--blue);
}

@media (max-width: 760px) {
  .card {
    grid-template-columns: 1fr;
    gap: 28px;
    padding: 48px 0;
  }

  .visual {
    aspect-ratio: 16 / 11;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @portfolio/web test src/components/projects/project-card.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/projects/project-card.tsx apps/web/src/components/projects/project-card.module.css apps/web/src/components/projects/project-visual.module.css apps/web/src/components/projects/constants/project-visual.ts apps/web/src/components/projects/project-card.test.tsx
git commit -m "feat(web): add ProjectCard with the U-6 ordinal and U-5 animated visual

Refs #6"
```

---

## Task 21: `ProjectsSection`

**Files:**
- Create: `apps/web/src/components/projects/projects-section.tsx`
- Create: `apps/web/src/components/projects/projects-section.module.css`
- Test: `apps/web/src/components/projects/projects-section.test.tsx`

**Interfaces:**
- Consumes: `type ListFeaturedProjectsOutput`, `type Locale` from `@portfolio/core`; `type SiteContent`; `PROJECTS_SECTION_ID` (Task 17); `ProjectCard` (Task 20).
- Produces: `function ProjectsSection({ content, result, locale }: { content: SiteContent['projects']; result: ListFeaturedProjectsOutput; locale: Locale })`. Consumed by Task 22 (`page.tsx`).

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/src/components/projects/projects-section.test.tsx
import type { ListFeaturedProjectsOutput } from '@portfolio/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getContent } from '../../content/index';
import { ProjectsSection } from './projects-section';

const RESULT: ListFeaturedProjectsOutput = {
  projects: [
    {
      slug: 'first',
      title: 'First Project',
      category: 'Category A',
      tags: ['Next.js'],
      progressPercent: 50,
      visualSvg: null,
    },
    {
      slug: 'second',
      title: 'Second Project',
      category: 'Category B',
      tags: [],
      progressPercent: null,
      visualSvg: null,
    },
  ],
  details: {
    first: {
      slug: 'first',
      title: 'First Project',
      category: 'Category A',
      tags: ['Next.js'],
      progressPercent: 50,
      visualSvg: null,
      description: null,
      repoUrl: null,
      liveUrl: null,
      skills: [],
    },
    second: {
      slug: 'second',
      title: 'Second Project',
      category: 'Category B',
      tags: [],
      progressPercent: null,
      visualSvg: null,
      description: null,
      repoUrl: null,
      liveUrl: null,
      skills: [],
    },
  },
};

describe('ProjectsSection', () => {
  it('renders one card per featured project, numbered by position (U-6)', () => {
    render(<ProjectsSection content={getContent('en-US').projects} result={RESULT} locale="en-US" />);

    expect(screen.getByText('01 — Category A')).toBeInTheDocument();
    expect(screen.getByText('02 — Category B')).toBeInTheDocument();
  });

  it('links "see all projects" to the current locale', () => {
    render(<ProjectsSection content={getContent('pt-BR').projects} result={RESULT} locale="pt-BR" />);

    expect(screen.getByRole('link', { name: getContent('pt-BR').projects.viewAll })).toHaveAttribute(
      'href',
      '/pt-BR/projetos',
    );
  });

  it('renders nothing card-shaped when there are no featured projects', () => {
    render(
      <ProjectsSection
        content={getContent('en-US').projects}
        result={{ projects: [], details: {} }}
        locale="en-US"
      />,
    );

    expect(screen.queryAllByRole('button', { name: getContent('en-US').projects.detailsCta })).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @portfolio/web test src/components/projects/projects-section.test.tsx`
Expected: FAIL — `./projects-section` not found.

- [ ] **Step 3: Write the component**

```typescript
// apps/web/src/components/projects/projects-section.tsx
import type { ListFeaturedProjectsOutput, Locale } from '@portfolio/core';

import type { SiteContent } from '../../content/types';
import { PROJECTS_SECTION_ID } from '../ui/section-registry';
import { ProjectCard } from './project-card';
import styles from './projects-section.module.css';

/**
 * The featured-projects section (FR-05–FR-10, roadmap 3.5).
 *
 * A Server Component: `result` arrives already computed by
 * `listFeaturedProjects` in the page's composition root. The "see all
 * projects" link points at `/${locale}/projetos`, a route this sprint does not
 * build — the same relationship `ClosingSection` already has with `mailto:`, a
 * link to a destination a later task builds.
 */
export function ProjectsSection({
  content,
  result,
  locale,
}: {
  readonly content: SiteContent['projects'];
  readonly result: ListFeaturedProjectsOutput;
  readonly locale: Locale;
}) {
  return (
    <section id={PROJECTS_SECTION_ID} className={styles.section}>
      <div className={styles.head}>
        <p className={styles.kicker}>{content.kicker}</p>
        <h2 className={styles.heading}>{content.heading}</h2>
      </div>

      {result.projects.map((card, index) => (
        <ProjectCard
          key={card.slug}
          ordinal={index + 1}
          card={card}
          detail={result.details[card.slug]!}
          content={content}
        />
      ))}

      <a className={styles.viewAll} href={`/${locale}/projetos`}>
        {content.viewAll}
      </a>
    </section>
  );
}
```

```css
/* apps/web/src/components/projects/projects-section.module.css */
.section {
  padding: 160px var(--pad-x) 90px;
}

.head {
  max-width: 520px;
  margin-bottom: 90px;
}

.kicker {
  font-size: 13px;
  color: var(--blue);
  font-weight: 500;
  margin-bottom: 14px;
}

.heading {
  font-size: clamp(26px, 3.2vw, 36px);
  font-weight: 500;
  line-height: 1.2;
}

.viewAll {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
  padding: 18px 0;
  border-top: 0.5px solid var(--line);
  text-decoration: none;
  color: var(--ink);
  font-size: 14px;
  font-weight: 500;
}

.viewAll:hover,
.viewAll:focus-visible {
  color: var(--blue);
}

@media (max-width: 760px) {
  .section {
    padding: 100px var(--pad-x) 56px;
  }

  .head {
    margin-bottom: 56px;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @portfolio/web test src/components/projects/projects-section.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the whole `web` unit suite and typecheck**

Run: `pnpm --filter @portfolio/web test`
Run: `pnpm --filter @portfolio/web typecheck`
Expected: both pass, no regressions.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/projects/projects-section.tsx apps/web/src/components/projects/projects-section.module.css apps/web/src/components/projects/projects-section.test.tsx
git commit -m "feat(web): add ProjectsSection

Refs #6"
```

---

## Task 22: Composition root and page wiring

**Files:**
- Create: `apps/web/src/lib/projects/constants/projects-provider.ts`
- Create: `apps/web/src/lib/projects/projects-provider.ts`
- Modify: `apps/web/src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `ListFeaturedProjects`, `PostgresProjectRepository`, `type Locale`, `type ListFeaturedProjectsOutput` from `@portfolio/core`/`@portfolio/db`; `getPool` from `@portfolio/db`.
- Produces: `async function listFeaturedProjects(locale: Locale): Promise<ListFeaturedProjectsOutput>`. Consumed only by `page.tsx` — this is the composition root, `@portfolio/db` must never be imported anywhere else in `apps/web`.

- [ ] **Step 1: Write the constant and the provider**

```typescript
// apps/web/src/lib/projects/constants/projects-provider.ts
/** How many featured projects the home page shows (roadmap 3.5). */
export const FEATURED_PROJECTS_LIMIT = 3;
```

```typescript
// apps/web/src/lib/projects/projects-provider.ts
import { ListFeaturedProjects, type ListFeaturedProjectsOutput, type Locale } from '@portfolio/core';
import { getPool, PostgresProjectRepository } from '@portfolio/db';

import * as PROJECTS_PROVIDER_CONSTANTS from './constants/projects-provider';

/**
 * The featured-projects section's data, read from the database.
 *
 * The composition root for this slice — the only module in `apps/web` that
 * knows both that `ProjectRepository` exists and that PostgreSQL implements
 * it (NFR-02), the same role `social-links-provider.ts` plays for the footer.
 */
export async function listFeaturedProjects(locale: Locale): Promise<ListFeaturedProjectsOutput> {
  const useCase = new ListFeaturedProjects(new PostgresProjectRepository(getPool()));

  return useCase.execute(locale, PROJECTS_PROVIDER_CONSTANTS.FEATURED_PROJECTS_LIMIT);
}
```

- [ ] **Step 2: Wire it into the page**

Read the current `apps/web/src/app/[locale]/page.tsx` first (its exact content
may have shifted since this plan was written — re-check before editing). Add
the import and the fetch alongside the existing `Promise.all`, and mount
`<ProjectsSection>` between `<Hero>` and `<CloudDrift>`:

```typescript
import { isLocale } from '@portfolio/core';
import { notFound } from 'next/navigation';

import { StatBand } from '../../components/band/stat-band';
import { ClosingSection } from '../../components/footer/closing-section';
import { SocialLinks } from '../../components/footer/social-links';
import { Hero } from '../../components/hero/hero';
import { ProjectsSection } from '../../components/projects/projects-section';
import { CloudDrift } from '../../components/ui/cloud-drift';
import { getContent } from '../../content/index';
import { AVAILABLE_FOR_WORK } from '../../content/site';
import { listFeaturedProjects } from '../../lib/projects/projects-provider';
import { listSocialLinks } from '../../lib/social/social-links-provider';
import { resolveStatFigures } from '../../lib/stats/figures';
import { createDeveloperStatsProvider } from '../../lib/stats/stats-provider';

export default async function HomePage({
  params,
}: {
  readonly params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const content = getContent(locale);
  const [figures, links, projects] = await Promise.all([
    resolveStatFigures(new Date(), createDeveloperStatsProvider()),
    listSocialLinks(),
    listFeaturedProjects(locale),
  ]);

  return (
    <>
      <main id="content">
        <Hero content={content.hero} available={AVAILABLE_FOR_WORK} />
        <ProjectsSection content={content.projects} result={projects} locale={locale} />
        <CloudDrift />
        <StatBand content={content.band} figures={figures} locale={locale} />
        <ClosingSection content={content.closing} links={links} />
      </main>
      <SocialLinks links={links} label={content.closing.linksLabel} />
    </>
  );
}
```

Keep every doc comment already in the file that this edit does not
contradict; only extend the ones that now describe a smaller scope than the
page actually has (e.g. "The projects... sections each arrive in their own
sprint-1 task" should be updated to say projects has landed).

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @portfolio/web typecheck`
Expected: no errors.

- [ ] **Step 4: Run the layout test, which renders the whole page tree**

Run: `pnpm --filter @portfolio/web test src/app/\[locale\]/layout.test.tsx`
Expected: PASS — if this test mocks `listSocialLinks`/`resolveStatFigures` but
not the page itself, confirm it does not also render `HomePage` (it tests the
layout, not the page, per its filename); if it does render the page, add a
mock for `listFeaturedProjects` matching how it already mocks the others.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/projects/constants/projects-provider.ts apps/web/src/lib/projects/projects-provider.ts apps/web/src/app/\[locale\]/page.tsx
git commit -m "feat(web): mount the featured projects section on the home page

Refs #6"
```

---

## Task 23: Record U-5 and U-6 as resolved in `sprint-01.md`

**Files:**
- Modify: `docs/sprints/sprint-01.md`

**Interfaces:** none — documentation only.

- [ ] **Step 1: Append resolution notes, matching U-2/U-3/U-4's existing style**

In the `U-5` row's "Why it is not resolvable yet" cell, append a new sentence
after the existing text (matching the **Resolved in #N:** convention already
used by U-2/U-3/U-4 elsewhere in the same table):

```markdown
**Resolved in #6:** stored on the aggregate, `projects.visual_svg`, sanitized by
the same `IconSvg` value object `social_links.icon_svg` uses. Its whitelist now
also accepts a `class` attribute naming one of four predefined animations
(`orbit-pulse`, `orbit-draw`, `orbit-drift`, `orbit-spin`), whose `@keyframes`
are authored once in `apps/web` — a stored SVG names an animation, it never
carries one.
```

In the `U-6` row, append:

```markdown
**Resolved in #6:** derived at render time from position in the already-sorted
list. `category` holds only the category text, in both locales, with no
leading number.
```

- [ ] **Step 2: Commit**

```bash
git add docs/sprints/sprint-01.md
git commit -m "docs: record U-5 and U-6 as resolved

Refs #6"
```

---

## Task 24: Full verification pass

**Files:** none — this task runs the project's own gates end to end, the way
`ci.yml` would.

- [ ] **Step 1: Typecheck every package**

Run: `pnpm typecheck`
Expected: no errors, across `core`, `db`, `infra`, `web`.

- [ ] **Step 2: Run the fast suite**

Run: `pnpm test`
Expected: PASS — `core`, `infra`, `web`, `db-unit` projects, no regressions
anywhere outside this feature's own new files.

- [ ] **Step 3: Run the integration suite**

Requires `docker compose up -d postgres` and `TEST_DATABASE_URL` set.

Run: `pnpm test:integration`
Expected: PASS — `db` project, including migration idempotency
(`migrate.test.ts`), constraints (`constraints.test.ts`), the seed
(`seed/run.test.ts`) and the new `project.repository.test.ts`.

- [ ] **Step 4: Migrate and seed a local database, then verify in the running app**

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Use the `next-dev-loop` skill against the running app to confirm, in the
browser, in both `/en-US` and `/pt-BR`:
- the featured-projects section renders real seeded projects with the
  `01 —`/`02 —`/`03 —` eyebrow ordinals and no leading number baked into any
  category text;
- at least one card's decorative visual visibly animates (the `orbit-*` class
  authored in Task 14);
- a card's progress bar starts empty and fills once scrolled into view;
- clicking "ver detalhes"/"view details" opens the modal with description,
  tags and applied skills; pressing `Escape` closes it and focus returns to
  the button that opened it;
- a project seeded with no `repoUrl` shows no repository control, in the card
  and in its modal;
- "ver todos os projetos"/"see all projects" points at
  `/pt-BR/projetos`/`/en-US/projetos` (a 404 is expected — that route is a
  later sprint task — confirm only that the `href` is correct).

- [ ] **Step 5: Run `web-design-guidelines` over the new components**

Invoke the `web-design-guidelines` skill against
`apps/web/src/components/projects/`. Read its findings; apply only what is
actually wrong (missing focus-visible states, contrast, semantics) — do not
apply a suggestion that would expand this issue's scope.

- [ ] **Step 6: Confirm nothing was left as a loose end**

Run: `git log --oneline main..feat/6-featured-projects-section`
Expected: one commit per task above, each `Refs #6`, no `TODO` in any diff
that this sprint does not explicitly own (search: `git diff main --unified=0 -- '*.ts' '*.tsx' | grep -i TODO`, expect no output).

This task produces no commit of its own — it is a gate, not a change.

---

## Self-review notes

- **Spec coverage:** every "Domain", "Application", "Persistence" and
  "Presentation" bullet in the design spec maps to a task above (Slug → Task 1,
  Url → Task 2, DateRange → Task 3, ProgressPercent → Task 4,
  LocalizedTagList → Task 5, IconSvg extension → Task 6, Project entity →
  Task 7, port/fake → Task 8, DTOs → Task 9, use case → Tasks 10–11, barrel →
  Task 12, migration/docs → Task 13, seed → Task 14, repository/mapper →
  Task 15, content → Task 16, section registry → Task 17, progress bar →
  Task 18, modal → Task 19, card → Task 20, section → Task 21, composition
  root/page → Task 22, U-5/U-6 sign-off → Task 23, verification → Task 24).
  Testing section of the spec is covered per-task rather than as a separate
  task, matching how the rest of this codebase's history reads (tests land
  with the code they test, not after it).
- **Placeholder scan:** two "read the file first, the count may have changed"
  notes appear (Task 14 Step 1, Task 22 Step 2) — these are deliberate
  hand-offs to whoever executes the task, pointing at the exact file and the
  exact thing to check, not vague TODOs; the code each step shows is complete
  for the shape described. No other `TBD`/`TODO` remains.
- **Type consistency:** `ProjectCardView`/`ProjectDetailView`/`ProjectSkillView`
  field names are identical everywhere they are used, from Task 9 (DTOs)
  through Task 11 (use-case tests), Task 15 (repository — via the entity, not
  the DTO), and Tasks 18–21 (components). `ProjectRepository.listFeatured()`
  and `.listSkillUsage(projectId)` are the same two method names and
  signatures in the port (Task 8), the fake (Task 8), and the Postgres
  implementation (Task 15). `ListFeaturedProjects.execute(locale, limit)`
  matches its call site in Task 22.

---

**Plan complete and saved to `docs/superpowers/plans/2026-08-26-featured-projects-section.md`.** Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
