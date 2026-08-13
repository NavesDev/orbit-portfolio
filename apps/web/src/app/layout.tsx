import type { ReactNode } from 'react';

/**
 * Pass-through root.
 *
 * The App Router requires a file at `app/layout.tsx`, but `<html>` and
 * `<body>` belong to `app/[locale]/layout.tsx`, which is the only layout that
 * knows the resolved locale and can set `lang` from it. Nothing user-facing
 * belongs at this level.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
