import type { SocialLink, SocialLinkRepository } from '@portfolio/core';

import { socialLinkMapper, type SocialLinkRow } from '../mappers/social-link.mapper.ts';
import { BaseRepository, type Queryable } from './base.repository.ts';

const COLUMNS = 'id, platform, url, icon_svg, is_published, sort_order';

/**
 * `SocialLinkRepository` over PostgreSQL (FR-23).
 *
 * The `ORDER BY` repeats the ordering the use case also applies. That is not
 * redundancy by accident: the index is `(is_published, sort_order)`, so sorting
 * in SQL is free here, while the use case's sort is what makes the contract
 * true for every implementation of the port — including the in-memory fake the
 * unit tests run against.
 */
export class PostgresSocialLinkRepository extends BaseRepository implements SocialLinkRepository {
  constructor(db: Queryable) {
    super(db);
  }

  async listPublished(): Promise<SocialLink[]> {
    const rows = await this.rows<SocialLinkRow>(
      `SELECT ${COLUMNS}
         FROM social_links
        WHERE is_published = true
        ORDER BY sort_order ASC, platform ASC`,
    );

    return rows.map((row) => socialLinkMapper.toDomain(row));
  }

  async save(link: SocialLink): Promise<void> {
    const row = socialLinkMapper.toRow(link);

    await this.execute(
      `INSERT INTO social_links (${COLUMNS})
            VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE
              SET platform = EXCLUDED.platform,
                  url = EXCLUDED.url,
                  icon_svg = EXCLUDED.icon_svg,
                  is_published = EXCLUDED.is_published,
                  sort_order = EXCLUDED.sort_order,
                  updated_at = now()`,
      [row.id, row.platform, row.url, row.icon_svg, row.is_published, row.sort_order],
    );
  }

  async delete(id: string): Promise<void> {
    await this.execute('DELETE FROM social_links WHERE id = $1', [id]);
  }
}
