import { IconSvg, SocialLink } from '@portfolio/core';

/**
 * The `social_links` row, exactly as the driver returns it.
 *
 * `snake_case` because that is what the column is called: renaming happens in
 * `toDomain` and nowhere else, so there is one place to look when a column and
 * a property disagree.
 */
export interface SocialLinkRow {
  readonly id: string;
  readonly platform: string;
  readonly url: string;
  readonly icon_svg: string;
  readonly is_published: boolean;
  readonly sort_order: number;
}

/**
 * Row ⇄ entity for `social_links`.
 *
 * **The read direction is where sanitization happens.** `icon_svg` comes back
 * as text, and `IconSvg.create` is what turns it into something the page may
 * render — so a row edited by hand into carrying a handler fails here, at the
 * boundary, rather than in the browser. The `CHECK` constraints on the table
 * are the second line of defence; this is the first (NFR-07).
 */
export const socialLinkMapper = {
  toDomain(row: SocialLinkRow): SocialLink {
    return SocialLink.create({
      id: row.id,
      platform: row.platform,
      url: row.url,
      iconSvg: IconSvg.create(row.icon_svg),
      isPublished: row.is_published,
      sortOrder: row.sort_order,
    });
  },

  toRow(link: SocialLink): SocialLinkRow {
    return {
      id: link.id,
      platform: link.platform,
      url: link.url,
      icon_svg: link.iconSvg.toString(),
      is_published: link.isPublished,
      sort_order: link.sortOrder,
    };
  },
};
