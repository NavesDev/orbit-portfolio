import type { PoolClient } from 'pg';
import { seedContent } from '../data.ts';
import { seedId } from '../ids.ts';
import type { SeedStrategy } from './seed-strategy.ts';

export class SkillsSeedStrategy implements SeedStrategy {
  readonly table = 'skills';

  async run(client: PoolClient): Promise<void> {
    for (const skill of seedContent.skills) {
      await client.query(
        `INSERT INTO skills (id, name, category, sort_order)
              VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE
                SET name = EXCLUDED.name,
                    category = EXCLUDED.category,
                    sort_order = EXCLUDED.sort_order,
                    updated_at = now()`,
        [seedId('skill', skill.name), skill.name, skill.category, skill.sortOrder],
      );
    }
  }
}
