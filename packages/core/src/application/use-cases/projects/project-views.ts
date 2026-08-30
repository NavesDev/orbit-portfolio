import type { Project } from '../../../domain/entities/project.ts';
import type { Locale } from '../../../domain/enums/locale.ts';
import * as PROJECT_VIEW_CONSTANTS from '../../constants/project-views.ts';
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
    summary: toSummary(project.description?.resolve(locale) ?? null),
    category: project.category?.resolve(locale) ?? null,
    tags: project.tags === null ? [] : [...project.tags.resolve(locale)],
    progressPercent: project.progress.value,
    visualSvg: project.visualSvg?.toString() ?? null,
    repoUrl: project.repoUrl?.toString() ?? null,
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

/**
 * The card's one-line summary, lifted from the opening paragraph of the
 * project's Markdown `description` (FR-06).
 *
 * Derived rather than stored: the descriptions are authored lead-paragraph
 * first, then a blank line, then the bullets, so the summary a card wants is
 * already written and a second column would be the same sentence kept in sync
 * by hand across two locales.
 *
 * Returned as plain text, which holds because that lead paragraph is prose —
 * a card is not a Markdown renderer, and inline markup written there would
 * reach a reader as asterisks. A description that opens on a list has no lead
 * prose at all, so it summarises to `null` rather than to markup.
 */
function toSummary(description: string | null): string | null {
  if (description === null) {
    return null;
  }

  const [lead = ''] = description.split(PROJECT_VIEW_CONSTANTS.PARAGRAPH_SEPARATOR);
  const summary = lead.trim();

  if (summary === '' || PROJECT_VIEW_CONSTANTS.LIST_ITEM_PATTERN.test(summary)) {
    return null;
  }

  return summary;
}
