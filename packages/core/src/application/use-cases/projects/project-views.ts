import type { Project } from '../../../domain/entities/project.ts';
import type { Locale } from '../../../domain/enums/locale.ts';
import type { ProjectCardView } from '../../dto/project-card-view.ts';
import type { ProjectDetailView } from '../../dto/project-detail-view.ts';
import type { ProjectSkillView } from '../../dto/project-skill-view.ts';
import type { ProjectSkillUsage } from '../../read-models/project-skill-usage.ts';

/**
 * `Project` ⇒ presentation, shared by `ListFeaturedProjects` and
 * `GetProjectBySlug` — both resolve the same entity to the same shapes, just
 * reached by a different query. Every field here is a resolved `string`,
 * never a `LocalizedText` or another value object (NFR-13).
 */
export function toCardView(project: Project, locale: Locale): ProjectCardView {
  return {
    slug: project.slug.toString(),
    title: project.title.resolve(locale),
    category: project.category?.resolve(locale) ?? null,
    tags: project.tags === null ? [] : [...project.tags.resolve(locale)],
    progressPercent: project.progress.value,
    visualSvg: project.visualSvg?.toString() ?? null,
  };
}

export function toDetailView(
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
