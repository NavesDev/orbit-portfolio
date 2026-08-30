import type { Project } from '../../../domain/entities/project.ts';
import type { ProjectSkillUsage } from '../../read-models/project-skill-usage.ts';
import type { ProjectRepository } from '../project-repository.ts';

/**
 * In-memory `ProjectRepository` for use-case tests.
 *
 * It holds unfeatured and unpublished projects too, and drops them in
 * `listFeatured` — mirroring `FakeSocialLinkRepository`'s shape — so "only
 * featured, published projects reach the page" is a fact a unit test can
 * establish with no database. Insertion order is deliberately arbitrary: the
 * use case owns the ordering contract.
 */
export class FakeProjectRepository implements ProjectRepository {
  private readonly projects = new Map<string, Project>();
  private readonly skillUsagesByProjectId: ReadonlyMap<string, readonly ProjectSkillUsage[]>;

  constructor(
    projects: readonly Project[] = [],
    skillUsagesByProjectId: ReadonlyMap<string, readonly ProjectSkillUsage[]> = new Map(),
  ) {
    for (const project of projects) {
      this.projects.set(project.id, project);
    }

    this.skillUsagesByProjectId = skillUsagesByProjectId;
  }

  listFeatured(): Promise<Project[]> {
    return Promise.resolve(
      [...this.projects.values()].filter((project) => project.isFeatured && project.isPublished),
    );
  }

  listSkillUsage(projectId: string): Promise<ProjectSkillUsage[]> {
    return Promise.resolve([...(this.skillUsagesByProjectId.get(projectId) ?? [])]);
  }

  findPublishedBySlug(slug: string): Promise<Project | null> {
    const found = [...this.projects.values()].find(
      (project) => project.slug.toString() === slug && project.isPublished,
    );

    return Promise.resolve(found ?? null);
  }
}
