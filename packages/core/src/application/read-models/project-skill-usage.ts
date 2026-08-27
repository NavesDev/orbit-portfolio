import type { LocalizedText } from '../../domain/value-objects/localized-text.ts';

/**
 * One row of `project_skill`, joined to the skill's name (data-model.md § 5).
 *
 * A read model, not an entity: `usage_note` belongs to the pairing, and this
 * type exists only to carry it back out. `skillName` is a plain string because
 * `skills.name` is a proper noun, never translated.
 */
export interface ProjectSkillUsage {
  readonly skillName: string;
  readonly usageNote: LocalizedText | null;
}
