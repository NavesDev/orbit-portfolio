import type { Project } from '../../../domain/entities/project.ts';
import type { Locale } from '../../../domain/enums/locale.ts';
import type { ProjectCardView } from '../../dto/project-card-view.ts';
import type { ProjectDetailView } from '../../dto/project-detail-view.ts';
import type { ProjectRepository } from '../../ports/project-repository.ts';
import { toCardView, toDetailView } from './project-views.ts';

export interface ListFeaturedProjectsOutput {
  readonly projects: readonly ProjectCardView[];
  /** The same projects, keyed by `slug`, for callers that need both at once. */
  readonly details: Readonly<Record<string, ProjectDetailView>>;
}

/**
 * The featured-projects section's data (FR-05–FR-10, NFR-13).
 *
 * `limit` is applied after sorting, not before: `ProjectRepository.listFeatured`
 * returns every featured, published project with no cap, and capping earlier
 * than the sort could drop the very row `sort_order` would have put first.
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
