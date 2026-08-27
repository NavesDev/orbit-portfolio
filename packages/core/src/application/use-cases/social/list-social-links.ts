import type { SocialLink } from '../../../domain/entities/social-link.ts';
import type { SocialLinkView } from '../../dto/social-link-view.ts';
import type { SocialLinkRepository } from '../../ports/social-link-repository.ts';

export interface ListSocialLinksOutput {
  readonly links: readonly SocialLinkView[];
}

/**
 * The footer's links, in the order the footer lays them out (FR-23).
 *
 * **No locale.** Every other use case in this project takes one; this is the
 * one whose data has no language, and taking a `Locale` it would ignore would
 * suggest otherwise to every future caller.
 *
 * The ordering lives here rather than only in the `ORDER BY`, because the
 * order links are read in is a statement about the footer, not about how rows
 * happen to come back — clean-architecture.md § 3, "Application specifies,
 * Infrastructure executes". A repository that forgot its `ORDER BY` is a
 * performance bug, not a rendering one.
 */
export class ListSocialLinks {
  constructor(private readonly repository: SocialLinkRepository) {}

  async execute(): Promise<ListSocialLinksOutput> {
    const links = await this.repository.listPublished();

    return { links: [...links].sort(bySortOrder).map(toView) };
  }
}

/**
 * `sort_order` first, then `platform` — the tiebreak matters: two links sharing
 * an order would otherwise render in whatever order the driver returned them,
 * so the footer could reshuffle itself between two builds of identical data.
 */
function bySortOrder(left: SocialLink, right: SocialLink): number {
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }

  return left.platform.localeCompare(right.platform);
}

function toView(link: SocialLink): SocialLinkView {
  return {
    platform: link.platform,
    url: link.url,
    iconSvg: link.iconSvg.toString(),
  };
}
