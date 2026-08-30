import type { Locale, ProjectDetailView } from '@portfolio/core';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

import type { SiteContent } from '../../content/types';
import { GithubIcon } from '../ui/github-icon';
import styles from './project-detail.module.css';
import './project-visual.module.css';

/**
 * A project's own page (roadmap 4.2), reached from its card's "ver detalhes".
 *
 * A Server Component — nothing here is interactive, unlike the modal it
 * replaces. `description` is Markdown (data-model.md § 3) and is rendered
 * through `react-markdown` rather than `dangerouslySetInnerHTML`: it walks the
 * parsed Markdown AST straight into React elements, so there is no HTML
 * string to sanitize in the first place, which is a stronger guarantee than
 * "sanitized" for content that ultimately comes from a database row.
 *
 * The eyebrow's ordinal (U-6) is deliberately absent here — it names a
 * project's position among the others on the *section*, which this page is
 * not part of.
 */
export function ProjectDetail({
  detail,
  content,
  locale,
}: {
  readonly detail: ProjectDetailView;
  readonly content: SiteContent['projects'];
  readonly locale: Locale;
}) {
  return (
    <main id="content" className={styles.page}>
      <Link href={`/${locale}`} className={styles.back}>
        {content.backCta}
      </Link>

      {detail.visualSvg === null ? null : (
        <div
          className={styles.visual}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: detail.visualSvg }}
        />
      )}

      {detail.category === null ? null : <p className={styles.kicker}>{detail.category}</p>}
      <h1 className={styles.title}>{detail.title}</h1>

      {detail.description === null ? null : (
        <div className={styles.description}>
          <ReactMarkdown>{detail.description}</ReactMarkdown>
        </div>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>{content.tagsHeading}</h2>
        <div className={styles.chips}>
          {detail.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>{content.skillsHeading}</h2>
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
          <GithubIcon className={styles.actionIcon} />
          {content.repoCta}
        </a>
      )}
    </main>
  );
}
