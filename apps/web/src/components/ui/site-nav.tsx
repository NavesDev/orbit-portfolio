import type { Locale } from '@portfolio/core';

import { getContent } from '../../content/index';
import { LanguageSwitcher } from './language-switcher';
import { SectionIndex } from './section-index';
import styles from './site-nav.module.css';

const CONTENT_ANCHOR = '#content';

/**
 * The fixed nav (U-2 — no requirement names it; the prototype does).
 *
 * A Server Component: only the switcher and the index need the client, and
 * only they declare `'use client'`.
 */
export function SiteNav({ locale }: { readonly locale: Locale }) {
  const content = getContent(locale);

  return (
    <nav className={styles.nav}>
      <a href={CONTENT_ANCHOR} className={styles.skipLink}>
        {content.nav.skipToContent}
      </a>
      <span className={styles.mark}>
        <span className={styles.dot} aria-hidden="true" />
        {content.nav.mark}
      </span>
      <SectionIndex />
      <LanguageSwitcher locale={locale} content={content} />
    </nav>
  );
}
