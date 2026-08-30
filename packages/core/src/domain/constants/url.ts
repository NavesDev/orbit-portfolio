/**
 * The shape of `projects.repo_url` and `.live_url` (data-model.md § 3):
 * `varchar(2048)`, absolute `https`.
 *
 * `https:` only, unlike `SocialLink`'s own check, which also allows `mailto:`
 * for the footer's e-mail link — nothing about a project points at an address.
 * `social-link.ts` keeps its inline check rather than being rewritten onto
 * this: its rule is narrower in a different way (`mailto:` allowed, a
 * relative path never), so sharing it would mean widening one case against
 * the other.
 */
export const MAX_LENGTH = 2048;

export const ALLOWED_SCHEMES: readonly string[] = ['https:'];
