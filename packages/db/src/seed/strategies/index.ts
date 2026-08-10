import { ProjectsSeedStrategy } from './projects.strategy.ts';
import type { SeedStrategy } from './seed-strategy.ts';
import { SkillsSeedStrategy } from './skills.strategy.ts';
import { SocialLinksSeedStrategy } from './social-links.strategy.ts';
import { TimelineEntriesSeedStrategy } from './timeline-entries.strategy.ts';

export type { SeedStrategy } from './seed-strategy.ts';

/**
 * The seed's registry. Order follows the foreign keys: skills and the owning
 * tables first, join rows written inside their owner's strategy.
 *
 * Adding a table is adding its strategy class next to these and one more
 * entry here — `seed()` in `run.ts` does not change.
 */
export const SEED_STRATEGIES: readonly SeedStrategy[] = [
  new SocialLinksSeedStrategy(),
  new SkillsSeedStrategy(),
  new ProjectsSeedStrategy(),
  new TimelineEntriesSeedStrategy(),
];
