import {
  DateRange,
  IconSvg,
  LocalizedTagList,
  LocalizedText,
  ProgressPercent,
  Project,
  type ProjectProperties,
  Slug,
  Url,
} from '@portfolio/core';
import type { Pool } from 'pg';
import { beforeEach, describe, expect, it } from 'vitest';

import { PostgresProjectRepository } from '../../../src/repositories/postgres-project.repository.ts';
import { withScratchDatabase } from '../../helpers/scratch-database.ts';

const { pool } = withScratchDatabase();

function project(overrides: Partial<ProjectProperties> = {}): Project {
  return Project.create({
    id: '00000000-0000-4000-8000-000000000001',
    slug: Slug.create('orbit-portfolio'),
    title: LocalizedText.create({ 'en-US': 'Orbit Portfolio' }, 160),
    category: LocalizedText.create({ 'en-US': 'Personal portfolio' }, 40),
    description: null,
    tags: LocalizedTagList.create({ 'en-US': ['Next.js'] }, 60, 8),
    repoUrl: Url.create('https://github.com/NavesDev/orbit-portfolio'),
    liveUrl: null,
    progress: ProgressPercent.create(100),
    period: DateRange.create({ startedOn: '2026-08-08', endedOn: null }),
    visualSvg: null,
    isFeatured: true,
    isPublished: true,
    sortOrder: 0,
    ...overrides,
  });
}

async function insertProject(client: Pool, values: Project): Promise<void> {
  await client.query(
    `INSERT INTO projects (id, slug, title, category, description, tags, repo_url, live_url,
                           progress_percent, started_on, ended_on, visual_svg,
                           is_featured, is_published, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      values.id,
      values.slug.toString(),
      JSON.stringify(values.title.toJSON()),
      values.category === null ? null : JSON.stringify(values.category.toJSON()),
      values.description === null ? null : JSON.stringify(values.description.toJSON()),
      values.tags === null ? null : JSON.stringify(values.tags.toJSON()),
      values.repoUrl?.toString() ?? null,
      values.liveUrl?.toString() ?? null,
      values.progress.value,
      values.period.startedOn,
      values.period.endedOn,
      values.visualSvg?.toString() ?? null,
      values.isFeatured,
      values.isPublished,
      values.sortOrder,
    ],
  );
}

function repository(): PostgresProjectRepository {
  return new PostgresProjectRepository(pool());
}

beforeEach(async () => {
  await pool().query('DELETE FROM projects');
});

describe('PostgresProjectRepository', () => {
  it('returns featured, published projects in sort_order', async () => {
    await insertProject(
      pool(),
      project({ id: '00000000-0000-4000-8000-000000000002', slug: Slug.create('second'), sortOrder: 1 }),
    );
    await insertProject(
      pool(),
      project({ id: '00000000-0000-4000-8000-000000000001', slug: Slug.create('first'), sortOrder: 0 }),
    );

    const found = await repository().listFeatured();

    expect(found.map((row) => row.slug.toString())).toEqual(['first', 'second']);
  });

  it('excludes an unpublished project', async () => {
    await insertProject(pool(), project({ isPublished: false }));

    expect(await repository().listFeatured()).toEqual([]);
  });

  it('excludes an unfeatured project', async () => {
    await insertProject(pool(), project({ isFeatured: false }));

    expect(await repository().listFeatured()).toEqual([]);
  });

  it('finds a published project by slug regardless of is_featured (roadmap 4.2)', async () => {
    await insertProject(pool(), project({ isFeatured: false }));

    const found = await repository().findPublishedBySlug('orbit-portfolio');

    expect(found?.slug.toString()).toBe('orbit-portfolio');
  });

  it('returns null for an unpublished project by slug', async () => {
    await insertProject(pool(), project({ isPublished: false }));

    expect(await repository().findPublishedBySlug('orbit-portfolio')).toBeNull();
  });

  it('returns null for a slug that names no project', async () => {
    expect(await repository().findPublishedBySlug('no-such-project')).toBeNull();
  });

  it('reads a stored visual_svg back through IconSvg', async () => {
    const icon = IconSvg.create('<svg viewBox="0 0 24 24"><path class="orbit-pulse" d="M0 0"/></svg>');
    await insertProject(pool(), project({ visualSvg: icon }));

    const [found] = await repository().listFeatured();

    expect(found?.visualSvg?.toString()).toBe(icon.toString());
  });

  it('reads started_on and ended_on as plain ISO dates, not shifted by timezone', async () => {
    await insertProject(
      pool(),
      project({ period: DateRange.create({ startedOn: '2026-01-01', endedOn: '2026-01-02' }) }),
    );

    const [found] = await repository().listFeatured();

    expect(found?.period.startedOn).toBe('2026-01-01');
    expect(found?.period.endedOn).toBe('2026-01-02');
  });

  it('lists a project’s applied skills with their usage note, resolved to LocalizedText', async () => {
    await insertProject(pool(), project());
    const [skill] = (
      await pool().query<{ id: string }>(
        `INSERT INTO skills (name, category, sort_order) VALUES ($1, 'frontend', 0) RETURNING id`,
        ['Next.js'],
      )
    ).rows;
    await pool().query(
      `INSERT INTO project_skill (project_id, skill_id, usage_note) VALUES ($1, $2, $3)`,
      ['00000000-0000-4000-8000-000000000001', skill?.id, JSON.stringify({ 'en-US': 'App Router.' })],
    );

    const usages = await repository().listSkillUsage('00000000-0000-4000-8000-000000000001');

    expect(usages).toHaveLength(1);
    expect(usages[0]?.skillName).toBe('Next.js');
    expect(usages[0]?.usageNote?.resolve('en-US')).toBe('App Router.');
  });

  it('returns no skill usage for a project with none', async () => {
    await insertProject(pool(), project());

    expect(await repository().listSkillUsage('00000000-0000-4000-8000-000000000001')).toEqual([]);
  });

  /* NFR-07, same boundary as social_links: a row is reachable by hand. */
  it('refuses to load a project whose visual_svg carries an event handler', async () => {
    await pool().query(
      `INSERT INTO projects (id, slug, title, visual_svg, is_featured, is_published, sort_order)
            VALUES ($1, $2, $3, $4, true, true, 0)`,
      [
        '00000000-0000-4000-8000-000000000099',
        'unsafe',
        JSON.stringify({ 'en-US': 'Unsafe' }),
        '<svg onload="alert(1)"><path d="M0 0"/></svg>',
      ],
    );

    await expect(repository().listFeatured()).rejects.toThrow(/event handler/i);
  });
});
