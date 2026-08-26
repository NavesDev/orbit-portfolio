import type { SocialLinkView } from '@portfolio/core';

import styles from './social-links.module.css';

/** Schemes that open a page, and so want a tab of their own. */
const WEB_SCHEMES = ['https:', 'http:'];

/**
 * `mailto:` deliberately opens in place: `target="_blank"` on it leaves the
 * visitor with a blank tab after their mail client takes over.
 */
function opensAPage(url: string): boolean {
  return WEB_SCHEMES.some((scheme) => url.toLowerCase().startsWith(scheme));
}

/**
 * The footer's contacts (FR-23, FR-24).
 *
 * The page's `contentinfo` landmark, and the reason the closing headline is a
 * `<section>` beside it rather than around it.
 *
 * **`icon_svg` is inlined rather than loaded.** That is the whole point of
 * storing markup: an `<img>` cannot inherit `currentColor`, so the icon would
 * not follow the anchor's hover colour. `dangerouslySetInnerHTML` is the API
 * React gives for it, and what makes it safe here is not this call site — it
 * is that the string arrived through `IconSvg`, which no value reaches the
 * page without passing (NFR-07).
 *
 * The accessible name is `platform` verbatim (FR-24). Title-casing it here
 * would be a display rule this component would get wrong on the first
 * platform that capitalizes its own name in the middle.
 *
 * **The list is keyed by position.** `platform` is the only field left to key
 * by — `SocialLinkView` drops `id` on purpose — and nothing constrains it to
 * be unique, so two rows naming the same platform would collide and React
 * would keep one. The order is fixed by the query and this component never
 * reorders or filters, which is exactly the case where the index is a stable
 * key rather than a lazy one.
 */
export function SocialLinks({
  links,
  label,
}: {
  readonly links: readonly SocialLinkView[];
  readonly label: string;
}) {
  return (
    <footer className={styles.footer}>
      <ul className={styles.list} aria-label={label}>
        {links.map((link, position) => (
          <li key={position}>
            <a
              className={styles.link}
              href={link.url}
              aria-label={link.platform}
              {...(opensAPage(link.url)
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              <span
                className={styles.icon}
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: link.iconSvg }}
              />
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
