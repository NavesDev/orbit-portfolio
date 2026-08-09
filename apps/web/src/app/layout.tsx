import type { ReactNode } from 'react';

/**
 * Root layout — required by the App Router, and the minimum Next 16 needs to
 * produce a build at all.
 *
 * It is deliberately bare. The real shell belongs to `app/[locale]/layout.tsx`,
 * which resolves the visitor's language and sets `lang` from it; `pt-BR` is
 * hardcoded here only because a root `<html>` must declare something and
 * `pt-BR` is the project-wide fallback. Nothing user-facing should be added at
 * this level.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
