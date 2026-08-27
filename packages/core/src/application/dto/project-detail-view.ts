import type { ProjectCardView } from './project-card-view.ts';
import type { ProjectSkillView } from './project-skill-view.ts';

/**
 * Everything the detail modal shows, beyond what the card already carries.
 *
 * Extends `ProjectCardView` rather than duplicating its fields: the modal
 * opens from a card and shows everything the card shows plus more, never
 * less.
 */
export interface ProjectDetailView extends ProjectCardView {
  readonly description: string | null;
  /** Omitted from the modal's controls when `null` (FR-09). */
  readonly repoUrl: string | null;
  readonly liveUrl: string | null;
  readonly skills: readonly ProjectSkillView[];
}
