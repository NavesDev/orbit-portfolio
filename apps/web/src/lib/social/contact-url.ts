import type { SocialLinkView } from '@portfolio/core';

/** The scheme that makes a social link an e-mail address (WN-04). */
const MAILTO_SCHEME = 'mailto:';

/**
 * Which link the closing section's call to action points at.
 *
 * The prototype's button has `href="#"` — a dead control, because nothing in
 * it knew the address. The address is a `social_links` row, so the CTA reuses
 * the e-mail link rather than duplicating it into `content/`: changing the
 * contact address stays one row, not a row and two translations.
 *
 * A presentation decision and not a use case: which of the footer's links the
 * headline's button borrows is a question about this section's layout, and
 * `ListSocialLinks` would have to grow an opinion about the CTA to answer it.
 *
 * `null` when no e-mail link is published — the section then renders no
 * button, the same rule FR-09 states for a project without a repository: omit
 * the control rather than render a dead one.
 */
export function findContactUrl(links: readonly SocialLinkView[]): string | null {
  return links.find((link) => link.url.toLowerCase().startsWith(MAILTO_SCHEME))?.url ?? null;
}
