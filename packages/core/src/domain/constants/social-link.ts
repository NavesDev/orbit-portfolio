/**
 * The budgets and schemes a `SocialLink` is held to, from `data-model.md § 1`.
 *
 * The two lengths mirror `varchar(40)` and `varchar(2048)` on the table. They
 * live here for the same reason the localized budgets do: the column is the
 * second line of defence, not the definition (NFR-10's rationale, applied to a
 * field that happens not to be translated).
 */
export const PLATFORM_MAX_LENGTH = 40;
export const URL_MAX_LENGTH = 2048;

/**
 * What a footer link may point at.
 *
 * `mailto:` is on the list because WN-04 makes the e-mail address a link
 * rather than a form, so the contact link is a social link like any other.
 * Everything else — `javascript:`, `data:`, a bare relative path — is refused:
 * these anchors are rendered from database rows, and a row is not a place a
 * scheme should be able to arrive from unchecked.
 */
export const ALLOWED_URL_SCHEMES: readonly string[] = ['https:', 'http:', 'mailto:'];
