import type { ListFeaturedProjectsOutput, Locale } from '@portfolio/core';

import type { SiteContent } from '../../content/types';
import { PROJECTS_SECTION_ID } from '../ui/section-registry';
import { ProjectCard } from './project-card';
import styles from './projects-section.module.css';

/**
 * The featured-projects section (FR-05–FR-10, roadmap 3.5).
 *
 * A Server Component: `result` arrives already computed by
 * `listFeaturedProjects` in the page's composition root. Each card's "ver
 * detalhes" now navigates to `/${locale}/projetos/[slug]` (roadmap 4.2). The
 * "see all projects" link still points at `/${locale}/projetos`, the list
 * page — that one route remains out of scope, the same relationship
 * `ClosingSection` already has with `mailto:`, a link to a destination a
 * later task builds.
 */
export function ProjectsSection({
  content,
  result,
  locale,
}: {
  readonly content: SiteContent['projects'];
  readonly result: ListFeaturedProjectsOutput;
  readonly locale: Locale;
}) {
  return (
    <section id={PROJECTS_SECTION_ID} className={styles.section}>
      <div className={styles.head}>
        <p className={styles.kicker}>{content.kicker}</p>
        <h2 className={styles.heading}>{content.heading}</h2>
      </div>

      {result.projects.map((card, index) => (
        <ProjectCard
          key={card.slug}
          ordinal={index + 1}
          card={card}
          detail={result.details[card.slug]!}
          content={content}
          locale={locale}
        />
      ))}

      <a className={styles.viewAll} href={`/${locale}/projetos`}>
        {content.viewAll}
      </a>
    </section>
  );
}
