import type { SocialLink } from '../../domain/entities/social-link.ts';

/**
 * Persistence for footer contacts, declared here and implemented by
 * `@portfolio/db` (clean-architecture.md § 5).
 *
 * `listPublished` takes no locale, because nothing on a `SocialLink` is
 * translated — and no ordering argument, because there is one order a footer
 * is ever read in. Which order that is stays the use case's contract; how it
 * is obtained is the repository's business.
 */
export interface SocialLinkRepository {
  listPublished(): Promise<SocialLink[]>;
  save(link: SocialLink): Promise<void>;
  delete(id: string): Promise<void>;
}
