import type { PoolClient } from 'pg';
import { seedContent } from '../data.ts';
import { seedId } from '../ids.ts';
import type { SeedStrategy } from './seed-strategy.ts';
import { json, usages } from './support.ts';

export class TimelineEntriesSeedStrategy implements SeedStrategy {
  readonly table = 'timeline_entries';

  async run(client: PoolClient): Promise<void> {
    for (const entry of seedContent.timelineEntries) {
      // Organization and start date are what make a role unique here; kind
      // keeps a degree and a job at the same institution apart.
      const naturalKey = `${entry.kind}:${entry.organization}:${entry.startedOn}`;
      const id = seedId('timeline_entry', naturalKey);
      await client.query(
        `INSERT INTO timeline_entries (id, kind, title, organization, description,
                                       credential_url, started_on, ended_on,
                                       is_featured, is_published, sort_order)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE
                SET kind = EXCLUDED.kind,
                    title = EXCLUDED.title,
                    organization = EXCLUDED.organization,
                    description = EXCLUDED.description,
                    credential_url = EXCLUDED.credential_url,
                    started_on = EXCLUDED.started_on,
                    ended_on = EXCLUDED.ended_on,
                    is_featured = EXCLUDED.is_featured,
                    is_published = EXCLUDED.is_published,
                    sort_order = EXCLUDED.sort_order,
                    updated_at = now()`,
        [
          id,
          entry.kind,
          json(entry.title),
          entry.organization,
          json(entry.description),
          entry.credentialUrl,
          entry.startedOn,
          entry.endedOn,
          entry.isFeatured,
          entry.isPublished,
          entry.sortOrder,
        ],
      );

      for (const [skillName, note] of usages(entry.skills, entry.organization)) {
        await client.query(
          `INSERT INTO timeline_entry_skill (timeline_entry_id, skill_id, usage_note)
                VALUES ($1, $2, $3)
           ON CONFLICT (timeline_entry_id, skill_id) DO UPDATE
                  SET usage_note = EXCLUDED.usage_note`,
          [id, seedId('skill', skillName), json(note)],
        );
      }
    }
  }
}
