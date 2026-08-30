/**
 * The shape of a project's slug (data-model.md § 3): `varchar(120)`, single
 * and untranslated across locales because it is also the URL segment.
 *
 * Lowercase letters, digits and single hyphens only — anything a URL would
 * need to percent-encode is refused here rather than encoded, so a slug reads
 * identically whether it is quoted from a database row or from an address bar.
 */
export const MAX_LENGTH = 120;

export const PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
