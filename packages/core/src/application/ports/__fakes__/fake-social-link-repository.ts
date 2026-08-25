import type { SocialLink } from '../../../domain/entities/social-link.ts';
import type { SocialLinkRepository } from '../social-link-repository.ts';

/**
 * In-memory `SocialLinkRepository` for use-case tests.
 *
 * It holds unpublished links too, and drops them in `listPublished` — which is
 * what makes "only published links reach the page" a fact a unit test can
 * establish without a database. Insertion order is deliberately arbitrary: the
 * use case owns the ordering contract, so a fake that pre-sorted would prove
 * nothing.
 */
export class FakeSocialLinkRepository implements SocialLinkRepository {
  private readonly links = new Map<string, SocialLink>();

  constructor(links: readonly SocialLink[] = []) {
    for (const link of links) {
      this.links.set(link.id, link);
    }
  }

  listPublished(): Promise<SocialLink[]> {
    return Promise.resolve([...this.links.values()].filter((link) => link.isPublished));
  }

  save(link: SocialLink): Promise<void> {
    this.links.set(link.id, link);
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    this.links.delete(id);
    return Promise.resolve();
  }
}
