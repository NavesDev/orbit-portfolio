import { isLocale } from '@portfolio/core';
import { notFound } from 'next/navigation';

import { StatBand } from '../../components/band/stat-band';
import { ClosingSection } from '../../components/footer/closing-section';
import { SocialLinks } from '../../components/footer/social-links';
import { Hero } from '../../components/hero/hero';
import { ProjectsSection } from '../../components/projects/projects-section';
import { TimelineSection } from '../../components/timeline/timeline-section';
import { CloudDrift } from '../../components/ui/cloud-drift';
import { getContent } from '../../content/index';
import { AVAILABLE_FOR_WORK } from '../../content/site';
import { listFeaturedProjects } from '../../lib/projects/projects-provider';
import { listSocialLinks } from '../../lib/social/social-links-provider';
import { resolveStatFigures } from '../../lib/stats/figures';
import * as TIMELINE_CONSTANTS from '../../lib/timeline/constants/timeline';
import { getTimelinePage } from '../../lib/timeline/timeline-provider';
import { createDeveloperStatsProvider } from '../../lib/stats/stats-provider';

/**
 * The home page.
 *
 * The composition root for this route: it reads the locale's copy, the
 * availability boolean and the clock, and hands each section plain data. The
 * sections themselves read nothing — which is what lets them be tested without
 * a locale, a constant or a date.
 *
 * The skills section arrives in its own sprint-1 task.
 * The cloud band is here because it belongs to the page's chrome, not to a
 * section, and it sits directly under the hero — where `CloudDrift`'s own
 * doc has always placed it — rather than above the stat band.
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
  const [figures, links, projects, timeline] = await Promise.all([
    resolveStatFigures(new Date(), createDeveloperStatsProvider()),
    listSocialLinks(),
    listFeaturedProjects(locale),
    getTimelinePage(locale, TIMELINE_CONSTANTS.FIRST_PAGE_OFFSET),
  ]);

  return (
    <>
      <main id="content">
        <Hero content={content.hero} available={AVAILABLE_FOR_WORK} />
        <CloudDrift />
        <ProjectsSection content={content.projects} result={projects} locale={locale} />
        <TimelineSection content={content.timeline} initial={timeline} locale={locale} />
        <StatBand content={content.band} figures={figures} locale={locale} />
        <ClosingSection content={content.closing} links={links} />
      </main>
      <SocialLinks links={links} label={content.closing.linksLabel} />
    </>
  );
}
