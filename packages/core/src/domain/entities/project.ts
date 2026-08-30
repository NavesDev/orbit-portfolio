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
