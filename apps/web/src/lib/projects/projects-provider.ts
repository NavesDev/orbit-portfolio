import {
  GetProjectBySlug,
  ListFeaturedProjects,
  type ListFeaturedProjectsOutput,
  type Locale,
  type ProjectDetailView,
} from '@portfolio/core';
import { getPool, PostgresProjectRepository } from '@portfolio/db';

import * as PROJECTS_PROVIDER_CONSTANTS from './constants/projects-provider';

/**
 * The featured-projects section's data, read from the database.
 *
 * The composition root for this slice — the only module in `apps/web` that
 * knows both that `ProjectRepository` exists and that PostgreSQL implements
 * it (NFR-02), the same role `social-links-provider.ts` plays for the footer.
 */
export async function listFeaturedProjects(locale: Locale): Promise<ListFeaturedProjectsOutput> {
  const useCase = new ListFeaturedProjects(new PostgresProjectRepository(getPool()));

  return useCase.execute(locale, PROJECTS_PROVIDER_CONSTANTS.FEATURED_PROJECTS_LIMIT);
}

/**
 * One project's detail, by slug (roadmap 4.2) — `null` when the slug names
 * nothing published, which the route turns into a 404.
 */
export async function getProjectDetail(locale: Locale, slug: string): Promise<ProjectDetailView | null> {
  const useCase = new GetProjectBySlug(new PostgresProjectRepository(getPool()));
  const { detail } = await useCase.execute(slug, locale);

  return detail;
}
