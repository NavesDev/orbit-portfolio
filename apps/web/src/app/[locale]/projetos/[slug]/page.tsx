import { isLocale, LOCALES } from '@portfolio/core';
import { notFound } from 'next/navigation';

import { ProjectDetail } from '../../../../components/projects/project-detail';
import { getContent } from '../../../../content/index';
import { getProjectDetail, listFeaturedProjects } from '../../../../lib/projects/projects-provider';

/**
 * A project's own page (roadmap 4.2, pulled forward from Phase 4 into this
 * sprint — see sprint-01.md U-7).
 *
 * Static, same as the home page (NFR-01): `generateStaticParams` pre-renders
 * every featured project's slug in both locales, since those are the only
 * slugs anything in the UI currently links to — there is no `/projetos`
 * list page yet (roadmap 4.1) to reach an unfeatured one from. A slug outside
 * that set still resolves on demand rather than 404ing outright, so a
 * project that stops being featured keeps its page working.
 */
export const revalidate = 3600;

export async function generateStaticParams(): Promise<{ locale: string; slug: string }[]> {
  const params: { locale: string; slug: string }[] = [];

  for (const locale of LOCALES) {
    const { projects } = await listFeaturedProjects(locale);

    for (const project of projects) {
      params.push({ locale, slug: project.slug });
    }
  }

  return params;
}

export default async function ProjectDetailPage({
  params,
}: {
  readonly params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const detail = await getProjectDetail(locale, slug);

  if (detail === null) {
    notFound();
  }

  return <ProjectDetail detail={detail} content={getContent(locale).projects} locale={locale} />;
}
