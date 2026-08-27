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
