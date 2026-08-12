/**
 * Public surface of `@portfolio/core`.
 *
 * `package.json` points `main` and `types` here, so this barrel is what
 * `@portfolio/db` and `@portfolio/web` resolve to. Consumers import from the
 * package name and never reach into `src/`, which keeps the layer boundary
 * visible in the import path itself.
 *
 * Domain entities, value objects, enums, errors, ports, use cases and DTOs are
 * re-exported here as they land.
 */

export {
  DEFAULT_LOCALE,
  isLocale,
  LOCALES,
  type Locale,
} from './domain/enums/locale.ts';
