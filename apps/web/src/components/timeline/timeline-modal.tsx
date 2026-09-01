'use client';

import type { TimelineEntryView } from '@portfolio/core';
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

import type { SiteContent } from '../../content/types';
import { formatPeriod } from '../../lib/timeline/period';
import styles from './timeline-modal.module.css';

/**
 * One entry's detail, in a dialog.
 *
 * A modal rather than a page, which is where this differs from a project (U-7
 * chose a page there). The difference is `slug`: a project has a canonical URL
 * worth sharing and worth keeping in browser history, and a timeline entry has
 * none — a page for it would have nothing to put in the address bar.
 *
 * A native `<dialog>` opened with `showModal()`, not a `div` with
 * `role="dialog"`. The browser then owns Escape-to-close, the focus trap and
 * the inert backdrop, which is three pieces of hand-written behaviour that
 * cannot drift (NFR-05). React's `onClose` fires for every route out — the
 * close button, Escape, and a form submission — so one handler covers them all.
 *
 * Returning focus to the trigger is done explicitly by the parent rather than
 * left to the browser's own restoration. Both happen; the explicit one is what
 * a component test can observe, and NFR-05 is a requirement, not an
 * implementation detail to take on trust.
 *
 * The description is rendered through `react-markdown` rather than
 * `dangerouslySetInnerHTML`, for the reason `project-detail.tsx` records: it
 * walks the parsed AST into React elements, so there is no HTML string to
 * sanitize. An entry with no description still opens — it has four other facts
 * to show, which is why the control appears on every card.
 */
export function TimelineModal({
  entry,
  content,
  onClose,
}: {
  readonly entry: TimelineEntryView;
  readonly content: SiteContent['timeline'];
  readonly onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClose={onClose} aria-label={entry.title}>
      <article className={styles.body}>
        <header className={styles.header}>
          <p className={styles.period}>{formatPeriod(entry, content.ongoing)}</p>
          <h2 className={styles.title}>{entry.title}</h2>
          <p className={styles.organization}>{entry.organization}</p>
        </header>

        {entry.description === null ? null : (
          <div className={styles.description}>
            <ReactMarkdown>{entry.description}</ReactMarkdown>
          </div>
        )}

        {entry.skills.length === 0 ? null : (
          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>{content.skillsHeading}</h3>
            <ul className={styles.skills}>
              {entry.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </section>
        )}

        {entry.credentialUrl === null ? null : (
          <a className={styles.credential} href={entry.credentialUrl} target="_blank" rel="noopener">
            {content.credentialCta}
          </a>
        )}

        <button
          type="button"
          className={styles.close}
          onClick={() => {
            dialogRef.current?.close();
          }}
        >
          {content.closeModal}
        </button>
      </article>
    </dialog>
  );
}
