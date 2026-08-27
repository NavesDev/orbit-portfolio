'use client';

import type { ProjectCardView, ProjectDetailView } from '@portfolio/core';
import { useRef, useState } from 'react';

import type { SiteContent } from '../../content/types';
import { GithubIcon } from '../ui/github-icon';
import * as PROJECT_VISUAL_CONSTANTS from './constants/project-visual';
import { ProgressBar } from './progress-bar';
import { ProjectModal } from './project-modal';
import styles from './project-card.module.css';
import './project-visual.module.css';

/**
 * One project card (FR-05–FR-09).
 *
 * A Client Component, not split further, because its two interactive pieces —
 * the progress bar's once-only animation and the detail modal's open/close and
 * focus-return state — are both listed as Client Component categories
 * (`monorepo.md`: "hero canvas, skills orbit, modals") and share this card as
 * their one caller.
 *
 * The eyebrow's ordinal is `ordinal`, a prop, not a field on `card` (U-6): it
 * is the project's position among the others on this render, computed by
 * `ProjectsSection` from array index, so reordering `sort_order` changes it
 * for free.
 */
export function ProjectCard({
  ordinal,
  card,
  detail,
  content,
}: {
  readonly ordinal: number;
  readonly card: ProjectCardView;
  readonly detail: ProjectDetailView;
  readonly content: SiteContent['projects'];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

        <div className={styles.tags}>
          {card.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        {card.progressPercent === null ? null : (
          <ProgressBar percent={card.progressPercent} label={`${card.title}: ${card.progressPercent}%`} />
        )}

        <div className={styles.actions}>
          <button
            type="button"
            ref={triggerRef}
            className={styles.detailsButton}
            onClick={() => setIsOpen(true)}
          >
            {content.detailsCta}
          </button>

          {detail.repoUrl === null ? null : (
            <a className={styles.repoLink} href={detail.repoUrl} target="_blank" rel="noopener">
              <GithubIcon className={styles.repoIcon} />
              {content.repoCta}
            </a>
          )}
        </div>
      </div>

      {isOpen ? (
        <ProjectModal
          detail={detail}
          content={content}
          onClose={() => setIsOpen(false)}
          returnFocusTo={triggerRef}
        />
      ) : null}
    </article>
  );
}
