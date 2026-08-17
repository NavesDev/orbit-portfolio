import styles from './skeleton.module.css';

/** A pill by default: the shape reads as "a value", not as a cropped box. */
const DEFAULT_RADIUS = '999px';

/**
 * A placeholder standing in for content that is not there.
 *
 * **Absence, not loading.** Every use of this so far is on a statically
 * generated page: the markup was rendered when the value could not be had, and
 * the same HTML is served until the next revalidation, so nothing is on its
 * way. That is why the sheen crosses it over three seconds rather than the
 * half-second a loading shimmer takes — at this pace it reads as idle instead
 * of promising an arrival. A caller that really is waiting on something should
 * say so in its own copy rather than by speeding this up.
 *
 * Size is the caller's decision and arrives as CSS lengths, so a figure can
 * ask for `2.4ch` and a text line for `100%` without this component knowing
 * what either is. Callers name their own measurements; nothing here is a
 * default that happens to suit one screen.
 *
 * `label` is what a screen reader hears in place of the missing content. With
 * none, the skeleton is decoration and leaves the accessibility tree — silence
 * is right for a placeholder nobody was told to expect, and wrong for one that
 * replaces a figure the page named.
 */
export function Skeleton({
  width,
  height,
  radius = DEFAULT_RADIUS,
  label,
}: {
  /** Any CSS length: `2.4ch`, `100%`, `48px`. */
  readonly width: string;
  readonly height: string;
  readonly radius?: string;
  readonly label?: string | undefined;
}) {
  return (
    <span
      className={styles.skeleton}
      style={{ width, height, borderRadius: radius }}
      {...(label === undefined ? { 'aria-hidden': true } : {})}
    >
      {label === undefined ? null : <span className={styles.hidden}>{label}</span>}
    </span>
  );
}
