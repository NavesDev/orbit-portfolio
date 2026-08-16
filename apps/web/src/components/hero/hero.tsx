import type { SiteContent } from '../../content/types';
import { HERO_SECTION_ID } from '../ui/section-registry';
import { AvailabilityBadge } from './availability-badge';
import styles from './hero.module.css';
import { ParticleField } from './particle-field';

/**
 * The hero (FR-01, FR-02, FR-03).
 *
 * A Server Component: the copy is static and the boolean is a constant, so
 * nothing here needs the client. Only the field does, and only it declares
 * `'use client'` — which is also what keeps NFR-02 true by construction, since
 * a Server Component cannot be pulled into the browser bundle by a child.
 *
 * Both the copy and the availability boolean arrive as props, from the page.
 * The composition root is where the two are read; this renders what it is
 * given.
 */
export function Hero({
  content,
  available,
}: {
  readonly content: SiteContent['hero'];
  readonly available: boolean;
}) {
  return (
    <section id={HERO_SECTION_ID} className={styles.hero}>
      <ParticleField />

      <div className={styles.content}>
        <AvailabilityBadge copy={content.availability} available={available} />
        <h1 className={styles.headline}>
          {content.headline.lead}
          <em className={styles.emphasis}>{content.headline.emphasis}</em>
          {content.headline.trail}
        </h1>
      </div>

      <p className={styles.cue}>
        <span className={styles.cueTrack} aria-hidden="true" />
        {content.scrollCue}
      </p>
    </section>
  );
}
