import { describe, expect, it } from 'vitest';

import { SocialLink } from '../../../domain/entities/social-link.ts';
import { IconSvg } from '../../../domain/value-objects/icon-svg.ts';
import { FakeSocialLinkRepository } from '../../ports/__fakes__/fake-social-link-repository.ts';
import { ListSocialLinks } from './list-social-links.ts';

const ICON = IconSvg.create('<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>');

function link(platform: string, sortOrder: number, isPublished = true): SocialLink {
  return SocialLink.create({
    id: `id-${platform}`,
    platform,
    url: `https://example.com/${platform}`,
    iconSvg: ICON,
    isPublished,
    sortOrder,
  });
}

function useCase(links: SocialLink[]): ListSocialLinks {
  return new ListSocialLinks(new FakeSocialLinkRepository(links));
}

describe('ListSocialLinks', () => {
  it('orders links by sort_order regardless of the order they arrive in', async () => {
    const { links } = await useCase([link('email', 2), link('github', 0), link('linkedin', 1)])
      .execute();

    expect(links.map((view) => view.platform)).toEqual(['github', 'linkedin', 'email']);
  });

  it('never returns an unpublished link (FR-28)', async () => {
    const { links } = await useCase([link('github', 0), link('mastodon', 1, false)]).execute();

    expect(links.map((view) => view.platform)).toEqual(['github']);
  });

  it('breaks a tie on platform, so identical data renders identically', async () => {
    const { links } = await useCase([link('linkedin', 0), link('github', 0)]).execute();

    expect(links.map((view) => view.platform)).toEqual(['github', 'linkedin']);
  });

  it('hands presentation plain strings, not value objects (NFR-13)', async () => {
    const [view] = (await useCase([link('github', 0)]).execute()).links;

    expect(view).toEqual({
      platform: 'github',
      url: 'https://example.com/github',
      iconSvg: ICON.toString(),
    });
  });

  it('returns nothing when there are no published links', async () => {
    expect((await useCase([]).execute()).links).toEqual([]);
  });
});
