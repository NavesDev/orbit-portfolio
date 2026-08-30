import type { ProjectCardView, Locale } from '@portfolio/core';
import Link from 'next/link';

import type { SiteContent } from '../../content/types';
import { GithubIcon } from '../ui/github-icon';
import * as PROJECT_VISUAL_CONSTANTS from './constants/project-visual';
import { ProgressBar } from './progress-bar';
import styles from './project-card.module.css';
import './project-visual.module.css';

/**
 * One project card (FR-05–FR-09).
 *
 * A Server Component: with the detail modal gone (roadmap 4.2 — "ver
 * detalhes" now navigates to `/[locale]/projetos/[slug]` instead of opening
 * one), the card itself holds no client state. Only `ProgressBar`, its one
 * interactive piece, declares `'use client'`.
 *
 * The eyebrow's ordinal is `ordinal`, a prop, not a field on `card` (U-6): it
 * is the project's position among the others on this render, computed by
 * `ProjectsSection` from array index, so reordering `sort_order` changes it
 * for free.
 *
 * `summary` is the opening paragraph of the project's description, resolved
 * by `toCardView` — plain text by the time it arrives here, so the card
 * renders it directly rather than reaching for the Markdown renderer the
 * detail page needs. Absent when the project has no description to open with.
 *
 * `card` is the whole of the card's data: every field rendered below comes
 * from it, `repoUrl` included, so nothing here reaches into the fuller
 * `ProjectDetailView` the project's own page is built from.
 */
export function ProjectCard({
  ordinal,
  card,
  content,
  locale,
}: {
  readonly ordinal: number;
  readonly card: ProjectCardView;
  readonly content: SiteContent['projects'];
  readonly locale: Locale;
}) {
  const eyebrow = `${ordinal
    .toString()
    .padStart(
      PROJECT_VISUAL_CONSTANTS.ORDINAL_PAD_LENGTH,
      PROJECT_VISUAL_CONSTANTS.ORDINAL_PAD_CHARACTER,
    )} — ${card.category ?? ''}`;

  return (
    <article className={styles.card}>
      {card.visualSvg === null ? null : (
        <div
          className={styles.visual}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: card.visualSvg }}
        />
      )}

      <div className={styles.meta}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h3 className={styles.title}>{card.title}</h3>

        {card.summary === null ? null : <p className={styles.summary}>{card.summary}</p>}

        <div className={styles.tags}>
          {card.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        {card.progressPercent === null ? null : (
          <ProgressBar percent={card.progressPercent} label={`${card.title}: ${card.progressPercent}%`} />
        )}

        <div className={styles.actions}>
          <Link href={`/${locale}/projetos/${card.slug}`} className={styles.detailsButton}>
            {content.detailsCta}
          </Link>

          {card.repoUrl === null ? null : (
            <a className={styles.repoLink} href={card.repoUrl} target="_blank" rel="noopener">
              <GithubIcon className={styles.repoIcon} />
              {content.repoCta}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
