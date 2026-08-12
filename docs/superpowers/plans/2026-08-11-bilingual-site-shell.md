# Bilingual Site Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/pt-BR` and `/en` render the site shell, `/` redirects to the
visitor's language, and the language switcher's choice outranks the browser on
every later visit.

**Architecture:** `packages/core` gains the `Locale` enum and the
`LocalizedText` value object — the only domain work here. Everything else is
`apps/web`: two pure modules in `src/lib/locale/` that `middleware.ts` wires
together on `/` alone, a `[locale]` route segment that owns `<html lang>`, typed
static copy in `src/content/`, and the prototype's chrome — nav, scroll progress
bar, marquee strip — driven by one scroll store instead of the prototype's
single `onScroll` function.

**Tech Stack:** TypeScript 5.6 (`strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `verbatimModuleSyntax`), Next.js 16.3 App Router,
React 19, Vitest 2.1, Testing Library, CSS Modules.

Design: [2026-08-11-bilingual-site-shell-design.md](../specs/2026-08-11-bilingual-site-shell-design.md).
Issue [#3](https://github.com/NavesDev/orbit-portfolio/issues/3). Branch
`feat/3-bilingual-site-shell`.

## Global Constraints

- **`packages/core` has no runtime dependencies** (NFR-09). Its `package.json`
  gains no `dependencies` key in this plan.
- **No magic numbers, no magic strings.** Every literal that means something
  gets a named constant, following `packages/db/src/constants/env-keys.ts`.
- **Tests are colocated** beside the code in `apps/web` (`foo.test.ts` next to
  `foo.ts`) and in `packages/core`.
- **Component queries go through role and accessible name**, never CSS class
  (`docs/testing.md`).
- **Locales are exactly `pt-BR` and `en`**; `pt-BR` is the fallback for an
  untranslated field, never the default UI language.
- **Every commit passes `pnpm typecheck`.** Conventional Commits, scoped
  (`feat(core):`, `feat(web):`), `Refs #3` in the footer.
- **The `/` redirect carries `Cache-Control: no-store`** (NFR-12) and
  `Accept-Language` is never written anywhere (NFR-14).
- Proper nouns are not translated (FR-35): `Next.js`, `React`, `Node`, `UNIP`,
  `ADS`, `Brasília`, `Claude Code`, `PostgreSQL` are identical in both locales.
- Prototype colour and easing tokens are ported **verbatim**; the only added
  tokens are the page padding.

---

## File Structure

**`packages/core/src/`**

| File | Responsibility |
| --- | --- |
| `domain/enums/locale.ts` | `LOCALES`, `Locale`, `DEFAULT_LOCALE`, `isLocale` |
| `domain/constants/text-budgets.ts` | The `data-model.md` length budgets as constants |
| `domain/errors/domain-error.ts` | `DomainError` base class |
| `domain/errors/invalid-localized-text-error.ts` | Violation codes + error |
| `domain/value-objects/localized-text.ts` | `LocalizedText` |
| `index.ts` | Barrel — re-exports all of the above |

**`apps/web/src/`**

| File | Responsibility |
| --- | --- |
| `lib/http/headers.ts` | Header names and the redirect status |
| `lib/locale/negotiate-locale.ts` | `Accept-Language` → `Locale` |
| `lib/locale/locale-cookie.ts` | Cookie name, attributes, read and serialize |
| `lib/locale/swap-locale.ts` | Replace the locale segment of a pathname |
| `middleware.ts` | Wires the three on `/` alone |
| `app/layout.tsx` | Pass-through root |
| `app/[locale]/layout.tsx` | `<html lang>`, chrome, `generateStaticParams` |
| `app/[locale]/page.tsx` | Home page, empty of sections until task 3 of the sprint |
| `app/fonts.ts` | `next/font/google` faces as CSS variables |
| `content/types.ts` | `SiteContent` — the shape both locales satisfy |
| `content/pt-BR/index.ts`, `content/en/index.ts` | The copy |
| `content/index.ts` | `getContent(locale)` |
| `lib/scroll/scroll-store.ts` | One `scroll` listener, many subscribers |
| `hooks/use-scroll.ts` | `useScrollProgress`, `useScrollOffset` |
| `components/ui/site-nav.tsx` | Mark + switcher + index |
| `components/ui/language-switcher.tsx` | One link per locale |
| `components/ui/scroll-progress.tsx` | The 2 px bar |
| `components/ui/marquee-strip.tsx` | Scroll-translated phrases |
| `components/ui/section-registry.ts` | `SECTION_IDS`, empty here |
| `components/ui/section-index.tsx` | `01 / 06`, hidden while empty |
| `styles/tokens.css`, `styles/globals.css` | Ported `:root`, reset, focus ring |

---

## Task 1: `Locale` enum

**Files:**
- Create: `packages/core/src/domain/enums/locale.ts`
- Test: `packages/core/src/domain/enums/locale.test.ts`
- Modify: `packages/core/src/index.ts`
- Delete: `packages/core/src/domain/enums/.gitkeep`

**Interfaces:**
- Consumes: nothing.
- Produces: `LOCALES: readonly ['pt-BR', 'en']`, `type Locale = 'pt-BR' | 'en'`,
  `DEFAULT_LOCALE: Locale`, `isLocale(value: string): value is Locale`.

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/domain/enums/locale.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, isLocale, LOCALES } from './locale.js';

describe('LOCALES', () => {
  it('lists exactly the two supported locales', () => {
    expect(LOCALES).toEqual(['pt-BR', 'en']);
  });

  it('makes pt-BR the fallback', () => {
    expect(DEFAULT_LOCALE).toBe('pt-BR');
  });
});

describe('isLocale', () => {
  it.each(LOCALES)('accepts %s', (locale) => {
    expect(isLocale(locale)).toBe(true);
  });

  it.each(['en-US', 'pt', 'fr', '', 'PT-BR'])('rejects %s', (value) => {
    expect(isLocale(value)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project core src/domain/enums/locale.test.ts`
Expected: FAIL — "Failed to resolve import './locale.js'".

- [ ] **Step 3: Write minimal implementation**

Create `packages/core/src/domain/enums/locale.ts`:

```ts
/**
 * The two locales the site is published in.
 *
 * This array is the single list. `generateStaticParams`, the negotiator, the
 * switcher and the static content record all derive from it, so adding a third
 * locale is one edit here plus one migration to `is_localized` — never a hunt
 * for hardcoded pairs. `WN-06` keeps a third out of v1.
 */
export const LOCALES = ['pt-BR', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * The **fallback**, not the default UI language.
 *
 * What renders when a field has no translation in the requested locale
 * (FR-34). The language a visitor actually gets is their browser's, negotiated
 * per request — see `stack.md` § "Two different meanings of default".
 */
export const DEFAULT_LOCALE: Locale = 'pt-BR';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project core src/domain/enums/locale.test.ts`
Expected: PASS — 9 tests.

- [ ] **Step 5: Export from the barrel**

Replace the `export {};` line in `packages/core/src/index.ts` with:

```ts
export { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from './domain/enums/locale.js';
```

- [ ] **Step 6: Typecheck and commit**

```bash
rm packages/core/src/domain/enums/.gitkeep
pnpm typecheck
git add packages/core/src/domain/enums packages/core/src/index.ts
git commit -m "$(cat <<'EOF'
feat(core): add the Locale enum and its pt-BR fallback

One list every consumer derives from, so a third locale is an edit here
rather than a search for hardcoded pairs.

Refs #3
EOF
)"
```

---

## Task 2: `LocalizedText` and its budgets

**Files:**
- Create: `packages/core/src/domain/constants/text-budgets.ts`
- Create: `packages/core/src/domain/errors/domain-error.ts`
- Create: `packages/core/src/domain/errors/invalid-localized-text-error.ts`
- Create: `packages/core/src/domain/value-objects/localized-text.ts`
- Test: `packages/core/src/domain/value-objects/localized-text.test.ts`
- Modify: `packages/core/src/index.ts`
- Delete: `packages/core/src/domain/errors/.gitkeep`, `packages/core/src/domain/value-objects/.gitkeep`

**Interfaces:**
- Consumes: `Locale`, `DEFAULT_LOCALE`, `isLocale` from Task 1.
- Produces: `LocalizedText.create(values: unknown, maxLength: number): LocalizedText`,
  `localizedText.resolve(locale: Locale): string`,
  `localizedText.toJSON(): Partial<Record<Locale, string>>`,
  `InvalidLocalizedTextError` with a `violation` property,
  `LOCALIZED_TEXT_VIOLATIONS`, and the six budget constants.

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/domain/value-objects/localized-text.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { TITLE_MAX_LENGTH } from '../constants/text-budgets.js';
import {
  InvalidLocalizedTextError,
  LOCALIZED_TEXT_VIOLATIONS,
} from '../errors/invalid-localized-text-error.js';
import { LocalizedText } from './localized-text.js';

function expectViolation(create: () => unknown, violation: string): void {
  expect(create).toThrow(InvalidLocalizedTextError);
  try {
    create();
  } catch (error) {
    expect((error as InvalidLocalizedTextError).violation).toBe(violation);
  }
}

describe('LocalizedText.create', () => {
  it('rejects a value that is not a plain object', () => {
    expectViolation(
      () => LocalizedText.create('Sistema de agendamento', TITLE_MAX_LENGTH),
      LOCALIZED_TEXT_VIOLATIONS.NOT_AN_OBJECT,
    );
  });

  it('rejects an array', () => {
    expectViolation(
      () => LocalizedText.create(['Sistema'], TITLE_MAX_LENGTH),
      LOCALIZED_TEXT_VIOLATIONS.NOT_AN_OBJECT,
    );
  });

  it('rejects a missing pt-BR entry', () => {
    expectViolation(
      () => LocalizedText.create({ en: 'Scheduling system' }, TITLE_MAX_LENGTH),
      LOCALIZED_TEXT_VIOLATIONS.MISSING_DEFAULT_LOCALE,
    );
  });

  it('rejects a blank pt-BR entry, which would render as empty space', () => {
    expectViolation(
      () => LocalizedText.create({ 'pt-BR': '   ' }, TITLE_MAX_LENGTH),
      LOCALIZED_TEXT_VIOLATIONS.EMPTY_DEFAULT_LOCALE,
    );
  });

  it('rejects an unknown locale key', () => {
    expectViolation(
      () =>
        LocalizedText.create(
          { 'pt-BR': 'Sistema', 'en-US': 'System' },
          TITLE_MAX_LENGTH,
        ),
      LOCALIZED_TEXT_VIOLATIONS.UNKNOWN_LOCALE_KEY,
    );
  });

  it('rejects a non-string value', () => {
    expectViolation(
      () => LocalizedText.create({ 'pt-BR': 42 }, TITLE_MAX_LENGTH),
      LOCALIZED_TEXT_VIOLATIONS.NOT_A_STRING,
    );
  });

  it('rejects a value over the budget it was given', () => {
    expectViolation(
      () =>
        LocalizedText.create(
          { 'pt-BR': 'a'.repeat(TITLE_MAX_LENGTH + 1) },
          TITLE_MAX_LENGTH,
        ),
      LOCALIZED_TEXT_VIOLATIONS.OVER_BUDGET,
    );
  });

  it('accepts a value exactly at the budget', () => {
    const text = LocalizedText.create(
      { 'pt-BR': 'a'.repeat(TITLE_MAX_LENGTH) },
      TITLE_MAX_LENGTH,
    );

    expect(text.resolve('pt-BR')).toHaveLength(TITLE_MAX_LENGTH);
  });
});

describe('LocalizedText.resolve', () => {
  it('returns the requested locale when it is present', () => {
    const text = LocalizedText.create(
      { 'pt-BR': 'Sistema de agendamento', en: 'Scheduling system' },
      TITLE_MAX_LENGTH,
    );

    expect(text.resolve('en')).toBe('Scheduling system');
  });

  it('falls back to pt-BR when the requested locale is absent (FR-34)', () => {
    const text = LocalizedText.create(
      { 'pt-BR': 'Sistema de agendamento' },
      TITLE_MAX_LENGTH,
    );

    expect(text.resolve('en')).toBe('Sistema de agendamento');
  });
});

describe('LocalizedText.toJSON', () => {
  it('returns a copy, so the value object cannot be mutated through it', () => {
    const text = LocalizedText.create({ 'pt-BR': 'Sistema' }, TITLE_MAX_LENGTH);
    const copy = text.toJSON();
    copy['pt-BR'] = 'mutated';

    expect(text.resolve('pt-BR')).toBe('Sistema');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project core src/domain/value-objects/localized-text.test.ts`
Expected: FAIL — unresolved imports.

- [ ] **Step 3: Write the budgets**

Create `packages/core/src/domain/constants/text-budgets.ts`:

```ts
/**
 * Length budgets for localized columns, from `data-model.md § Length budgets`.
 *
 * They live here because `LocalizedText.create` takes a budget: a call site
 * passing a bare `160` is the magic number this file removes.
 * `migrations/002_localization_functions.sql` enforces the same numbers as the
 * second line of defence (NFR-08) — one table, two expressions of it.
 */
export const TITLE_MAX_LENGTH = 160;
export const CATEGORY_MAX_LENGTH = 40;
export const TAG_MAX_LENGTH = 60;
export const TAGS_MAX_ITEMS = 8;
export const USAGE_NOTE_MAX_LENGTH = 240;
export const DESCRIPTION_MAX_LENGTH = 8000;
```

- [ ] **Step 4: Write the errors**

Create `packages/core/src/domain/errors/domain-error.ts`:

```ts
/**
 * Base for every invariant this layer enforces.
 *
 * Domain failures are thrown at construction, never returned: an invalid value
 * object must not exist to be passed around, so no code downstream has to ask
 * whether what it holds is valid.
 */
export abstract class DomainError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
```

Create `packages/core/src/domain/errors/invalid-localized-text-error.ts`:

```ts
import { DomainError } from './domain-error.js';

/**
 * Why a localized value was rejected, as a code rather than a message.
 *
 * A caller distinguishing "over budget" from "unknown locale" should not have
 * to parse prose to do it, and the messages are free to change.
 */
export const LOCALIZED_TEXT_VIOLATIONS = {
  NOT_AN_OBJECT: 'not-an-object',
  MISSING_DEFAULT_LOCALE: 'missing-default-locale',
  EMPTY_DEFAULT_LOCALE: 'empty-default-locale',
  UNKNOWN_LOCALE_KEY: 'unknown-locale-key',
  NOT_A_STRING: 'not-a-string',
  OVER_BUDGET: 'over-budget',
} as const;

export type LocalizedTextViolation =
  (typeof LOCALIZED_TEXT_VIOLATIONS)[keyof typeof LOCALIZED_TEXT_VIOLATIONS];

export class InvalidLocalizedTextError extends DomainError {
  readonly violation: LocalizedTextViolation;

  constructor(violation: LocalizedTextViolation, message: string) {
    super(message);
    this.violation = violation;
  }
}
```

- [ ] **Step 5: Write `LocalizedText`**

Create `packages/core/src/domain/value-objects/localized-text.ts`:

```ts
import { DEFAULT_LOCALE, isLocale, type Locale } from '../enums/locale.js';
import {
  InvalidLocalizedTextError,
  LOCALIZED_TEXT_VIOLATIONS,
} from '../errors/invalid-localized-text-error.js';

type LocalizedValues = Partial<Record<Locale, string>>;

/**
 * A text field carrying one string per locale (NFR-10, NFR-11, FR-34).
 *
 * The budget is a constructor argument rather than a subclass per column: one
 * value object serves every localized column, and a new column is a new
 * constant in `text-budgets.ts`, not new code.
 *
 * An instance never crosses into presentation — use cases resolve to `string`
 * when building output DTOs (NFR-13).
 */
export class LocalizedText {
  private constructor(
    private readonly values: Readonly<LocalizedValues>,
    private readonly fallback: string,
  ) {}

  static create(values: unknown, maxLength: number): LocalizedText {
    if (typeof values !== 'object' || values === null || Array.isArray(values)) {
      throw new InvalidLocalizedTextError(
        LOCALIZED_TEXT_VIOLATIONS.NOT_AN_OBJECT,
        'A localized value must be an object keyed by locale.',
      );
    }

    const entries = Object.entries(values as Record<string, unknown>);
    const validated: LocalizedValues = {};

    for (const [key, value] of entries) {
      if (!isLocale(key)) {
        throw new InvalidLocalizedTextError(
          LOCALIZED_TEXT_VIOLATIONS.UNKNOWN_LOCALE_KEY,
          `"${key}" is not a supported locale.`,
        );
      }

      if (typeof value !== 'string') {
        throw new InvalidLocalizedTextError(
          LOCALIZED_TEXT_VIOLATIONS.NOT_A_STRING,
          `The "${key}" entry must be a string.`,
        );
      }

      if (value.length > maxLength) {
        throw new InvalidLocalizedTextError(
          LOCALIZED_TEXT_VIOLATIONS.OVER_BUDGET,
          `The "${key}" entry exceeds its budget of ${maxLength} characters.`,
        );
      }

      validated[key] = value;
    }

    const fallback = validated[DEFAULT_LOCALE];

    if (fallback === undefined) {
      throw new InvalidLocalizedTextError(
        LOCALIZED_TEXT_VIOLATIONS.MISSING_DEFAULT_LOCALE,
        `A localized value must carry a "${DEFAULT_LOCALE}" entry.`,
      );
    }

    if (fallback.trim().length === 0) {
      throw new InvalidLocalizedTextError(
        LOCALIZED_TEXT_VIOLATIONS.EMPTY_DEFAULT_LOCALE,
        `The "${DEFAULT_LOCALE}" entry must not be blank.`,
      );
    }

    return new LocalizedText(validated, fallback);
  }

  /**
   * The requested locale, or `pt-BR` when it has no translation (FR-34).
   *
   * `create` guarantees a non-blank fallback, so this never returns an empty
   * string and no call site needs a null check.
   */
  resolve(locale: Locale): string {
    return this.values[locale] ?? this.fallback;
  }

  toJSON(): LocalizedValues {
    return { ...this.values };
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm vitest run --project core`
Expected: PASS — Task 1's 9 tests plus 11 here.

- [ ] **Step 7: Export from the barrel**

Append to `packages/core/src/index.ts`:

```ts
export {
  CATEGORY_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  TAG_MAX_LENGTH,
  TAGS_MAX_ITEMS,
  TITLE_MAX_LENGTH,
  USAGE_NOTE_MAX_LENGTH,
} from './domain/constants/text-budgets.js';
export { DomainError } from './domain/errors/domain-error.js';
export {
  InvalidLocalizedTextError,
  LOCALIZED_TEXT_VIOLATIONS,
  type LocalizedTextViolation,
} from './domain/errors/invalid-localized-text-error.js';
export { LocalizedText } from './domain/value-objects/localized-text.js';
```

- [ ] **Step 8: Typecheck and commit**

```bash
rm packages/core/src/domain/errors/.gitkeep packages/core/src/domain/value-objects/.gitkeep
pnpm typecheck && pnpm vitest run --project core
git add packages/core/src
git commit -m "$(cat <<'EOF'
feat(core): add LocalizedText with the pt-BR fallback rule

The budget is an argument, not a subclass per column, so a new localized
column is a new constant rather than new code. A blank pt-BR entry is
rejected alongside a missing one: FR-34 promises a field never renders as
empty space, and a whitespace string would keep the letter of the rule
while breaking it.

Refs #3
EOF
)"
```

---

## Task 3: `Accept-Language` negotiation

**Files:**
- Create: `apps/web/src/lib/http/headers.ts`
- Create: `apps/web/src/lib/locale/negotiate-locale.ts`
- Test: `apps/web/src/lib/locale/negotiate-locale.test.ts`
- Delete: `apps/web/src/lib/.gitkeep`

**Interfaces:**
- Consumes: `LOCALES`, `DEFAULT_LOCALE`, `Locale` from `@portfolio/core`.
- Produces: `negotiateLocale(header: string | null): Locale`,
  `ACCEPT_LANGUAGE_HEADER`, `CACHE_CONTROL_HEADER`, `CACHE_CONTROL_NO_STORE`,
  `LOCALE_REDIRECT_STATUS`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/locale/negotiate-locale.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { negotiateLocale } from './negotiate-locale';

describe('negotiateLocale', () => {
  it('picks en for an English browser (FR-30)', () => {
    expect(negotiateLocale('en-GB,en;q=0.9')).toBe('en');
  });

  it('picks pt-BR for a Portuguese browser (FR-30)', () => {
    expect(negotiateLocale('pt-BR,pt;q=0.9,en;q=0.8')).toBe('pt-BR');
  });

  it('matches a bare primary subtag to its supported locale', () => {
    expect(negotiateLocale('pt')).toBe('pt-BR');
  });

  it('falls back to pt-BR for an unsupported language (FR-31)', () => {
    expect(negotiateLocale('fr-FR,fr;q=0.9')).toBe('pt-BR');
  });

  it('falls back to pt-BR for an absent header (FR-31)', () => {
    expect(negotiateLocale(null)).toBe('pt-BR');
  });

  it('falls back to pt-BR for an empty header', () => {
    expect(negotiateLocale('')).toBe('pt-BR');
  });

  it('honours q-values rather than document order', () => {
    expect(negotiateLocale('pt-BR;q=0.3,en;q=0.9')).toBe('en');
  });

  it('ignores a language explicitly refused with q=0', () => {
    expect(negotiateLocale('en;q=0,pt-BR;q=0.5')).toBe('pt-BR');
  });

  it('is case-insensitive about tags', () => {
    expect(negotiateLocale('EN-US')).toBe('en');
  });

  it('ignores the wildcard rather than treating it as a match', () => {
    expect(negotiateLocale('*')).toBe('pt-BR');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @portfolio/web test src/lib/locale/negotiate-locale.test.ts`
Expected: FAIL — cannot resolve `./negotiate-locale`.

- [ ] **Step 3: Write the header constants**

Create `apps/web/src/lib/http/headers.ts`:

```ts
/**
 * Header names and status codes the request layer uses, kept out of the files
 * that use them — the same reason `packages/db/src/constants/env-keys.ts`
 * exists. A typo in a header name fails silently; a typo in an import does not.
 */
export const ACCEPT_LANGUAGE_HEADER = 'accept-language';
export const CACHE_CONTROL_HEADER = 'cache-control';

/** NFR-12: a cached `/` redirect would send every later visitor to the first visitor's language. */
export const CACHE_CONTROL_NO_STORE = 'no-store';

/** Temporary on purpose — the destination depends on who is asking. */
export const LOCALE_REDIRECT_STATUS = 307;
```

- [ ] **Step 4: Write the negotiator**

Create `apps/web/src/lib/locale/negotiate-locale.ts`:

```ts
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@portfolio/core';

const RANGE_SEPARATOR = ',';
const PARAMETER_SEPARATOR = ';';
const QUALITY_PREFIX = 'q=';
const SUBTAG_SEPARATOR = '-';
const DEFAULT_QUALITY = 1;
const REFUSED_QUALITY = 0;

interface LanguageRange {
  readonly tag: string;
  readonly quality: number;
}

/**
 * The visitor's language, from `Accept-Language` (FR-30, FR-31).
 *
 * Lives in `apps/web` rather than in `@portfolio/core` deliberately: this is an
 * HTTP concern, and the domain package must not know how a request reaches it.
 *
 * The header is read to pick a language and is written nowhere (NFR-14).
 */
export function negotiateLocale(header: string | null): Locale {
  if (header === null || header.trim().length === 0) {
    return DEFAULT_LOCALE;
  }

  for (const range of parseRanges(header)) {
    const match = matchSupportedLocale(range.tag);

    if (match !== null) {
      return match;
    }
  }

  return DEFAULT_LOCALE;
}

function parseRanges(header: string): LanguageRange[] {
  return header
    .split(RANGE_SEPARATOR)
    .map(parseRange)
    .filter((range) => range.quality > REFUSED_QUALITY)
    .sort((left, right) => right.quality - left.quality);
}

function parseRange(rawRange: string): LanguageRange {
  const [rawTag, ...parameters] = rawRange.trim().split(PARAMETER_SEPARATOR);
  const rawQuality = parameters
    .map((parameter) => parameter.trim())
    .find((parameter) => parameter.startsWith(QUALITY_PREFIX));

  if (rawQuality === undefined) {
    return { tag: (rawTag ?? '').trim(), quality: DEFAULT_QUALITY };
  }

  const quality = Number.parseFloat(rawQuality.slice(QUALITY_PREFIX.length));

  return {
    tag: (rawTag ?? '').trim(),
    quality: Number.isNaN(quality) ? DEFAULT_QUALITY : quality,
  };
}

/**
 * An exact tag wins; otherwise the primary subtag does, so `en-GB` reaches
 * `en` and `pt` reaches `pt-BR`. A wildcard matches nothing — it means "any",
 * and answering it with a guess is what `DEFAULT_LOCALE` is already for.
 */
function matchSupportedLocale(tag: string): Locale | null {
  const normalized = tag.toLowerCase();

  const exact = LOCALES.find((locale) => locale.toLowerCase() === normalized);

  if (exact !== undefined) {
    return exact;
  }

  const primarySubtag = normalized.split(SUBTAG_SEPARATOR)[0];

  if (primarySubtag === undefined || primarySubtag.length === 0) {
    return null;
  }

  return (
    LOCALES.find(
      (locale) =>
        locale.toLowerCase().split(SUBTAG_SEPARATOR)[0] === primarySubtag,
    ) ?? null
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @portfolio/web test src/lib/locale/negotiate-locale.test.ts`
Expected: PASS — 10 tests.

- [ ] **Step 6: Typecheck and commit**

```bash
rm apps/web/src/lib/.gitkeep
pnpm typecheck
git add apps/web/src/lib
git commit -m "$(cat <<'EOF'
feat(web): negotiate the visitor's locale from Accept-Language

Parses q-values rather than trusting document order, matches en-GB to en by
primary subtag, and treats an explicit q=0 as a refusal. Lives in apps/web
because Accept-Language is transport: core must not know how a request
arrives.

Refs #3
EOF
)"
```

---

## Task 4: The `locale` cookie

**Files:**
- Create: `apps/web/src/lib/locale/locale-cookie.ts`
- Test: `apps/web/src/lib/locale/locale-cookie.test.ts`

**Interfaces:**
- Consumes: `isLocale`, `Locale` from `@portfolio/core`.
- Produces: `LOCALE_COOKIE_NAME`, `LOCALE_COOKIE_MAX_AGE_SECONDS`,
  `readLocaleCookie(value: string | undefined): Locale | null`,
  `serializeLocaleCookie(locale: Locale): string`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/locale/locale-cookie.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
  readLocaleCookie,
  serializeLocaleCookie,
} from './locale-cookie';

const SECONDS_IN_A_YEAR = 31_536_000;

describe('readLocaleCookie', () => {
  it('returns the locale when the cookie holds a supported one', () => {
    expect(readLocaleCookie('en')).toBe('en');
  });

  it('returns null when the cookie is absent', () => {
    expect(readLocaleCookie(undefined)).toBeNull();
  });

  it('returns null for a value that is not a supported locale', () => {
    expect(readLocaleCookie('xx')).toBeNull();
  });
});

describe('serializeLocaleCookie', () => {
  it('outlasts the tab, so the choice survives closing it (FR-33)', () => {
    expect(LOCALE_COOKIE_MAX_AGE_SECONDS).toBe(SECONDS_IN_A_YEAR);
    expect(serializeLocaleCookie('en')).toContain(
      `Max-Age=${SECONDS_IN_A_YEAR}`,
    );
  });

  it('writes the chosen locale under the documented name', () => {
    expect(serializeLocaleCookie('en')).toContain(`${LOCALE_COOKIE_NAME}=en`);
  });

  it('is site-wide and Lax, so it is sent on the navigation to /', () => {
    const cookie = serializeLocaleCookie('pt-BR');

    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('is not Secure in development, where there is no HTTPS', () => {
    expect(serializeLocaleCookie('en')).not.toContain('Secure');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @portfolio/web test src/lib/locale/locale-cookie.test.ts`
Expected: FAIL — cannot resolve `./locale-cookie`.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/lib/locale/locale-cookie.ts`:

```ts
import { isLocale, type Locale } from '@portfolio/core';

/**
 * The visitor's own choice, outranking their browser's language (FR-33).
 *
 * One module holds the name and every attribute, read by `middleware.ts` and
 * written by the language switcher, so the two cannot drift apart. Sprint 1
 * task 2 records the values as U-4, which no document had fixed.
 */
export const LOCALE_COOKIE_NAME = 'locale';

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365;

/** A year: long enough that the choice outlasts the tab, and it is only a preference. */
export const LOCALE_COOKIE_MAX_AGE_SECONDS =
  SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_YEAR;

const LOCALE_COOKIE_PATH = '/';

/** Lax, not Strict: the cookie must be sent on the top-level navigation to `/`, which is the only read. */
const LOCALE_COOKIE_SAME_SITE = 'Lax';

const PRODUCTION_ENV = 'production';
const ATTRIBUTE_SEPARATOR = '; ';

export function readLocaleCookie(value: string | undefined): Locale | null {
  if (value === undefined || !isLocale(value)) {
    return null;
  }

  return value;
}

/**
 * The cookie as a `document.cookie` string.
 *
 * Not `HttpOnly`: the switcher is a Client Component and writes it, and a
 * language preference is not a secret.
 */
export function serializeLocaleCookie(locale: Locale): string {
  const attributes = [
    `${LOCALE_COOKIE_NAME}=${locale}`,
    `Max-Age=${LOCALE_COOKIE_MAX_AGE_SECONDS}`,
    `Path=${LOCALE_COOKIE_PATH}`,
    `SameSite=${LOCALE_COOKIE_SAME_SITE}`,
  ];

  if (process.env.NODE_ENV === PRODUCTION_ENV) {
    attributes.push('Secure');
  }

  return attributes.join(ATTRIBUTE_SEPARATOR);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @portfolio/web test src/lib/locale/locale-cookie.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm typecheck
git add apps/web/src/lib/locale/locale-cookie.ts apps/web/src/lib/locale/locale-cookie.test.ts
git commit -m "$(cat <<'EOF'
feat(web): fix the locale cookie's attributes in one module

Answers U-4, which sprint-01.md left open: a year, Lax, site-wide, Secure
outside development, readable by the switcher. Both the reader and the
writer import from here so the attributes cannot drift apart.

Refs #3
EOF
)"
```

---

## Task 5: `middleware.ts` — the `/` redirect

**Files:**
- Create: `apps/web/src/middleware.ts`
- Test: `apps/web/src/middleware.test.ts`
- Delete: `apps/web/src/app/page.tsx`

**Interfaces:**
- Consumes: `negotiateLocale`, `readLocaleCookie`, `LOCALE_COOKIE_NAME`, the
  header constants.
- Produces: `middleware(request: NextRequest): NextResponse`, `config.matcher`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/middleware.test.ts`. The first line is load-bearing —
`NextRequest` needs Web APIs rather than a DOM, and the `web` project defaults
to `jsdom`:

```ts
// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { middleware } from './middleware';

const HOME_URL = 'http://localhost:3000/';

function requestTo(
  headers: Record<string, string>,
  cookie?: string,
): NextRequest {
  const request = new NextRequest(HOME_URL, { headers });

  if (cookie !== undefined) {
    request.cookies.set('locale', cookie);
  }

  return request;
}

function redirectPathOf(response: Response): string {
  const location = response.headers.get('location');

  expect(location).not.toBeNull();

  return new URL(location as string).pathname;
}

describe('middleware on /', () => {
  it('sends an English browser to /en (FR-30)', () => {
    const response = middleware(
      requestTo({ 'accept-language': 'en-GB,en;q=0.9' }),
    );

    expect(redirectPathOf(response)).toBe('/en');
  });

  it('sends a Portuguese browser to /pt-BR (FR-30)', () => {
    const response = middleware(
      requestTo({ 'accept-language': 'pt-BR,pt;q=0.9' }),
    );

    expect(redirectPathOf(response)).toBe('/pt-BR');
  });

  it('sends an unsupported language to /pt-BR (FR-31)', () => {
    const response = middleware(requestTo({ 'accept-language': 'fr' }));

    expect(redirectPathOf(response)).toBe('/pt-BR');
  });

  it('sends a request with no Accept-Language to /pt-BR (FR-31)', () => {
    const response = middleware(requestTo({}));

    expect(redirectPathOf(response)).toBe('/pt-BR');
  });

  it('lets the cookie outrank the browser (FR-33)', () => {
    const response = middleware(
      requestTo({ 'accept-language': 'pt-BR,pt;q=0.9' }, 'en'),
    );

    expect(redirectPathOf(response)).toBe('/en');
  });

  it('ignores a cookie holding an unsupported locale', () => {
    const response = middleware(
      requestTo({ 'accept-language': 'en-GB,en;q=0.9' }, 'xx'),
    );

    expect(redirectPathOf(response)).toBe('/en');
  });

  it('redirects temporarily, never permanently', () => {
    expect(middleware(requestTo({})).status).toBe(307);
  });

  it('is never cached across visitors (NFR-12)', () => {
    const response = middleware(
      requestTo({ 'accept-language': 'en-GB,en;q=0.9' }),
    );

    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @portfolio/web test src/middleware.test.ts`
Expected: FAIL — cannot resolve `./middleware`.

- [ ] **Step 3: Write the middleware**

Create `apps/web/src/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';

import {
  ACCEPT_LANGUAGE_HEADER,
  CACHE_CONTROL_HEADER,
  CACHE_CONTROL_NO_STORE,
  LOCALE_REDIRECT_STATUS,
} from './lib/http/headers';
import { LOCALE_COOKIE_NAME, readLocaleCookie } from './lib/locale/locale-cookie';
import { negotiateLocale } from './lib/locale/negotiate-locale';

/**
 * Resolves the visitor's language on `/` and sends them to its prefix.
 *
 * Only `/` needs resolving — every other path already carries a locale segment
 * and goes straight to a static page. The matcher below says exactly that, so
 * `/api` and `/_next` never reach this function at all. Phase 6's CORS and
 * rate limiting widen the matcher and live in their own function.
 *
 * The response must not be cached (NFR-12): a stored `/` → `/pt-BR` would send
 * every later visitor to the first visitor's language.
 */
export function middleware(request: NextRequest): NextResponse {
  const chosen = readLocaleCookie(request.cookies.get(LOCALE_COOKIE_NAME)?.value);
  const locale =
    chosen ?? negotiateLocale(request.headers.get(ACCEPT_LANGUAGE_HEADER));

  const destination = request.nextUrl.clone();
  destination.pathname = `/${locale}`;

  const response = NextResponse.redirect(destination, LOCALE_REDIRECT_STATUS);
  response.headers.set(CACHE_CONTROL_HEADER, CACHE_CONTROL_NO_STORE);

  return response;
}

export const config = {
  matcher: ['/'],
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @portfolio/web test src/middleware.test.ts`
Expected: PASS — 8 tests.

- [ ] **Step 5: Delete the placeholder route**

`apps/web/src/app/page.tsx` exists only so the App Router had one route to
build, and its own comment says it is deleted once the redirect lands.

```bash
rm apps/web/src/app/page.tsx
```

- [ ] **Step 6: Typecheck and commit**

```bash
pnpm typecheck
git add apps/web/src/middleware.ts apps/web/src/middleware.test.ts apps/web/src/app/page.tsx
git commit -m "$(cat <<'EOF'
feat(web): redirect / to the visitor's locale, uncached

Matches / and nothing else: every other path already carries a locale
segment, so a narrower matcher beats an exclusion list that could start
matching something new when Phase 6 adds routes.

Deletes the placeholder / page, which existed only to give the App Router
one route to build.

Refs #3
EOF
)"
```

---

## Task 6: Component test harness, tokens and the `[locale]` segment

**Files:**
- Modify: `apps/web/package.json`, `apps/web/vitest.config.ts`
- Create: `apps/web/vitest.setup.ts`
- Create: `apps/web/src/styles/tokens.css`, `apps/web/src/styles/globals.css`
- Create: `apps/web/src/app/fonts.ts`
- Create: `apps/web/src/app/[locale]/layout.tsx`, `apps/web/src/app/[locale]/page.tsx`
- Test: `apps/web/src/app/[locale]/layout.test.tsx`
- Modify: `apps/web/src/app/layout.tsx`
- Delete: `apps/web/src/styles/.gitkeep`

**Interfaces:**
- Consumes: `LOCALES`, `isLocale`, `Locale` from `@portfolio/core`.
- Produces: `LocaleLayout` (default export), `generateStaticParams`,
  `revalidate`, `dynamicParams`, and the CSS custom properties every later
  component styles against.

- [ ] **Step 1: Install the test harness**

```bash
pnpm --filter @portfolio/web add -D @testing-library/react@^16.1.0 \
  @testing-library/user-event@^14.5.2 @testing-library/jest-dom@^6.6.3 \
  jsdom@^25.0.1 @vitejs/plugin-react@^4.3.4
```

- [ ] **Step 2: Wire the harness into Vitest**

Create `apps/web/vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

Replace `apps/web/vitest.config.ts` with:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'web',
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.tsx', 'src/**/*.test.ts'],
    exclude: ['e2e/**'],
  },
});
```

The `jsdom` default stays; `middleware.test.ts` opts out per file with its
`@vitest-environment node` docblock.

- [ ] **Step 3: Write the failing test**

Create `apps/web/src/app/[locale]/layout.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';

const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});

vi.mock('next/navigation', () => ({ notFound }));

import LocaleLayout, { generateStaticParams } from './layout';

describe('generateStaticParams', () => {
  it('builds one page per supported locale (NFR-01)', () => {
    expect(generateStaticParams()).toEqual([
      { locale: 'pt-BR' },
      { locale: 'en' },
    ]);
  });
});

describe('LocaleLayout', () => {
  it('declares the requested locale on the document (FR-29)', async () => {
    const tree = await LocaleLayout({
      children: <p>conteúdo</p>,
      params: Promise.resolve({ locale: 'en' }),
    });

    expect(tree.props.lang).toBe('en');
  });

  it('404s on a segment that is not a supported locale', async () => {
    await expect(
      LocaleLayout({
        children: <p>conteúdo</p>,
        params: Promise.resolve({ locale: 'fr' }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalled();
  });
});
```

The layout is asserted on as a returned element rather than rendered: it emits
`<html>`, which jsdom will not nest inside a container. The harness installed in
step 1 is exercised by the component tests in Tasks 8, 10 and 11.

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm --filter @portfolio/web test src/app/[locale]/layout.test.tsx`
Expected: FAIL — cannot resolve `./layout`.

- [ ] **Step 5: Port the prototype's tokens**

Create `apps/web/src/styles/tokens.css`. Colours and easing are the prototype's
`:root` verbatim; the padding is the one addition, because the prototype repeats
`48px` / `24px` inline across nine rules:

```css
:root {
  --bg: #FAFAF8;
  --ink: #191918;
  --ink-soft: #6B6A66;
  --ink-faint: #A6A49D;
  --line: rgba(25, 25, 24, 0.10);
  --line-strong: rgba(25, 25, 24, 0.18);
  --blue: rgb(37, 106, 191);
  --blue-soft: rgba(37, 106, 191, 0.10);
  --blue-line: rgba(37, 106, 191, 0.35);
  --ease: cubic-bezier(0.16, 1, 0.3, 1);

  /* Added here, not in the prototype, which repeats these as literals. */
  --pad-x: 48px;
}

/* The prototype's mobile breakpoint. NFR-04's 380px sits inside it. */
@media (max-width: 760px) {
  :root {
    --pad-x: 24px;
  }
}
```

Create `apps/web/src/styles/globals.css`:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-sans), -apple-system, sans-serif;
  overflow-x: hidden;
}

::selection {
  background: var(--blue);
  color: #fff;
}

/*
 * Not in the prototype, which leaves a keyboard visitor with no visible focus
 * at all. NFR-06 asks for a Lighthouse accessibility score of 95 or better and
 * NFR-05 assumes a focus path that can be followed.
 */
:focus-visible {
  outline: 2px solid var(--blue);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

- [ ] **Step 6: Self-host the fonts**

Create `apps/web/src/app/fonts.ts`:

```ts
import { Inter_Tight, Newsreader } from 'next/font/google';

/**
 * The prototype's two faces, self-hosted at build time.
 *
 * It pulls them through a Google Fonts `@import` inside its stylesheet, which
 * is render-blocking and a third-party request on every page load. Same faces,
 * same weights, exposed as CSS variables so `globals.css` names them once.
 */
export const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

export const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});
```

- [ ] **Step 7: Write the layout and page**

Create `apps/web/src/app/[locale]/layout.tsx`:

```tsx
import { isLocale, LOCALES } from '@portfolio/core';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import '../../styles/tokens.css';
import '../../styles/globals.css';
import { interTight, newsreader } from '../fonts';

const REVALIDATE_SECONDS = 3600;

/** NFR-01: both locales are built statically and revalidated on a timer. */
export const revalidate = REVALIDATE_SECONDS;

/** A segment outside `LOCALES` is a 404, not a locale to guess at. */
export const dynamicParams = false;

export function generateStaticParams(): { locale: string }[] {
  return LOCALES.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
}

/**
 * The real root of the site.
 *
 * `<html>` and `<body>` live here rather than in `app/layout.tsx` because
 * `lang` must be the resolved locale, and only this layout knows it.
 */
export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <html lang={locale} className={`${interTight.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

Create `apps/web/src/app/[locale]/page.tsx`:

```tsx
/**
 * The home page.
 *
 * Empty of sections on purpose: the hero, projects, timeline, stat band and
 * footer each arrive in their own sprint-1 task. This task delivers the shell
 * around them.
 */
export default function HomePage() {
  return <main id="content" />;
}
```

- [ ] **Step 8: Make the root layout a pass-through**

Replace the contents of `apps/web/src/app/layout.tsx`:

```tsx
import type { ReactNode } from 'react';

/**
 * Pass-through root.
 *
 * The App Router requires a file at `app/layout.tsx`, but `<html>` and
 * `<body>` belong to `app/[locale]/layout.tsx`, which is the only layout that
 * knows the resolved locale and can set `lang` from it. Nothing user-facing
 * belongs at this level.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `pnpm --filter @portfolio/web test`
Expected: PASS — the negotiator, the cookie, the middleware and 3 layout tests.

- [ ] **Step 10: Verify the build produces both locales**

Run: `pnpm --filter @portfolio/web build`
Expected: the route table lists `/[locale]` as static with `/pt-BR` and `/en`
prerendered.

- [ ] **Step 11: Commit**

```bash
rm apps/web/src/styles/.gitkeep
pnpm typecheck
git add apps/web
git commit -m "$(cat <<'EOF'
feat(web): add the [locale] segment, the prototype's tokens and a test harness

Moves <html lang> into the locale layout, where the resolved locale is known,
and leaves app/layout.tsx as the pass-through the App Router requires.

Two deliberate departures from the prototype: its Google Fonts @import
becomes next/font/google, which self-hosts the same faces instead of
blocking render on a third party, and a :focus-visible ring is added, since
the prototype leaves a keyboard visitor with no visible focus at all.

Refs #3
EOF
)"
```

---

## Task 7: Static content in both locales

**Files:**
- Create: `apps/web/src/content/types.ts`
- Create: `apps/web/src/content/pt-BR/index.ts`, `apps/web/src/content/en/index.ts`
- Create: `apps/web/src/content/index.ts`
- Test: `apps/web/src/content/index.test.ts`
- Delete: `apps/web/src/content/.gitkeep`, `apps/web/src/content/pt-BR/.gitkeep`, `apps/web/src/content/en/.gitkeep`

**Interfaces:**
- Consumes: `Locale`, `LOCALES` from `@portfolio/core`.
- Produces: `SiteContent`, `StripPhrase`, `getContent(locale: Locale): SiteContent`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/content/index.test.ts`:

```ts
import { LOCALES } from '@portfolio/core';
import { describe, expect, it } from 'vitest';
import { getContent } from './index';

describe('getContent', () => {
  it.each(LOCALES)('answers for %s', (locale) => {
    expect(getContent(locale).nav.mark).not.toHaveLength(0);
  });

  it('returns the copy of the locale it was asked for', () => {
    expect(getContent('en').nav.skipToContent).not.toBe(
      getContent('pt-BR').nav.skipToContent,
    );
  });

  it('carries the same number of strip phrases in both locales', () => {
    expect(getContent('en').strip.phrases).toHaveLength(
      getContent('pt-BR').strip.phrases.length,
    );
  });

  it('leaves proper nouns untranslated (FR-35)', () => {
    const leads = (locale: 'pt-BR' | 'en') =>
      getContent(locale).strip.phrases.map((phrase) => phrase.lead);

    expect(leads('en')).toEqual(leads('pt-BR'));
  });
});
```

`testing.md` says static content itself is not tested — these assert the
*relationship* between the two modules, which is the property that breaks.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @portfolio/web test src/content/index.test.ts`
Expected: FAIL — cannot resolve `./index`.

- [ ] **Step 3: Write the shape**

Create `apps/web/src/content/types.ts`:

```ts
import type { Locale } from '@portfolio/core';

export interface StripPhrase {
  /** A proper noun, identical in both locales (FR-35). */
  readonly lead: string;
  readonly rest: string;
}

/**
 * The shape both locale modules satisfy.
 *
 * Declared as an interface rather than inferred from the `pt-BR` module so a
 * missing key in `en` is a type error rather than a blank space — the property
 * `monorepo.md` asks of this folder.
 */
export interface SiteContent {
  readonly nav: {
    readonly mark: string;
    readonly skipToContent: string;
  };
  readonly languageSwitcher: {
    /** Names the switcher's landmark for a screen reader. */
    readonly label: string;
    /** What is shown — "PT", "EN". */
    readonly localeLabels: Readonly<Record<Locale, string>>;
    /** The accessible name of each link, spelled out. */
    readonly localeNames: Readonly<Record<Locale, string>>;
  };
  readonly strip: {
    readonly phrases: readonly StripPhrase[];
  };
}
```

- [ ] **Step 4: Write both locales**

Create `apps/web/src/content/pt-BR/index.ts`:

```ts
import type { SiteContent } from '../types';

/**
 * The prototype's copy. Its strip phrases are ported verbatim.
 */
export const ptBR: SiteContent = {
  nav: {
    mark: 'DN',
    skipToContent: 'Ir para o conteúdo',
  },
  languageSwitcher: {
    label: 'Idioma',
    localeLabels: { 'pt-BR': 'PT', en: 'EN' },
    localeNames: { 'pt-BR': 'Português', en: 'Inglês' },
  },
  strip: {
    phrases: [
      { lead: 'Next.js', rest: '· React · Node' },
      { lead: 'UNIP', rest: '· ADS · Brasília' },
      { lead: 'Claude Code', rest: '· automação' },
      { lead: 'PostgreSQL', rest: '· APIs REST' },
    ],
  },
};
```

Create `apps/web/src/content/en/index.ts`:

```ts
import type { SiteContent } from '../types';

/**
 * New copy, authored here: sprint-01.md records as U-2 that the nav and the
 * strip are covered by no requirement and have never had an `en` translation.
 *
 * The strip barely changes — proper nouns are not translated (FR-35), so only
 * "automação" and the word order of "APIs REST" differ.
 */
export const en: SiteContent = {
  nav: {
    mark: 'DN',
    skipToContent: 'Skip to content',
  },
  languageSwitcher: {
    label: 'Language',
    localeLabels: { 'pt-BR': 'PT', en: 'EN' },
    localeNames: { 'pt-BR': 'Portuguese', en: 'English' },
  },
  strip: {
    phrases: [
      { lead: 'Next.js', rest: '· React · Node' },
      { lead: 'UNIP', rest: '· ADS · Brasília' },
      { lead: 'Claude Code', rest: '· automation' },
      { lead: 'PostgreSQL', rest: '· REST APIs' },
    ],
  },
};
```

Create `apps/web/src/content/index.ts`:

```ts
import type { Locale } from '@portfolio/core';

import { en } from './en/index';
import { ptBR } from './pt-BR/index';
import type { SiteContent } from './types';

const CONTENT: Readonly<Record<Locale, SiteContent>> = {
  'pt-BR': ptBR,
  en,
};

/** Exhaustive over `LOCALES` by type: a new locale without copy is a type error. */
export function getContent(locale: Locale): SiteContent {
  return CONTENT[locale];
}

export type { SiteContent, StripPhrase } from './types';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @portfolio/web test src/content/index.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 6: Commit**

```bash
rm apps/web/src/content/.gitkeep apps/web/src/content/pt-BR/.gitkeep apps/web/src/content/en/.gitkeep
pnpm typecheck
git add apps/web/src/content
git commit -m "$(cat <<'EOF'
feat(web): add the shell's static copy in both locales

SiteContent is an interface both modules satisfy rather than a type inferred
from pt-BR: a missing key in en has to be a compile error, and inference
would make it a literal-type mismatch on every string instead.

The en strip copy is new — sprint-01.md records as U-2 that nothing owns it.
Proper nouns stay put (FR-35), so only automação and APIs REST change.

Refs #3
EOF
)"
```

---

## Task 8: The language switcher

**Files:**
- Create: `apps/web/src/lib/locale/swap-locale.ts`
- Test: `apps/web/src/lib/locale/swap-locale.test.ts`
- Create: `apps/web/src/components/ui/language-switcher.tsx`, `language-switcher.module.css`
- Test: `apps/web/src/components/ui/language-switcher.test.tsx`
- Create: `apps/web/src/components/ui/site-nav.tsx`, `site-nav.module.css`
- Modify: `apps/web/src/app/[locale]/layout.tsx`
- Delete: `apps/web/src/components/ui/.gitkeep`

**Interfaces:**
- Consumes: `LOCALES`, `Locale`; `serializeLocaleCookie`; `getContent`, `SiteContent`.
- Produces: `swapLocale(pathname: string, locale: Locale): string`,
  `<LanguageSwitcher locale content />`, `<SiteNav locale />`.

- [ ] **Step 1: Write the failing test for `swapLocale`**

Create `apps/web/src/lib/locale/swap-locale.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { swapLocale } from './swap-locale';

describe('swapLocale', () => {
  it('replaces the locale segment', () => {
    expect(swapLocale('/pt-BR', 'en')).toBe('/en');
  });

  it('keeps the rest of the path, so deep links survive the switch (FR-32)', () => {
    expect(swapLocale('/pt-BR/projetos/agendamento', 'en')).toBe(
      '/en/projetos/agendamento',
    );
  });

  it('handles a path with no locale segment yet', () => {
    expect(swapLocale('/', 'en')).toBe('/en');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @portfolio/web test src/lib/locale/swap-locale.test.ts`
Expected: FAIL — cannot resolve `./swap-locale`.

- [ ] **Step 3: Write `swapLocale`**

Create `apps/web/src/lib/locale/swap-locale.ts`:

```ts
import type { Locale } from '@portfolio/core';

const SEGMENT_SEPARATOR = '/';
const LOCALE_SEGMENT_INDEX = 1;

/**
 * The same page under another locale.
 *
 * Rewrites only the first segment, so the switcher keeps working once
 * `/[locale]/projetos` exists without being edited.
 */
export function swapLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split(SEGMENT_SEPARATOR);

  if (segments.length <= LOCALE_SEGMENT_INDEX || segments[LOCALE_SEGMENT_INDEX] === '') {
    return `${SEGMENT_SEPARATOR}${locale}`;
  }

  segments[LOCALE_SEGMENT_INDEX] = locale;

  return segments.join(SEGMENT_SEPARATOR);
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm --filter @portfolio/web test src/lib/locale/swap-locale.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Write the failing component test**

Create `apps/web/src/components/ui/language-switcher.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/pt-BR/projetos',
}));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

import { getContent } from '../../content/index';
import { LanguageSwitcher } from './language-switcher';

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    document.cookie = '';
  });

  it('offers a link per locale, named in the current language', () => {
    render(<LanguageSwitcher locale="pt-BR" content={getContent('pt-BR')} />);

    expect(screen.getByRole('link', { name: 'Português' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inglês' })).toBeInTheDocument();
  });

  it('marks the current locale for assistive technology', () => {
    render(<LanguageSwitcher locale="pt-BR" content={getContent('pt-BR')} />);

    expect(screen.getByRole('link', { name: 'Português' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByRole('link', { name: 'Inglês' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('links to the same page under the other locale (FR-32)', () => {
    render(<LanguageSwitcher locale="pt-BR" content={getContent('pt-BR')} />);

    expect(screen.getByRole('link', { name: 'Inglês' })).toHaveAttribute(
      'href',
      '/en/projetos',
    );
  });

  it('writes the choice to a cookie so it outranks the browser next time (FR-33)', async () => {
    render(<LanguageSwitcher locale="pt-BR" content={getContent('pt-BR')} />);

    await userEvent.click(screen.getByRole('link', { name: 'Inglês' }));

    expect(document.cookie).toContain('locale=en');
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `pnpm --filter @portfolio/web test src/components/ui/language-switcher.test.tsx`
Expected: FAIL — cannot resolve `./language-switcher`.

- [ ] **Step 7: Write the switcher**

Create `apps/web/src/components/ui/language-switcher.module.css`:

```css
.switcher {
  display: flex;
  align-items: center;
  gap: 10px;
}

.link {
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-decoration: none;
  opacity: 0.6;
  transition: opacity 0.25s var(--ease);
}

.link:hover {
  opacity: 1;
}

.link[aria-current='true'] {
  opacity: 1;
  text-decoration: underline;
  text-underline-offset: 3px;
}
```

Create `apps/web/src/components/ui/language-switcher.tsx`:

```tsx
'use client';

import { LOCALES, type Locale } from '@portfolio/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { SiteContent } from '../../content/types';
import { serializeLocaleCookie } from '../../lib/locale/locale-cookie';
import { swapLocale } from '../../lib/locale/swap-locale';
import styles from './language-switcher.module.css';

interface LanguageSwitcherProps {
  readonly locale: Locale;
  readonly content: SiteContent;
}

/**
 * Links, not buttons (FR-33).
 *
 * A link works without JavaScript, is keyboard-operable and focusable without
 * being made so, and carries the language in a URL that can be shared. The
 * cookie is written on the way out so the choice outranks `Accept-Language` on
 * the next visit to `/`.
 */
export function LanguageSwitcher({ locale, content }: LanguageSwitcherProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={content.languageSwitcher.label} className={styles.switcher}>
      {LOCALES.map((target) => (
        <Link
          key={target}
          href={swapLocale(pathname, target)}
          hrefLang={target}
          aria-label={content.languageSwitcher.localeNames[target]}
          aria-current={target === locale ? 'true' : undefined}
          className={styles.link}
          onClick={() => {
            document.cookie = serializeLocaleCookie(target);
          }}
        >
          {content.languageSwitcher.localeLabels[target]}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `pnpm --filter @portfolio/web test src/components/ui/language-switcher.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 9: Assemble the nav and mount it**

Create `apps/web/src/components/ui/site-nav.module.css`, porting the
prototype's `nav` rules:

```css
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 90;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px var(--pad-x);
  mix-blend-mode: difference;
}

.mark {
  font-weight: 600;
  font-size: 14px;
  color: #fff;
  letter-spacing: 0.02em;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--blue);
  display: inline-block;
  margin-right: 8px;
  mix-blend-mode: normal;
  vertical-align: 1px;
}

.skipLink {
  position: absolute;
  left: -9999px;
}

.skipLink:focus-visible {
  left: var(--pad-x);
  top: 22px;
  background: var(--bg);
  color: var(--ink);
  padding: 8px 14px;
  border-radius: 20px;
  mix-blend-mode: normal;
}

@media (max-width: 760px) {
  .nav {
    padding: 18px var(--pad-x);
  }

  .mark {
    font-size: 13px;
  }
}
```

Create `apps/web/src/components/ui/site-nav.tsx`:

```tsx
import type { Locale } from '@portfolio/core';

import { getContent } from '../../content/index';
import { LanguageSwitcher } from './language-switcher';
import styles from './site-nav.module.css';

const CONTENT_ANCHOR = '#content';

/**
 * The fixed nav (U-2 — no requirement names it; the prototype does).
 *
 * A Server Component: only the switcher inside it needs the client, so only
 * the switcher declares `'use client'`.
 */
export function SiteNav({ locale }: { readonly locale: Locale }) {
  const content = getContent(locale);

  return (
    <nav className={styles.nav}>
      <a href={CONTENT_ANCHOR} className={styles.skipLink}>
        {content.nav.skipToContent}
      </a>
      <span className={styles.mark}>
        <span className={styles.dot} aria-hidden="true" />
        {content.nav.mark}
      </span>
      <LanguageSwitcher locale={locale} content={content} />
    </nav>
  );
}
```

In `apps/web/src/app/[locale]/layout.tsx`, import `SiteNav` and render it
immediately inside `<body>`, before `{children}`:

```tsx
import { SiteNav } from '../../components/ui/site-nav';
```

```tsx
      <body>
        <SiteNav locale={locale} />
        {children}
      </body>
```

- [ ] **Step 10: Typecheck, test and commit**

```bash
rm apps/web/src/components/ui/.gitkeep
pnpm typecheck && pnpm --filter @portfolio/web test
git add apps/web/src
git commit -m "$(cat <<'EOF'
feat(web): add the language switcher and the fixed nav

The switcher is links rather than buttons: it then works without
JavaScript, is keyboard-operable without being made so, and produces a
shareable URL per language. The cookie is written on the way out so the
choice outranks Accept-Language on the next visit to /.

Adds the skip link the prototype has no equivalent of, since the nav is
now the first focusable thing on every page.

Refs #3
EOF
)"
```

---

## Task 9: One scroll listener, and the progress bar

**Files:**
- Create: `apps/web/src/lib/scroll/scroll-store.ts`
- Test: `apps/web/src/lib/scroll/scroll-store.test.ts`
- Create: `apps/web/src/hooks/use-scroll.ts`
- Create: `apps/web/src/components/ui/scroll-progress.tsx`, `scroll-progress.module.css`
- Modify: `apps/web/src/app/[locale]/layout.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `subscribeToScroll(listener: () => void): () => void`,
  `getScrollMetrics(): ScrollMetrics`, `ScrollMetrics { offset: number; progress: number }`,
  `useScrollProgress(): number`, `useScrollOffset(): number`, `<ScrollProgress />`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/scroll/scroll-store.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getScrollMetrics, subscribeToScroll } from './scroll-store';

function scrollTo(offset: number, scrollHeight = 2000, innerHeight = 1000): void {
  Object.defineProperty(window, 'scrollY', { value: offset, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: innerHeight, configurable: true });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: scrollHeight,
    configurable: true,
  });
  window.dispatchEvent(new Event('scroll'));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('subscribeToScroll', () => {
  it('attaches exactly one scroll listener however many subscribers there are', () => {
    const addEventListener = vi.spyOn(window, 'addEventListener');

    const first = subscribeToScroll(() => {});
    const second = subscribeToScroll(() => {});

    const scrollListeners = addEventListener.mock.calls.filter(
      ([type]) => type === 'scroll',
    );

    expect(scrollListeners).toHaveLength(1);

    first();
    second();
  });

  it('removes the listener when the last subscriber leaves', () => {
    const removeEventListener = vi.spyOn(window, 'removeEventListener');

    const unsubscribe = subscribeToScroll(() => {});
    unsubscribe();

    expect(removeEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
    );
  });

  it('notifies subscribers when the page scrolls', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToScroll(listener);

    scrollTo(500);
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(listener).toHaveBeenCalled();

    unsubscribe();
  });
});

describe('getScrollMetrics', () => {
  it('reports progress as a fraction of the scrollable distance', async () => {
    const unsubscribe = subscribeToScroll(() => {});

    scrollTo(500);
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(getScrollMetrics().progress).toBeCloseTo(0.5);
    expect(getScrollMetrics().offset).toBe(500);

    unsubscribe();
  });

  it('reports no progress on a page shorter than the viewport', async () => {
    const unsubscribe = subscribeToScroll(() => {});

    scrollTo(0, 800, 1000);
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(getScrollMetrics().progress).toBe(0);

    unsubscribe();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @portfolio/web test src/lib/scroll/scroll-store.test.ts`
Expected: FAIL — cannot resolve `./scroll-store`.

- [ ] **Step 3: Write the store**

Create `apps/web/src/lib/scroll/scroll-store.ts`:

```ts
const SCROLL_EVENT = 'scroll';
const NO_PROGRESS = 0;
const FULL_PROGRESS = 1;

export interface ScrollMetrics {
  /** Pixels scrolled from the top — what the marquee translates by. */
  readonly offset: number;
  /** How far through the document, 0 to 1 — what the progress bar scales by. */
  readonly progress: number;
}

const INITIAL_METRICS: ScrollMetrics = { offset: NO_PROGRESS, progress: NO_PROGRESS };

/**
 * One `scroll` listener for the whole page, however many components care.
 *
 * The prototype does all of its scroll work in a single `onScroll` function,
 * which keeps it to one listener but couples every section to one file. This
 * keeps the single listener and drops the coupling: components subscribe, and
 * the listener exists only while at least one of them is mounted.
 *
 * Roadmap 3.9 asks for exactly this consolidation.
 */
let metrics: ScrollMetrics = INITIAL_METRICS;
let listeners: (() => void)[] = [];
let frame: number | null = null;

function readMetrics(): ScrollMetrics {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;

  if (scrollable <= NO_PROGRESS) {
    return { offset: window.scrollY, progress: NO_PROGRESS };
  }

  return {
    offset: window.scrollY,
    progress: Math.min(FULL_PROGRESS, window.scrollY / scrollable),
  };
}

function publish(): void {
  frame = null;
  metrics = readMetrics();

  for (const listener of listeners) {
    listener();
  }
}

/** Coalesces a burst of scroll events into one read per frame. */
function handleScroll(): void {
  if (frame !== null) {
    return;
  }

  frame = requestAnimationFrame(publish);
}

export function subscribeToScroll(listener: () => void): () => void {
  if (listeners.length === 0) {
    window.addEventListener(SCROLL_EVENT, handleScroll, { passive: true });
  }

  listeners = [...listeners, listener];

  return () => {
    listeners = listeners.filter((registered) => registered !== listener);

    if (listeners.length === 0) {
      window.removeEventListener(SCROLL_EVENT, handleScroll);

      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
    }
  };
}

export function getScrollMetrics(): ScrollMetrics {
  return metrics;
}

/** The server has no scroll position; both values start at rest. */
export function getServerScrollMetrics(): ScrollMetrics {
  return INITIAL_METRICS;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm --filter @portfolio/web test src/lib/scroll/scroll-store.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Write the hooks**

Create `apps/web/src/hooks/use-scroll.ts`:

```ts
'use client';

import { useSyncExternalStore } from 'react';

import {
  getScrollMetrics,
  getServerScrollMetrics,
  subscribeToScroll,
} from '../lib/scroll/scroll-store';

/**
 * Both hooks return a number rather than the metrics object:
 * `useSyncExternalStore` compares snapshots by identity, and a fresh object
 * every frame would re-render every subscriber on every frame.
 */
export function useScrollProgress(): number {
  return useSyncExternalStore(
    subscribeToScroll,
    () => getScrollMetrics().progress,
    () => getServerScrollMetrics().progress,
  );
}

export function useScrollOffset(): number {
  return useSyncExternalStore(
    subscribeToScroll,
    () => getScrollMetrics().offset,
    () => getServerScrollMetrics().offset,
  );
}
```

- [ ] **Step 6: Write the progress bar**

Create `apps/web/src/components/ui/scroll-progress.module.css`:

```css
.progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px;
  width: 100%;
  background: var(--blue);
  transform-origin: left center;
  z-index: 100;
}
```

Create `apps/web/src/components/ui/scroll-progress.tsx`:

```tsx
'use client';

import { useScrollProgress } from '../../hooks/use-scroll';
import styles from './scroll-progress.module.css';

/**
 * The scroll progress bar (U-2 — OQ-02 in requirements.md).
 *
 * `aria-hidden`: it restates what the scrollbar already conveys, so announcing
 * it costs an accessibility score rather than earning one (NFR-06).
 *
 * Scaled rather than resized — the prototype animates `width`, which lays out
 * on every frame. `transform` does not.
 */
export function ScrollProgress() {
  const progress = useScrollProgress();

  return (
    <div
      className={styles.progress}
      style={{ transform: `scaleX(${progress})` }}
      aria-hidden="true"
    />
  );
}
```

- [ ] **Step 7: Mount it**

In `apps/web/src/app/[locale]/layout.tsx`, import `ScrollProgress` and render it
as the first child of `<body>`, before `<SiteNav />`.

- [ ] **Step 8: Typecheck, test and commit**

```bash
pnpm typecheck && pnpm --filter @portfolio/web test
git add apps/web/src
git commit -m "$(cat <<'EOF'
feat(web): add the scroll progress bar over a single shared listener

The prototype keeps one listener by putting every scroll behaviour in one
onScroll function, which couples each section to that file. This keeps the
one listener and drops the coupling: components subscribe, and the listener
exists only while something is mounted. Roadmap 3.9 asks for this
consolidation; doing it now is cheaper than three listeners to remove later.

The bar scales rather than resizes — animating width lays out every frame.

Refs #3
EOF
)"
```

---

## Task 10: The marquee strip

**Files:**
- Create: `apps/web/src/components/ui/marquee-strip.tsx`, `marquee-strip.module.css`
- Test: `apps/web/src/components/ui/marquee-strip.test.tsx`
- Modify: `apps/web/src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `useScrollOffset`, `StripPhrase`, `getContent`.
- Produces: `<MarqueeStrip phrases={readonly StripPhrase[]} />`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/ui/marquee-strip.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getContent } from '../../content/index';
import { MarqueeStrip } from './marquee-strip';

describe('MarqueeStrip', () => {
  it('renders every phrase of the requested locale', () => {
    render(<MarqueeStrip phrases={getContent('en').strip.phrases} />);

    expect(screen.getByText('Claude Code')).toBeInTheDocument();
    expect(screen.getByText('· automation')).toBeInTheDocument();
  });

  it('announces each phrase once, though it is rendered twice to wrap', () => {
    render(<MarqueeStrip phrases={getContent('pt-BR').strip.phrases} />);

    expect(screen.getAllByText('Claude Code')).toHaveLength(1);
  });
});
```

`getAllByText` ignores `aria-hidden` subtrees, so the duplicate set being
hidden is what makes the second assertion pass.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @portfolio/web test src/components/ui/marquee-strip.test.tsx`
Expected: FAIL — cannot resolve `./marquee-strip`.

- [ ] **Step 3: Write the strip**

Create `apps/web/src/components/ui/marquee-strip.module.css`, from the
prototype's `.strip` rules:

```css
.strip {
  padding: 26px 0;
  border-top: 0.5px solid var(--line);
  border-bottom: 0.5px solid var(--line);
  overflow: hidden;
  white-space: nowrap;
}

.track {
  display: inline-flex;
  gap: 48px;
  will-change: transform;
}

.phrase {
  font-size: 14px;
  color: var(--ink-faint);
  font-family: var(--font-serif), serif;
  font-style: italic;
}

.lead {
  color: var(--ink);
  font-style: normal;
  font-family: var(--font-sans), sans-serif;
  font-weight: 500;
}

@media (max-width: 760px) {
  .track {
    gap: 28px;
  }

  .phrase {
    font-size: 12px;
  }
}
```

Create `apps/web/src/components/ui/marquee-strip.tsx`:

```tsx
'use client';

import type { StripPhrase } from '../../content/types';
import { useScrollOffset } from '../../hooks/use-scroll';
import styles from './marquee-strip.module.css';

/** How far the track moves per pixel scrolled — the prototype's factor. */
const SCROLL_TRANSLATION_FACTOR = 0.4;

/**
 * The strip below the hero (U-2 — OQ-03 in requirements.md).
 *
 * It is translated by scroll position rather than autoplaying, which is what
 * makes it acceptable without a pause control: nothing moves unless the
 * visitor moves it.
 *
 * The phrase list is rendered twice so the track still covers the viewport
 * once it has travelled; the second copy is `aria-hidden` so a screen reader
 * hears each phrase once.
 */
export function MarqueeStrip({
  phrases,
}: {
  readonly phrases: readonly StripPhrase[];
}) {
  const offset = useScrollOffset();

  return (
    <div className={styles.strip}>
      <div
        className={styles.track}
        style={{
          transform: `translateX(${-offset * SCROLL_TRANSLATION_FACTOR}px)`,
        }}
      >
        {phrases.map((phrase) => (
          <span key={phrase.lead} className={styles.phrase}>
            <b className={styles.lead}>{phrase.lead}</b> {phrase.rest}
          </span>
        ))}
        <span aria-hidden="true" className={styles.track}>
          {phrases.map((phrase) => (
            <span key={phrase.lead} className={styles.phrase}>
              <b className={styles.lead}>{phrase.lead}</b> {phrase.rest}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm --filter @portfolio/web test src/components/ui/marquee-strip.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 5: Mount it on the home page**

Replace `apps/web/src/app/[locale]/page.tsx`:

```tsx
import { isLocale } from '@portfolio/core';
import { notFound } from 'next/navigation';

import { MarqueeStrip } from '../../components/ui/marquee-strip';
import { getContent } from '../../content/index';

/**
 * The home page.
 *
 * The hero, projects, timeline, stat band and footer each arrive in their own
 * sprint-1 task. The strip is here because it belongs to the page's chrome,
 * not to a section.
 */
export default async function HomePage({
  params,
}: {
  readonly params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <main id="content">
      <MarqueeStrip phrases={getContent(locale).strip.phrases} />
    </main>
  );
}
```

- [ ] **Step 6: Typecheck, test and commit**

```bash
pnpm typecheck && pnpm --filter @portfolio/web test
git add apps/web/src
git commit -m "$(cat <<'EOF'
feat(web): add the scroll-driven marquee strip

Translated by scroll position rather than autoplaying, which is what makes
it acceptable without a pause control: nothing moves unless the visitor
moves it. The duplicate phrase set that keeps the track covered is
aria-hidden, so each phrase is announced once.

Refs #3
EOF
)"
```

---

## Task 11: The section index, hidden until sections exist

**Files:**
- Create: `apps/web/src/components/ui/section-registry.ts`
- Create: `apps/web/src/components/ui/section-index.tsx`, `section-index.module.css`
- Test: `apps/web/src/components/ui/section-index.test.tsx`
- Modify: `apps/web/src/components/ui/site-nav.tsx`

**Interfaces:**
- Consumes: `useScrollProgress`.
- Produces: `SECTION_IDS: readonly string[]`, `<SectionIndex />`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/ui/section-index.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SectionIndex } from './section-index';

vi.mock('./section-registry', () => ({ SECTION_IDS: [] }));

describe('SectionIndex with an empty registry', () => {
  it('renders nothing, rather than an index of no sections', () => {
    const { container } = render(<SectionIndex />);

    expect(container).toBeEmptyDOMElement();
  });

  it('exposes no status for a screen reader to announce', () => {
    render(<SectionIndex />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @portfolio/web test src/components/ui/section-index.test.tsx`
Expected: FAIL — cannot resolve `./section-index`.

- [ ] **Step 3: Write the registry**

Create `apps/web/src/components/ui/section-registry.ts`:

```ts
/**
 * The sections the nav index counts, in the order they appear on the page.
 *
 * **Empty on purpose.** The prototype hardcodes
 * `['hero','work','timeline','skills','band','cta']` and the literal `' / 06'`,
 * and every one of those sections arrives in a later sprint-1 task. Each of
 * those tasks appends its own id here, and the index derives both its position
 * and its total from this array — so the count can never disagree with what is
 * actually on the page.
 *
 * Typed as `readonly string[]` rather than a `const` tuple so that adding an
 * entry is a one-line change here and nothing else.
 */
export const SECTION_IDS: readonly string[] = [];
```

- [ ] **Step 4: Write the index**

Create `apps/web/src/components/ui/section-index.module.css`:

```css
.index {
  font-size: 12px;
  color: #fff;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}

@media (max-width: 760px) {
  .index {
    font-size: 11px;
  }
}
```

Create `apps/web/src/components/ui/section-index.tsx`:

```tsx
'use client';

import { useScrollProgress } from '../../hooks/use-scroll';
import styles from './section-index.module.css';
import { SECTION_IDS } from './section-registry';

const INDEX_DIGITS = 2;
const INDEX_PAD_CHARACTER = '0';
const INDEX_SEPARATOR = ' / ';
const FIRST_SECTION_ORDINAL = 1;

function format(ordinal: number): string {
  return String(ordinal).padStart(INDEX_DIGITS, INDEX_PAD_CHARACTER);
}

/**
 * The nav's section counter (U-2 — OQ-01 in requirements.md).
 *
 * Renders nothing while `SECTION_IDS` is empty: an index reading `00 / 00` is
 * noise, and hiding it here means the tasks that add sections need no
 * coordination with this component beyond appending an id.
 */
export function SectionIndex() {
  const progress = useScrollProgress();

  if (SECTION_IDS.length === 0) {
    return null;
  }

  const active = Math.min(
    SECTION_IDS.length,
    Math.floor(progress * SECTION_IDS.length) + FIRST_SECTION_ORDINAL,
  );

  return (
    <span className={styles.index}>
      {format(active)}
      {INDEX_SEPARATOR}
      {format(SECTION_IDS.length)}
    </span>
  );
}
```

The active section comes from scroll progress across the registry, not from the
prototype's per-element `getBoundingClientRect` sweep — that sweep cannot run
while no section exists, and the task that adds the first section is free to
replace this derivation with one that measures elements.

- [ ] **Step 5: Run it to verify it passes**

Run: `pnpm --filter @portfolio/web test src/components/ui/section-index.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 6: Mount it in the nav**

In `apps/web/src/components/ui/site-nav.tsx`, import `SectionIndex` and render
it between the mark and the switcher:

```tsx
import { SectionIndex } from './section-index';
```

```tsx
      <SectionIndex />
      <LanguageSwitcher locale={locale} content={content} />
```

- [ ] **Step 7: Typecheck, test and commit**

```bash
pnpm typecheck && pnpm --filter @portfolio/web test
git add apps/web/src/components/ui
git commit -m "$(cat <<'EOF'
feat(web): derive the nav's section index from a registry

The prototype hardcodes six section ids and the literal ' / 06', and every
one of those sections arrives in a later task. The index now reads its
position and its total from one array, so the count cannot disagree with
the page, and it renders nothing while that array is empty.

Refs #3
EOF
)"
```

---

## Task 12: Documentation, review and the deferred test issue

**Files:**
- Modify: `docs/sprints/sprint-01.md` (U-2 and U-4 rows)
- Modify: `docs/requirements.md` (OQ-01–OQ-03)

- [ ] **Step 1: Record the answers in the sprint document**

In `docs/sprints/sprint-01.md`, the U-2 and U-4 rows now describe resolved
gaps. Append to each row's final cell:

- U-2: `**Resolved in #3:** all three ship, driven by a section registry each later task appends to; the index is hidden while the registry is empty. The en copy is authored in content/en/.`
- U-4: `**Resolved in #3:** one year, Lax, Path=/, Secure outside development, not HttpOnly. See lib/locale/locale-cookie.ts.`

- [ ] **Step 2: Record the answers against the open questions**

In `docs/requirements.md`, in the "Open against the prototype" table, append to
the Question cell of OQ-01, OQ-02 and OQ-03:
`**Answered in #3:** ships.` For OQ-01 add
`The index derives its total from a section registry, so it survives sections being added or removed.`

- [ ] **Step 3: Run the review skills**

`CLAUDE.md` requires both before a PR that touches components and docs:

```bash
# web-design-guidelines over apps/web/src/components and src/app
# writing-guidelines over the docs changed in steps 1-2
```

Read the findings, apply what is right, and leave the rest. Do not apply a
batch wholesale — unrelated churn in the diff fails the PR checklist.

- [ ] **Step 4: Verify against a running app**

```bash
pnpm dev
```

Check and write down the result of each, for the PR's verification section:

```bash
curl -sI -H 'Accept-Language: en-GB,en;q=0.9' http://localhost:3000/ | head -n 5
curl -sI -H 'Accept-Language: pt-BR,pt;q=0.9' http://localhost:3000/ | head -n 5
curl -sI -H 'Accept-Language: fr' http://localhost:3000/ | head -n 5
curl -sI --cookie 'locale=en' -H 'Accept-Language: pt-BR' http://localhost:3000/ | head -n 5
curl -so /dev/null -w '%{http_code}\n' http://localhost:3000/fr
```

Then in a browser, which is what the unit tests cannot reach: switch to
English, quit the browser, reopen it, visit `/` and confirm it lands on `/en`.
Check the layout at 380 px, 760 px and desktop.

- [ ] **Step 5: Full verification**

```bash
pnpm typecheck && pnpm test && pnpm build
```

All three green before the PR opens.

- [ ] **Step 6: Commit the documentation**

```bash
git add docs
git commit -m "$(cat <<'EOF'
docs(sprints): record the answers to U-2 and U-4

Both gaps are now decided in code, so the rows say what was decided rather
than that a decision is missing.

Refs #3
EOF
)"
```

- [ ] **Step 7: Open the deferred test issue**

```bash
gh issue create --repo NavesDev/orbit-portfolio \
  --title "test(web): Playwright harness and the locale persistence journey" \
  --label test --label web --assignee NavesDev \
  --body "$(cat <<'EOF'
### Type

test

### Area

web

### Description

Scaffold Playwright in `apps/web/e2e` and cover the one part of the locale
journey that unit tests cannot reach: the round trip through a real cookie jar.

`middleware.test.ts` (shipped in #3) already proves the redirect honours
`Accept-Language`, falls back to `pt-BR`, and lets a cookie outrank the header.
What it cannot prove is that a browser, told to keep the cookie for a year,
actually keeps it — which is the criterion FR-33 states.

### Expected outcome

Journey 6 of `docs/testing.md` runs in CI or against the Vercel preview, and
FR-33 stops resting on hand verification.

### Acceptance criteria

- [ ] Playwright installed in `apps/web`, `pnpm test:e2e` runs it.
- [ ] A test switches the language, discards and restores browser state, visits
      `/` with a conflicting `Accept-Language`, and lands on the chosen locale.
- [ ] Where E2E runs is decided and written down — `testing.md` says the Vercel
      preview, not CI.

### Out of scope

The other five journeys in `docs/testing.md`; they need the sections that
sprint-1 tasks 3 to 6 deliver.

### References

- docs/testing.md — journey 6, and the per-phase table assigning E2E to Phase 4
- docs/superpowers/specs/2026-08-11-bilingual-site-shell-design.md — "Deferred: the E2E journey"
- #3
EOF
)"
```

---

## Self-Review

**Spec coverage.** Locale enum → Task 1. `LocalizedText`, budgets, errors →
Task 2. Negotiation → Task 3. Cookie → Task 4. Middleware and the `/` redirect
→ Task 5. Route segment, `generateStaticParams`, `revalidate`, unknown-locale
404, tokens, globals, fonts → Task 6. Content modules → Task 7. Switcher and nav
→ Task 8. Scroll store and progress bar → Task 9. Marquee → Task 10. Section
registry and index → Task 11. Documentation, review skills, hand verification
and the deferred issue → Task 12.

**Type consistency.** `Locale`, `LOCALES`, `DEFAULT_LOCALE`, `isLocale` are used
under those names from Task 1 onward. `SiteContent` and `StripPhrase` are
defined in Task 7 and consumed in Tasks 8 and 10. `useScrollProgress` /
`useScrollOffset` are defined in Task 9 and consumed in Tasks 10 and 11.
`serializeLocaleCookie` and `readLocaleCookie` are defined in Task 4 and
consumed in Tasks 5 and 8.

**Known risk.** `next/font/google` downloads the faces at build time, so
`pnpm build` needs network access. CI has it; an offline machine will fail at
Task 6 step 10. If that happens, the fallback is `next/font/local` with the
`.woff2` files committed — which is a change to the design and should be raised,
not made silently.
