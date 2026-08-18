import type { Locale } from '@portfolio/core';

import { getContent } from '../../content/index';
import { LanguageSwitcher } from './language-switcher';
import { SectionIndex } from './section-index';
import styles from './site-nav.module.css';

const CONTENT_ANCHOR = '#content';

/**
 * The fixed site header (U-2 — no requirement names it; the prototype does).
 *
 * A `<header>`, not a `<nav>`: it carries a mark, a counter and the language
 * switcher, and the switcher is already a named navigation landmark. Nesting
 * that inside a second, unnamed `<nav>` would list two indistinguishable
 * navigations to a screen reader.
 *
 * The mark is the name, set in the same italic serif as the headline's
 * emphasis. Initials needed a legend nobody is given, and the dot beside them
 * was a bullet standing in for a mark.
 *
 * No cloud here, though the band below is full of them: the drawing is traced
 * artwork whose stroke is a fill, so at the 22px this line allows it washes
 * out and there is no line weight to raise. A wordmark that holds on its own
 * beats an icon that only works above 48px — see `cloud-path.ts`.
 *
 * A Server Component: only the switcher and the index need the client, and
 * only they declare `'use client'`.
 */
export function SiteNav({ locale }: { readonly locale: Locale }) {
  const content = getContent(locale);

  return (
    <header className={styles.nav}>
      <a href={CONTENT_ANCHOR} className={styles.skipLink}>
        {content.nav.skipToContent}
      </a>
      <span className={styles.mark} translate="no">
        {content.nav.mark}
      </span>
      <SectionIndex />
      <LanguageSwitcher locale={locale} content={content} />
    </header>
  );
}
