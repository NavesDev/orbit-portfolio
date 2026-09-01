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
  ORGANIZATION_MAX_LENGTH,
  TAG_MAX_LENGTH,
  TAGS_MAX_ITEMS,
  TITLE_MAX_LENGTH,
  USAGE_NOTE_MAX_LENGTH,
} from './domain/constants/text-budgets.ts';
export { DomainError } from './domain/errors/domain-error.ts';
export {
  ENTITY_VIOLATIONS,
  InvalidEntityError,
  type EntityViolation,
} from './domain/errors/invalid-entity-error.ts';
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
export { Entity, type EntityProperties } from './domain/entities/entity.ts';
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
export {
  GetProjectBySlug,
  type GetProjectBySlugOutput,
} from './application/use-cases/projects/get-project-by-slug.ts';
export {
  isTimelineKind,
  TIMELINE_KINDS,
  type TimelineKind,
} from './domain/enums/timeline-kind.ts';
export {
  InvalidTimelineEntryError,
  TIMELINE_ENTRY_VIOLATIONS,
  type TimelineEntryViolation,
} from './domain/errors/invalid-timeline-entry-error.ts';
export {
  TimelineEntry,
  type TimelineEntryProperties,
} from './domain/entities/timeline-entry.ts';
export type {
  TimelinePage,
  TimelineRepository,
} from './application/ports/timeline-repository.ts';
export type { TimelineEntryView } from './application/dto/timeline-entry-view.ts';
export {
  GetTimeline,
  type GetTimelineOutput,
  type TimelinePageRequest,
} from './application/use-cases/timeline/get-timeline.ts';
