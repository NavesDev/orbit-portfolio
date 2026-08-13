import { isLocale, LOCALES } from '@portfolio/core';
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { ScrollProgress } from '../../components/ui/scroll-progress';
import { SiteNav } from '../../components/ui/site-nav';
import '../../styles/tokens.css';
import '../../styles/globals.css';
import { interTight, newsreader } from '../fonts';

/**
 * NFR-01: both locales are built statically and revalidated on a timer.
 *
 * A literal, not a named constant: Next reads the segment config exports by
 * static analysis at build time and rejects a value it has to follow through
 * an identifier. This is the one place the no-magic-numbers rule gives way,
 * because the framework will not accept the alternative.
 */
export const revalidate = 3600;

/** A segment outside `LOCALES` is a 404, not a locale to guess at. */
export const dynamicParams = false;

/**
 * The design is light-only, and saying so is not decoration: without
 * `colorScheme` a visitor whose OS is dark gets dark native scrollbars and form
 * controls against a `#FAFAF8` page. `themeColor` matches `--bg` so the browser
 * chrome does not band against it on mobile.
 */
export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#fafaf8',
};

export const metadata: Metadata = {
  title: 'Davi Naves',
};

export function generateStaticParams(): { locale: string }[] {
  return LOCALES.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
}

/**
 * The real root of the site.
 *
 * `<html>` and `<body>` live here rather than in `app/layout.tsx` because
 * `lang` must be the resolved locale, and only this layout knows it.
 */
export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <html lang={locale} className={`${interTight.variable} ${newsreader.variable}`}>
      <body>
        <ScrollProgress />
        <SiteNav locale={locale} />
        {children}
      </body>
    </html>
  );
}
