import type { PoolClient } from 'pg';
import { seedContent } from '../data.ts';
import { seedId } from '../ids.ts';
import type { SeedStrategy } from './seed-strategy.ts';

export class SocialLinksSeedStrategy implements SeedStrategy {
  readonly table = 'social_links';

  async run(client: PoolClient): Promise<void> {
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
}
