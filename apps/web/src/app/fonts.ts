import { Inter_Tight, Newsreader } from 'next/font/google';

/**
 * The prototype's two faces, self-hosted at build time.
 *
 * It pulls them through a Google Fonts `@import` inside its stylesheet, which
 * is render-blocking and a third-party request on every page load. Same faces,
 * same weights, exposed as CSS variables so `globals.css` names them once.
 */
export const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

export const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});
