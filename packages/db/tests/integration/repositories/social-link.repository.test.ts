import { IconSvg, SocialLink } from '@portfolio/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { socialLinkMapper } from '../../../src/mappers/social-link.mapper.ts';
import { PostgresSocialLinkRepository } from '../../../src/repositories/postgres-social-link.repository.ts';
import { withScratchDatabase } from '../../helpers/scratch-database.ts';

const { pool } = withScratchDatabase();

const ICON = IconSvg.create(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"' +
    ' stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/></svg>',
);

function link(
  platform: string,
  sortOrder: number,
  isPublished = true,
  url = `https://example.com/${platform}`,
): SocialLink {
  return SocialLink.create({
    id: `00000000-0000-4000-8000-0000000000${sortOrder.toString().padStart(2, '0')}`,
    platform,
    url,
    iconSvg: ICON,
    isPublished,
    sortOrder,
  });
}

function repository(): PostgresSocialLinkRepository {
  return new PostgresSocialLinkRepository(pool());
}

beforeEach(async () => {
  await pool().query('DELETE FROM social_links');
});

describe('PostgresSocialLinkRepository', () => {
  it('returns published links in sort_order', async () => {
    const repo = repository();
    await repo.save(link('email', 2, true, 'mailto:someone@example.com'));
    await repo.save(link('github', 0));
    await repo.save(link('linkedin', 1));

    const found = await repo.listPublished();

    expect(found.map((row) => row.platform)).toEqual(['github', 'linkedin', 'email']);
  });

  it('leaves an unpublished link out of the footer', async () => {
    const repo = repository();
    await repo.save(link('github', 0));
    await repo.save(link('mastodon', 1, false));

    expect((await repo.listPublished()).map((row) => row.platform)).toEqual(['github']);
  });

  it('round-trips an entity through the row and back', async () => {
    const repo = repository();
    const original = link('github', 0);

    await repo.save(original);
    const [reloaded] = await repo.listPublished();

    expect(reloaded).toBeDefined();
    expect(socialLinkMapper.toRow(reloaded!)).toEqual(socialLinkMapper.toRow(original));
  });

  it('updates in place rather than inserting a second row', async () => {
    const repo = repository();
    await repo.save(link('github', 0));
    await repo.save(link('github', 0, true, 'https://github.com/someone-else'));

    const found = await repo.listPublished();

    expect(found).toHaveLength(1);
    expect(found[0]?.url).toBe('https://github.com/someone-else');
  });

  it('deletes a link by id', async () => {
    const repo = repository();
    const removed = link('github', 0);
    await repo.save(removed);

    await repo.delete(removed.id);

    expect(await repo.listPublished()).toEqual([]);
  });

  /*
   * The mapper is the sanitization boundary (NFR-07), and a row is reachable
   * by hand — `psql`, a migration, a future admin tool. A stored handler must
   * fail on the way out, not in the browser.
   */
  it('refuses to load a row whose icon carries an event handler', async () => {
    await pool().query(
      `INSERT INTO social_links (id, platform, url, icon_svg, is_published, sort_order)
            VALUES ($1, $2, $3, $4, true, 0)`,
      [
        '00000000-0000-4000-8000-0000000000ff',
        'github',
        'https://github.com/NavesDev',
        '<svg onload="alert(1)"><path d="M0 0"/></svg>',
      ],
    );

    await expect(repository().listPublished()).rejects.toThrow(/event handler/i);
  });
});
