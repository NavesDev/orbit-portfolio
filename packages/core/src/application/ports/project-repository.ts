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
 *
 * `findPublishedBySlug` backs the project detail page (roadmap 4.2). It
 * checks `isPublished` only, not `isFeatured`: a project's own page has to
 * exist for any published project, not only the handful the home page
 * features.
 */
export interface ProjectRepository {
  listFeatured(): Promise<Project[]>;
  listSkillUsage(projectId: string): Promise<ProjectSkillUsage[]>;
  findPublishedBySlug(slug: string): Promise<Project | null>;
}
