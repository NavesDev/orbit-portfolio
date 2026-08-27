import { isLocale } from '@portfolio/core';
import { notFound } from 'next/navigation';

import { StatBand } from '../../components/band/stat-band';
import { ClosingSection } from '../../components/footer/closing-section';
import { SocialLinks } from '../../components/footer/social-links';
import { Hero } from '../../components/hero/hero';
import { CloudDrift } from '../../components/ui/cloud-drift';
import { getContent } from '../../content/index';
import { AVAILABLE_FOR_WORK } from '../../content/site';
import { listSocialLinks } from '../../lib/social/social-links-provider';
import { resolveStatFigures } from '../../lib/stats/figures';
import { createDeveloperStatsProvider } from '../../lib/stats/stats-provider';

/**
 * The home page.
 *
 * The composition root for this route: it reads the locale's copy, the
 * availability boolean and the clock, and hands each section plain data. The
 * sections themselves read nothing — which is what lets them be tested without
 * a locale, a constant or a date.
 *
 * The projects, timeline and skills sections each arrive in their own sprint-1
 * task. The cloud band is here because it belongs to the page's chrome, not to
 * a section.
 *
 * The footer sits outside `<main>` on purpose: `contentinfo` is a landmark of
 * the page, and a `<footer>` nested in `<main>` is scoped to it instead.
 */
export default async function HomePage({
  params,
}: {
  readonly params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const content = getContent(locale);
  const [figures, links] = await Promise.all([
    resolveStatFigures(new Date(), createDeveloperStatsProvider()),
    listSocialLinks(),
  ]);

  return (
    <>
      <main id="content">
        <Hero content={content.hero} available={AVAILABLE_FOR_WORK} />
        <CloudDrift />
        <StatBand content={content.band} figures={figures} locale={locale} />
        <ClosingSection content={content.closing} links={links} />
      </main>
      <SocialLinks links={links} label={content.closing.linksLabel} />
    </>
  );
}
