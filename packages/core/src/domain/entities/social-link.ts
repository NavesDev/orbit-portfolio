import * as SOCIAL_LINK_CONSTANTS from '../constants/social-link.ts';
import {
  InvalidSocialLinkError,
  SOCIAL_LINK_VIOLATIONS,
} from '../errors/invalid-social-link-error.ts';
import { IconSvg } from '../value-objects/icon-svg.ts';
import { Entity, type EntityProperties } from './entity.ts';

const ALLOWED_URL_SCHEMES = new Set(SOCIAL_LINK_CONSTANTS.ALLOWED_URL_SCHEMES);

export interface SocialLinkProperties extends EntityProperties {
  readonly platform: string;
  readonly url: string;
  readonly iconSvg: IconSvg;
  readonly isPublished: boolean;
  readonly sortOrder: number;
}

/**
 * A footer contact (FR-23, FR-24).
 *
 * A standalone aggregate root — it references nothing and nothing references
 * it. Nothing on it is translated: `platform` is a proper noun that doubles as
 * the link's accessible name, and a URL has no language.
 *
 * The id and equality come from `Entity`; everything below is what makes this
 * one a social link rather than an entity in general.
 *
 * **The URL is validated here rather than by a `Url` value object.** The
 * generic one belongs to the project slice, where `repo_url` and `live_url`
 * make three call sites for it. Here the rule is narrower than a URL in
 * general — `mailto:` is allowed and a relative path is not — so pulling the
 * shared abstraction forward would mean writing it against one case and then
 * widening it against the next.
 */
export class SocialLink extends Entity<SocialLinkProperties> {
  private constructor(properties: SocialLinkProperties) {
    super(properties);
  }

  static create(properties: SocialLinkProperties): SocialLink {
    requirePresent(
      properties.platform,
      SOCIAL_LINK_VIOLATIONS.MISSING_PLATFORM,
      'A social link needs a platform — it is what names the link for a screen reader.',
    );

    if (properties.platform.length > SOCIAL_LINK_CONSTANTS.PLATFORM_MAX_LENGTH) {
      throw new InvalidSocialLinkError(
        SOCIAL_LINK_VIOLATIONS.PLATFORM_OVER_BUDGET,
        `A platform exceeds its budget of ${SOCIAL_LINK_CONSTANTS.PLATFORM_MAX_LENGTH} characters.`,
      );
    }

    requireUrl(properties.url);

    if (!Number.isInteger(properties.sortOrder)) {
      throw new InvalidSocialLinkError(
        SOCIAL_LINK_VIOLATIONS.SORT_ORDER_NOT_AN_INTEGER,
        'A sort order must be an integer.',
      );
    }

    return new SocialLink({ ...properties, platform: properties.platform.trim() });
  }

  /** Also the link's accessible name (FR-24). */
  get platform(): string {
    return this.properties.platform;
  }

  get url(): string {
    return this.properties.url;
  }

  get iconSvg(): IconSvg {
    return this.properties.iconSvg;
  }

  get isPublished(): boolean {
    return this.properties.isPublished;
  }

  get sortOrder(): number {
    return this.properties.sortOrder;
  }
}

function requirePresent(
  value: string,
  violation: (typeof SOCIAL_LINK_VIOLATIONS)[keyof typeof SOCIAL_LINK_VIOLATIONS],
  message: string,
): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new InvalidSocialLinkError(violation, message);
  }
}

function requireUrl(url: string): void {
  requirePresent(url, SOCIAL_LINK_VIOLATIONS.MISSING_URL, 'A social link needs a URL.');

  if (url.length > SOCIAL_LINK_CONSTANTS.URL_MAX_LENGTH) {
    throw new InvalidSocialLinkError(
      SOCIAL_LINK_VIOLATIONS.URL_OVER_BUDGET,
      `A URL exceeds its budget of ${SOCIAL_LINK_CONSTANTS.URL_MAX_LENGTH} characters.`,
    );
  }

  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new InvalidSocialLinkError(
      SOCIAL_LINK_VIOLATIONS.URL_NOT_ABSOLUTE,
      `"${url}" is not an absolute URL.`,
    );
  }

  if (!ALLOWED_URL_SCHEMES.has(parsed.protocol)) {
    throw new InvalidSocialLinkError(
      SOCIAL_LINK_VIOLATIONS.URL_SCHEME_NOT_ALLOWED,
      `"${parsed.protocol}" is not a scheme a social link may use.`,
    );
  }
}
