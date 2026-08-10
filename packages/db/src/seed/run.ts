import { fileURLToPath } from 'node:url';
import type { Pool, PoolClient } from 'pg';
import { createPool, requireConnectionString } from '../client.ts';
import { seedContent, type Localized, type SkillUsage } from './data.ts';
import { seedId } from './ids.ts';

/**
 * Writes `data.ts` into the database, in one transaction, upserting on the
 * deterministic id of each row.
 *
 * Re-running converges the database on the file without changing ids and
 * without deleting anything an author added by hand — the seed states what
 * these rows are, it is not a reset button.
 *
 * Order follows the foreign keys: skills and the owning tables first, join rows
 * written inside their owner's loop.
 */
export async function seed(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await seedSocialLinks(client);
    await seedSkills(client);
    await seedProjects(client);
    await seedTimelineEntries(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function seedSocialLinks(client: PoolClient): Promise<void> {
  for (const link of seedContent.socialLinks) {
    await client.query(
      `INSERT INTO social_links (id, platform, url, icon_svg, is_published, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE
              SET platform = EXCLUDED.platform,
                  url = EXCLUDED.url,
                  icon_svg = EXCLUDED.icon_svg,
                  is_published = EXCLUDED.is_published,
                  sort_order = EXCLUDED.sort_order,
                  updated_at = now()`,
      [
        seedId('social_link', link.platform),
        link.platform,
        link.url,
        link.iconSvg,
        link.isPublished,
        link.sortOrder,
      ],
    );
  }
}

async function seedSkills(client: PoolClient): Promise<void> {
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

async function seedProjects(client: PoolClient): Promise<void> {
  for (const project of seedContent.projects) {
    const id = seedId('project', project.slug);
    await client.query(
      `INSERT INTO projects (id, slug, title, category, description, tags, repo_url,
                             live_url, progress_percent, started_on, ended_on,
                             is_featured, is_published, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (id) DO UPDATE
              SET slug = EXCLUDED.slug,
                  title = EXCLUDED.title,
                  category = EXCLUDED.category,
                  description = EXCLUDED.description,
                  tags = EXCLUDED.tags,
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

async function seedTimelineEntries(client: PoolClient): Promise<void> {
  for (const entry of seedContent.timelineEntries) {
    // Organization and start date are what make a role unique here; kind keeps
    // a degree and a job at the same institution apart.
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

const KNOWN_SKILLS = new Set(seedContent.skills.map((skill) => skill.name));

/**
 * A typo in a skill name would otherwise insert nothing and drop the
 * association silently, leaving a skill that renders nowhere.
 */
function usages(skills: SkillUsage, owner: string): [string, Localized][] {
  return Object.entries(skills).map(([name, note]) => {
    if (!KNOWN_SKILLS.has(name)) {
      throw new Error(`${owner} references an unknown skill: "${name}".`);
    }
    return [name, note];
  });
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

async function main(): Promise<void> {
  const pool = createPool(requireConnectionString('DATABASE_URL'));
  try {
    await seed(pool);
    console.log(
      `Seeded ${seedContent.skills.length} skills, ${seedContent.projects.length} projects, ` +
        `${seedContent.timelineEntries.length} timeline entries and ` +
        `${seedContent.socialLinks.length} social links.`,
    );
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
