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
export {
  CATEGORY_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  TAG_MAX_LENGTH,
  TAGS_MAX_ITEMS,
  TITLE_MAX_LENGTH,
  USAGE_NOTE_MAX_LENGTH,
} from './domain/constants/text-budgets.ts';
export { DomainError } from './domain/errors/domain-error.ts';
export {
  InvalidLocalizedTextError,
  LOCALIZED_TEXT_VIOLATIONS,
  type LocalizedTextViolation,
} from './domain/errors/invalid-localized-text-error.ts';
export { LocalizedText } from './domain/value-objects/localized-text.ts';
export { ApplicationError } from './application/errors/application-error.ts';
export { DeveloperStatsUnavailableError } from './application/errors/developer-stats-unavailable-error.ts';
export type {
  DeveloperStats,
  DeveloperStatsProvider,
} from './application/ports/developer-stats-provider.ts';
export {
  GetDeveloperStats,
  type GetDeveloperStatsInput,
  type GetDeveloperStatsOutput,
} from './application/use-cases/stats/get-developer-stats.ts';
