import { beforeEach, describe, expect, it } from 'vitest';
import { withScratchDatabase } from './testing/scratch-database.ts';

/**
 * The constraints are the second line of defence behind the domain's value
 * objects (NFR-08). A constraint nobody tested is a constraint nobody knows is
 * missing — these are the rejections data-model.md and testing.md name.
 */
const db = withScratchDatabase();

const TITLE = { 'pt-BR': 'Título', en: 'Title' };

let slugCounter = 0;

/** Inserts a project with the given overrides merged over a valid baseline. */
async function insertProject(overrides: Record<string, unknown> = {}): Promise<string> {
  const row: Record<string, unknown> = {
    slug: `project-${(slugCounter += 1)}`,
    title: TITLE,
    ...overrides,
  };
  const columns = Object.keys(row);
  const values = Object.values(row).map((value) =>
    typeof value === 'object' && value !== null ? JSON.stringify(value) : value,
  );
  const { rows } = await db.pool().query<{ id: string }>(
    `INSERT INTO projects (${columns.join(', ')})
     VALUES (${columns.map((_, index) => `$${index + 1}`).join(', ')})
     RETURNING id`,
    values,
  );
  return rows[0]!.id;
}

async function insertSkill(name: string): Promise<string> {
  const { rows } = await db.pool().query<{ id: string }>(
    `INSERT INTO skills (name, category) VALUES ($1, 'backend') RETURNING id`,
    [name],
  );
  return rows[0]!.id;
}

beforeEach(async () => {
  await db
    .pool()
    .query('TRUNCATE project_skill, timeline_entry_skill, projects, timeline_entries, skills');
});

describe('projects constraints', () => {
  it('rejects a progress percent outside 0-100', async () => {
    await expect(insertProject({ progress_percent: 150 })).rejects.toThrow(
      /ck_projects__progress_range/,
    );
  });

  it('accepts the boundaries of the progress range', async () => {
    await expect(insertProject({ progress_percent: 0 })).resolves.toBeTypeOf('string');
    await expect(insertProject({ progress_percent: 100 })).resolves.toBeTypeOf('string');
  });

  it('rejects an end date before the start date', async () => {
    await expect(
      insertProject({ started_on: '2026-01-10', ended_on: '2026-01-01' }),
    ).rejects.toThrow(/ck_projects__date_order/);
  });

  it('accepts an open period', async () => {
    await expect(
      insertProject({ started_on: '2026-01-10', ended_on: null }),
    ).resolves.toBeTypeOf('string');
  });

  it('rejects a duplicate slug', async () => {
    await insertProject({ slug: 'orbit-portfolio' });
    await expect(insertProject({ slug: 'orbit-portfolio' })).rejects.toThrow(
      /ux_projects__slug/,
    );
  });

  it('rejects a localized value over its length budget', async () => {
    await expect(insertProject({ title: { 'pt-BR': 'a'.repeat(161) } })).rejects.toThrow(
      /ck_projects__title/,
    );
  });

  it('rejects an unknown locale key', async () => {
    await expect(
      insertProject({ title: { 'pt-BR': 'Título', 'en-US': 'Title' } }),
    ).rejects.toThrow(/ck_projects__title/);
  });

  it('rejects a localized column missing pt-BR', async () => {
    await expect(insertProject({ title: { en: 'Title' } })).rejects.toThrow(
      /ck_projects__title/,
    );
  });

  it('rejects a localized value that is not an object', async () => {
    // Valid JSON, wrong shape — a bare string would fail jsonb parsing before
    // the CHECK ever ran, which would prove nothing about the constraint.
    await expect(insertProject({ title: '"Título"' })).rejects.toThrow(/ck_projects__title/);
    await expect(insertProject({ title: '["Título"]' })).rejects.toThrow(
      /ck_projects__title/,
    );
  });

  it('rejects a localized value whose entry is not a string', async () => {
    await expect(insertProject({ title: { 'pt-BR': 42 } })).rejects.toThrow(
      /ck_projects__title/,
    );
  });

  it('accepts a localized column with only pt-BR', async () => {
    await expect(insertProject({ title: { 'pt-BR': 'Só português' } })).resolves.toBeTypeOf(
      'string',
    );
  });

  it('rejects a category over its own, shorter budget', async () => {
    await expect(insertProject({ category: { 'pt-BR': 'a'.repeat(41) } })).rejects.toThrow(
      /ck_projects__category/,
    );
  });

  it('rejects more tags than the budget allows', async () => {
    await expect(
      insertProject({ tags: { 'pt-BR': Array.from({ length: 9 }, (_, i) => `t${i}`) } }),
    ).rejects.toThrow(/ck_projects__tags/);
  });

  it('rejects a tag over its length budget', async () => {
    await expect(insertProject({ tags: { 'pt-BR': ['a'.repeat(61)] } })).rejects.toThrow(
      /ck_projects__tags/,
    );
  });

  it('rejects tags that are not arrays', async () => {
    await expect(insertProject({ tags: { 'pt-BR': 'Java' } })).rejects.toThrow(
      /ck_projects__tags/,
    );
  });
});

describe('timeline_entries constraints', () => {
  async function insertEntry(
    columns: string,
    placeholders: string,
    values: unknown[],
  ): Promise<unknown> {
    return db
      .pool()
      .query(`INSERT INTO timeline_entries (${columns}) VALUES (${placeholders})`, values);
  }

  it('rejects an end date before the start date', async () => {
    await expect(
      insertEntry(
        'kind, title, organization, started_on, ended_on',
        `'professional', $1, 'Sea Tecnologia', '2026-01-10', '2026-01-01'`,
        [JSON.stringify(TITLE)],
      ),
    ).rejects.toThrow(/ck_timeline_entries__date_order/);
  });

  it('rejects an unknown kind', async () => {
    await expect(
      insertEntry(
        'kind, title, organization, started_on',
        `'internship', $1, 'Sea Tecnologia', '2026-01-10'`,
        [JSON.stringify(TITLE)],
      ),
    ).rejects.toThrow(/timeline_kind/);
  });

  it('rejects a description over its length budget', async () => {
    await expect(
      insertEntry(
        'kind, title, organization, description, started_on',
        `'professional', $1, 'Sea Tecnologia', $2, '2026-01-10'`,
        [JSON.stringify(TITLE), JSON.stringify({ 'pt-BR': 'a'.repeat(8001) })],
      ),
    ).rejects.toThrow(/ck_timeline_entries__description/);
  });
});

describe('join table constraints', () => {
  it('refuses to delete a skill a project still references', async () => {
    const projectId = await insertProject();
    const skillId = await insertSkill('Java');
    await db
      .pool()
      .query('INSERT INTO project_skill (project_id, skill_id) VALUES ($1, $2)', [
        projectId,
        skillId,
      ]);

    await expect(
      db.pool().query('DELETE FROM skills WHERE id = $1', [skillId]),
    ).rejects.toThrow(/fk_project_skill__skill/);
  });

  it('refuses to delete a skill a timeline entry still references', async () => {
    const { rows } = await db.pool().query<{ id: string }>(
      `INSERT INTO timeline_entries (kind, title, organization, started_on)
       VALUES ('professional', $1, 'Sea Tecnologia', '2025-12-01') RETURNING id`,
      [JSON.stringify(TITLE)],
    );
    const skillId = await insertSkill('Liferay');
    await db
      .pool()
      .query(
        'INSERT INTO timeline_entry_skill (timeline_entry_id, skill_id) VALUES ($1, $2)',
        [rows[0]!.id, skillId],
      );

    await expect(
      db.pool().query('DELETE FROM skills WHERE id = $1', [skillId]),
    ).rejects.toThrow(/fk_timeline_entry_skill__skill/);
  });

  it('drops the associations when the project itself is deleted', async () => {
    const projectId = await insertProject();
    const skillId = await insertSkill('Python');
    await db
      .pool()
      .query('INSERT INTO project_skill (project_id, skill_id) VALUES ($1, $2)', [
        projectId,
        skillId,
      ]);

    await db.pool().query('DELETE FROM projects WHERE id = $1', [projectId]);

    const { rowCount } = await db.pool().query('SELECT 1 FROM project_skill');
    expect(rowCount).toBe(0);
  });

  it('rejects a usage note over its length budget', async () => {
    const projectId = await insertProject();
    const skillId = await insertSkill('TypeScript');
    await expect(
      db
        .pool()
        .query(
          'INSERT INTO project_skill (project_id, skill_id, usage_note) VALUES ($1, $2, $3)',
          [projectId, skillId, JSON.stringify({ 'pt-BR': 'a'.repeat(241) })],
        ),
    ).rejects.toThrow(/ck_project_skill__usage_note/);
  });

  it('rejects a duplicate pairing', async () => {
    const projectId = await insertProject();
    const skillId = await insertSkill('Next.js');
    const pair = 'INSERT INTO project_skill (project_id, skill_id) VALUES ($1, $2)';
    await db.pool().query(pair, [projectId, skillId]);

    await expect(db.pool().query(pair, [projectId, skillId])).rejects.toThrow(
      /pk_project_skill/,
    );
  });
});

describe('skills constraints', () => {
  it('rejects a duplicate name', async () => {
    await insertSkill('Java');
    await expect(insertSkill('Java')).rejects.toThrow(/ux_skills__name/);
  });

  it('rejects an unknown category', async () => {
    await expect(
      db.pool().query(`INSERT INTO skills (name, category) VALUES ('COBOL', 'devops')`),
    ).rejects.toThrow(/skill_category/);
  });
});
