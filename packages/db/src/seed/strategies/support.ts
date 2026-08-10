import { seedContent, type Localized, type SkillUsage } from '../data.ts';

/** `jsonb` columns take text over the wire; every strategy serializes through this. */
export function json(value: unknown): string {
  return JSON.stringify(value);
}

const KNOWN_SKILLS = new Set(seedContent.skills.map((skill) => skill.name));

/**
 * A typo in a skill name would otherwise insert nothing and drop the
 * association silently, leaving a skill that renders nowhere. Shared by
 * `ProjectsSeedStrategy` and `TimelineEntriesSeedStrategy`, the two owners of
 * a skill join table.
 */
export function usages(skills: SkillUsage, owner: string): [string, Localized][] {
  return Object.entries(skills).map(([name, note]) => {
    if (!KNOWN_SKILLS.has(name)) {
      throw new Error(`${owner} references an unknown skill: "${name}".`);
    }
    return [name, note];
  });
}
