'use client';

import { DEFAULT_LOCALE, isLocale } from '@portfolio/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { getContent } from '../../content/index';
import styles from './locale-not-found.module.css';

/**
 * The locale-aware 404 (roadmap 4.3) — an unknown path under an already
 * resolved `[locale]` segment, such as an unpublished or nonexistent project
 * slug. `[locale]/layout.tsx` still wraps this (its `<html lang>`, `SiteNav`
 * and styles all apply), which is what a genuinely unmatched URL does not
 * get — that case falls through to `app/not-found.tsx` instead.
 *
 * A Client Component: `not-found.js` receives no props, `params` included, so
 * the only way to recover the locale this file is nested under is to read the
 * URL itself. That this segment matched at all is what makes doing so safe —
 * `[locale]/layout.tsx` already rejected any first segment that is not a real
 * locale before this file could ever render.
 *
 * Its stylesheet is `locale-not-found.module.css`, not `not-found.module.css`
 * — Turbopack's file-convention scanner matches on the `not-found` prefix
 * regardless of extension, so a same-named CSS Module sitting beside this
 * file gets swallowed as if it were another special file and never resolves
 * as an importable module.
 */
export default function LocaleNotFound() {
  const pathname = usePathname();
  const [, firstSegment] = pathname.split('/');
  const candidate = firstSegment ?? '';
  const locale = isLocale(candidate) ? candidate : DEFAULT_LOCALE;
  const content = getContent(locale).notFound;

  return (
    <main id="content" className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={styles.heading}>{content.heading}</h1>
      <p className={styles.body}>{content.body}</p>
      <Link href={`/${locale}`} className={styles.action}>
        {content.backCta}
      </Link>
    </main>
  );
}
