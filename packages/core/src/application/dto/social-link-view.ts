/**
 * One footer link, as presentation receives it.
 *
 * Three strings and nothing else: no `IconSvg`, no entity, no id. A Client
 * Component must receive plain serializable data (NFR-13), and this is also
 * the boundary that keeps `sort_order` and `is_published` — decisions the use
 * case has already made — from reaching a component that could second-guess
 * them.
 *
 * `iconSvg` is markup here because it has passed `IconSvg`, and passing it is
 * the only way an instance exists.
 */
export interface SocialLinkView {
  /** The link's accessible name (FR-24). */
  readonly platform: string;
  readonly url: string;
  readonly iconSvg: string;
}
