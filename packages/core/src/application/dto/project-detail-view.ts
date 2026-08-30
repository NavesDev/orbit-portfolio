import type { ProjectCardView } from './project-card-view.ts';
import type { ProjectSkillView } from './project-skill-view.ts';

/**
 * Everything the project's detail page shows (roadmap 4.2), beyond what the
 * card already carries.
 *
 * Extends `ProjectCardView` rather than duplicating its fields: the detail
 * page is reached from a card and shows everything the card shows plus more,
 * never less. `repoUrl` is therefore inherited, not redeclared — the card
 * links to it too (FR-09).
 */
export interface ProjectDetailView extends ProjectCardView {
  readonly description: string | null;
  readonly liveUrl: string | null;
  readonly skills: readonly ProjectSkillView[];
}
