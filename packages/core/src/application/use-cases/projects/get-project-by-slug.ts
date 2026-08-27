import type { Locale } from '../../../domain/enums/locale.ts';
import type { ProjectDetailView } from '../../dto/project-detail-view.ts';
import type { ProjectRepository } from '../../ports/project-repository.ts';
import { toDetailView } from './project-views.ts';

export interface GetProjectBySlugOutput {
  readonly detail: ProjectDetailView | null;
}

/**
 * One project's full detail, by slug — the data behind `/[locale]/projetos/[slug]`
 * (roadmap 4.2, FR-06–FR-10).
 *
 * `null` rather than a thrown error when the slug names nothing published:
 * from the page's side "no such project" and "that project is unpublished"
 * are the same fact, and both turn into the same 404 (FR-28).
 *
 * Unlike `ListFeaturedProjects`, this does not filter on `isFeatured` — a
 * project's own page exists for any published project, whether or not the
 * home page currently features it.
 */
export class GetProjectBySlug {
  constructor(private readonly repository: ProjectRepository) {}

  async execute(slug: string, locale: Locale): Promise<GetProjectBySlugOutput> {
    const project = await this.repository.findPublishedBySlug(slug);

    if (project === null) {
      return { detail: null };
    }

    const usages = await this.repository.listSkillUsage(project.id);

    return { detail: toDetailView(project, locale, usages) };
  }
}
