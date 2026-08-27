'use client';

import type { ProjectDetailView } from '@portfolio/core';
import { useEffect, type RefObject } from 'react';

import type { SiteContent } from '../../content/types';
import styles from './project-modal.module.css';

const ESCAPE_KEY = 'Escape';

/**
 * The project detail modal (FR-06–FR-10, NFR-05).
 *
 * Closing is two things, not one: `onClose` flips the parent's `open` state so
 * this component unmounts, and the unmount's own cleanup is what returns focus
 * to `returnFocusTo` — the button that opened it. Doing the refocus in the
 * `Escape` handler instead would miss the case where a mouse click on the
 * close button ends the same way; anchoring it to unmount makes every path
 * out of the modal return focus identically.
 *
 * `visualSvg` renders through `dangerouslySetInnerHTML`, which is safe
 * specifically because the string here has already passed `IconSvg.create` on
 * the server (`ListFeaturedProjects`) — nothing between that call and this
 * render is user input.
 */
export function ProjectModal({
  detail,
  content,
  onClose,
  returnFocusTo,
}: {
  readonly detail: ProjectDetailView;
  readonly content: SiteContent['projects'];
  readonly onClose: () => void;
  readonly returnFocusTo: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === ESCAPE_KEY) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      returnFocusTo.current?.focus();
    };
  }, [onClose, returnFocusTo]);

  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.card} role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
        <button type="button" className={styles.close} onClick={onClose}>
          {content.closeModal}
        </button>

        {detail.visualSvg === null ? null : (
          <div
            className={styles.visual}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: detail.visualSvg }}
          />
        )}

        {detail.category === null ? null : <p className={styles.kicker}>{detail.category}</p>}
        <h3 id="project-modal-title" className={styles.title}>
          {detail.title}
        </h3>

        {detail.description === null ? null : <p className={styles.description}>{detail.description}</p>}

        <section className={styles.section}>
          <h4 className={styles.sectionHeading}>{content.modalTagsHeading}</h4>
          <div className={styles.chips}>
            {detail.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h4 className={styles.sectionHeading}>{content.modalSkillsHeading}</h4>
          <div className={styles.chips}>
            {detail.skills.map((skill) => (
              <span key={skill.name} title={skill.usageNote ?? undefined}>
                {skill.name}
              </span>
            ))}
          </div>
        </section>

        {detail.repoUrl === null ? null : (
          <a className={styles.action} href={detail.repoUrl} target="_blank" rel="noopener">
            {content.repoCta}
          </a>
        )}
      </div>
    </div>
  );
}
