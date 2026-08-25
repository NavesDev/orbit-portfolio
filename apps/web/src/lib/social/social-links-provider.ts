import { ListSocialLinks, type SocialLinkView } from '@portfolio/core';
import { getPool, PostgresSocialLinkRepository } from '@portfolio/db';

/**
 * The footer's links, read from the database.
 *
 * The composition root for this slice: the only module in `apps/web` that
 * knows both that `SocialLinkRepository` exists and that PostgreSQL implements
 * it. Everything downstream receives `SocialLinkView[]` — plain strings — so
 * no component can reach a pool (NFR-02).
 *
 * Server-only by construction: `@portfolio/db` is imported here and nowhere
 * else in the page's tree, and this module is called from a Server Component.
 */
export async function listSocialLinks(): Promise<readonly SocialLinkView[]> {
  const useCase = new ListSocialLinks(new PostgresSocialLinkRepository(getPool()));
  const { links } = await useCase.execute();

  return links;
}
