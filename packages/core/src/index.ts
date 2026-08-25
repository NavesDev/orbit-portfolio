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
export {
  ICON_SVG_VIOLATIONS,
  InvalidIconSvgError,
  type IconSvgViolation,
} from './domain/errors/invalid-icon-svg-error.ts';
export {
  InvalidSocialLinkError,
  SOCIAL_LINK_VIOLATIONS,
  type SocialLinkViolation,
} from './domain/errors/invalid-social-link-error.ts';
export { IconSvg } from './domain/value-objects/icon-svg.ts';
export { LocalizedText } from './domain/value-objects/localized-text.ts';
export { SocialLink, type SocialLinkProperties } from './domain/entities/social-link.ts';
export { ApplicationError } from './application/errors/application-error.ts';
export { DeveloperStatsUnavailableError } from './application/errors/developer-stats-unavailable-error.ts';
export type {
  DeveloperStats,
  DeveloperStatsProvider,
} from './application/ports/developer-stats-provider.ts';
export {
  GetDeveloperStats,
  type GetDeveloperStatsOutput,
} from './application/use-cases/stats/get-developer-stats.ts';
export type { SocialLinkView } from './application/dto/social-link-view.ts';
export type { SocialLinkRepository } from './application/ports/social-link-repository.ts';
export {
  ListSocialLinks,
  type ListSocialLinksOutput,
} from './application/use-cases/social/list-social-links.ts';
