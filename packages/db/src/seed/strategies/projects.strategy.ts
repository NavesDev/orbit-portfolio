import type { PoolClient } from 'pg';
import { seedContent } from '../data.ts';
import { seedId } from '../ids.ts';
import type { SeedStrategy } from './seed-strategy.ts';
import { json, usages } from './support.ts';

export class ProjectsSeedStrategy implements SeedStrategy {
  readonly table = 'projects';

  async run(client: PoolClient): Promise<void> {
    for (const project of seedContent.projects) {
      const id = seedId('project', project.slug);
      await client.query(
        `INSERT INTO projects (id, slug, title, category, description, tags, visual_svg,
                               repo_url, live_url, progress_percent, started_on, ended_on,
                               is_featured, is_published, sort_order)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO UPDATE
                SET slug = EXCLUDED.slug,
                    title = EXCLUDED.title,
                    category = EXCLUDED.category,
                    description = EXCLUDED.description,
                    tags = EXCLUDED.tags,
                    visual_svg = EXCLUDED.visual_svg,
                    repo_url = EXCLUDED.repo_url,
                    live_url = EXCLUDED.live_url,
                    progress_percent = EXCLUDED.progress_percent,
                    started_on = EXCLUDED.started_on,
                    ended_on = EXCLUDED.ended_on,
                    is_featured = EXCLUDED.is_featured,
                    is_published = EXCLUDED.is_published,
                    sort_order = EXCLUDED.sort_order,
                    updated_at = now()`,
        [
          id,
          project.slug,
          json(project.title),
          json(project.category),
          json(project.description),
          json(project.tags),
          project.visualSvg,
          project.repoUrl,
          project.liveUrl,
          project.progressPercent,
          project.startedOn,
          project.endedOn,
          project.isFeatured,
          project.isPublished,
          project.sortOrder,
        ],
      );

      for (const [skillName, note] of usages(project.skills, project.slug)) {
        await client.query(
          `INSERT INTO project_skill (project_id, skill_id, usage_note)
                VALUES ($1, $2, $3)
           ON CONFLICT (project_id, skill_id) DO UPDATE
                  SET usage_note = EXCLUDED.usage_note`,
          [id, seedId('skill', skillName), json(note)],
        );
      }
    }
  }
}
