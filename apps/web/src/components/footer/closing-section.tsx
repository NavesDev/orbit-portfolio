import type { SocialLinkView } from '@portfolio/core';

import type { SiteContent } from '../../content/types';
import { findContactUrl } from '../../lib/social/contact-url';
import { CLOSING_SECTION_ID } from '../ui/section-registry';
import { ClosingOrb } from './closing-orb';
import styles from './closing-section.module.css';

/**
 * The closing section (OQ-04, WN-04).
 *
 * A Server Component. The copy arrives as props and the links arrive already
 * resolved to plain strings, so nothing here reads a locale, a constant or a
 * database — the page does that once, and this renders what it is handed.
 *
 * The call to action points at the published e-mail link. With none published
 * the button is not rendered: a contact section with a dead control is worse
 * than one that only offers the links it has.
 *
 * The links themselves are a sibling `<footer>` rather than a child of this
 * section. A `<footer>` nested inside a `<section>` is not the page's
 * `contentinfo` landmark — it is scoped to that section — so nesting them
 * would cost a screen-reader user the landmark they use to jump to a site's
 * contact details.
 */
export function ClosingSection({
  content,
  links,
}: {
  readonly content: SiteContent['closing'];
  readonly links: readonly SocialLinkView[];
}) {
  const contactUrl = findContactUrl(links);

  return (
    <section id={CLOSING_SECTION_ID} className={styles.closing}>
      <ClosingOrb />

      <h2 className={styles.headline}>
        {content.headline.lead}
        <em className={styles.emphasis}>{content.headline.emphasis}</em>
        {content.headline.trail}
      </h2>

      {contactUrl === null ? null : (
        <a className={styles.action} href={contactUrl}>
          {content.action}
          <svg
            className={styles.arrow}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      )}
    </section>
  );
}
