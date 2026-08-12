'use client';

import { LOCALES, type Locale } from '@portfolio/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { SiteContent } from '../../content/types';
import { serializeLocaleCookie } from '../../lib/locale/locale-cookie';
import { swapLocale } from '../../lib/locale/swap-locale';
import styles from './language-switcher.module.css';

interface LanguageSwitcherProps {
  readonly locale: Locale;
  readonly content: SiteContent;
}

/**
 * Links, not buttons (FR-33).
 *
 * A link works without JavaScript, is keyboard-operable and focusable without
 * being made so, and carries the language in a URL that can be shared. The
 * cookie is written on the way out so the choice outranks `Accept-Language` on
 * the next visit to `/`.
 */
export function LanguageSwitcher({ locale, content }: LanguageSwitcherProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={content.languageSwitcher.label} className={styles.switcher}>
      {LOCALES.map((target) => (
        <Link
          key={target}
          href={swapLocale(pathname, target)}
          hrefLang={target}
          aria-label={content.languageSwitcher.localeNames[target]}
          aria-current={target === locale ? 'true' : undefined}
          className={styles.link}
          onClick={() => {
            document.cookie = serializeLocaleCookie(target);
          }}
        >
          {content.languageSwitcher.localeLabels[target]}
        </Link>
      ))}
    </nav>
  );
}
