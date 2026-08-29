/**
 * One card of the featured-projects section, as presentation receives it
 * (NFR-13).
 *
 * Plain strings and numbers only — no `LocalizedText`, no `Slug`, no
 * `IconSvg`, no entity. `slug` is a string here because it doubles as the
 * lookup key into `ListFeaturedProjectsOutput.details` and as the `key` prop
 * a list of cards renders with.
 */
export interface ProjectCardView {
  readonly slug: string;
  readonly title: string;
  /**
   * A single line of prose for the card — the opening paragraph of
   * `description`, or `null` when there is no description or it opens
   * straight into a list. Plain text, not Markdown: see `toCardView`.
   */
  readonly summary: string | null;
  /** `null` when the project has no category (data-model.md § 3 — nullable). */
  readonly category: string | null;
  readonly tags: readonly string[];
  /** `null` when there is nothing to show a bar for (FR-07). */
  readonly progressPercent: number | null;
  /** Sanitized SVG markup, or `null` when the project has none (U-5). */
  readonly visualSvg: string | null;
}
