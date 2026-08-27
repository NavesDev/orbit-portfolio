import {
  LocalizedText,
  USAGE_NOTE_MAX_LENGTH,
  type Project,
  type ProjectRepository,
  type ProjectSkillUsage,
} from '@portfolio/core';

import { projectMapper, type ProjectRow } from '../mappers/project.mapper.ts';
import { BaseRepository, type Queryable } from './base.repository.ts';

const PROJECT_COLUMNS =
  'id, slug, title, category, description, tags, repo_url, live_url, progress_percent, ' +
  "started_on::text AS started_on, ended_on::text AS ended_on, visual_svg, is_featured, " +
  'is_published, sort_order';

interface ProjectSkillUsageRow {
  readonly name: string;
  readonly usage_note: unknown | null;
}

/**
 * `ProjectRepository` over PostgreSQL (FR-05).
 *
 * `listFeatured` filters `is_published` and `is_featured` in SQL — the same
 * shape as `PostgresSocialLinkRepository.listPublished` — and orders in SQL
 * too, even though `ListFeaturedProjects` re-sorts: the index on
 * `(is_published, is_featured, sort_order)` makes the `ORDER BY` free here,
 * while the use case's own sort is what makes the contract true for every
 * implementation, `FakeProjectRepository` included.
 *
 * `listSkillUsage` runs one query per project rather than one join across all
 * of them. At this project's scale — a handful of featured projects — the
 * extra round trips cost nothing worth avoiding, and keeping the query a
 * single, obvious `WHERE project_id = $1` is worth more than folding it into
 * `listFeatured`'s own query.
 *
 * `findPublishedBySlug` backs the project detail page (roadmap 4.2) and
 * checks only `is_published` — a project's own page exists whether or not it
 * is currently featured on the home page.
 */
export class PostgresProjectRepository extends BaseRepository implements ProjectRepository {
  constructor(db: Queryable) {
    super(db);
  }

  async listFeatured(): Promise<Project[]> {
    const rows = await this.rows<ProjectRow>(
      `SELECT ${PROJECT_COLUMNS}
         FROM projects
        WHERE is_published = true AND is_featured = true
        ORDER BY sort_order ASC, started_on DESC NULLS LAST`,
    );

    return rows.map((row) => projectMapper.toDomain(row));
  }

  async listSkillUsage(projectId: string): Promise<ProjectSkillUsage[]> {
    const rows = await this.rows<ProjectSkillUsageRow>(
      `SELECT s.name, ps.usage_note
         FROM project_skill ps
         JOIN skills s ON s.id = ps.skill_id
        WHERE ps.project_id = $1
        ORDER BY s.sort_order ASC`,
      [projectId],
    );

    return rows.map((row) => ({
      skillName: row.name,
      usageNote: row.usage_note === null ? null : LocalizedText.create(row.usage_note, USAGE_NOTE_MAX_LENGTH),
    }));
  }

  async findPublishedBySlug(slug: string): Promise<Project | null> {
    const rows = await this.rows<ProjectRow>(
      `SELECT ${PROJECT_COLUMNS}
         FROM projects
        WHERE slug = $1 AND is_published = true`,
      [slug],
    );

    const [row] = rows;

    return row === undefined ? null : projectMapper.toDomain(row);
  }
}
