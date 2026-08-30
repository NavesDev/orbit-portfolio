import '../styles/tokens.css';
import '../styles/globals.css';
import { interTight, newsreader } from './fonts';
import styles from './not-found.module.css';

/**
 * The site's global 404 (Next.js: root `app/not-found.js` catches every
 * unmatched URL since v13.3.0).
 *
 * Since `app/layout.tsx` is a deliberate pass-through — `<html>`/`<body>`
 * live in `[locale]/layout.tsx`, which needs the resolved locale to set
 * `lang` — a URL that never resolves a locale segment (or resolves one but
 * matches no page under it, e.g. `/pt-BR/projetos` before that route exists)
 * bubbles past `[locale]/layout.tsx` entirely. This file is what a visitor
 * actually sees then, so it supplies its own `<html>` and `<body>` and its
 * own copy — it cannot read `getContent(locale)`, because there is no
 * request-scoped locale by the time Next reaches for it.
 *
 * Bilingual inline, in both directions, rather than picking one: the two
 * sentences below are the entire page, so there is no fallback rule to
 * apply and no `content/` module worth adding for two static lines.
 */
export default function NotFound() {
  return (
    <html lang="en" className={`${interTight.variable} ${newsreader.variable}`}>
      <body className={styles.body}>
        <div className={styles.card}>
          <p className={styles.code}>404</p>
          <p className={styles.message}>
            Page not found. <span lang="pt-BR">Página não encontrada.</span>
          </p>
          <a className={styles.action} href="/">
            Home
          </a>
        </div>
      </body>
    </html>
  );
}
