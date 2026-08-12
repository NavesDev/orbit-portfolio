import { isLocale } from '@portfolio/core';
import { notFound } from 'next/navigation';

import { MarqueeStrip } from '../../components/ui/marquee-strip';
import { getContent } from '../../content/index';

/**
 * The home page.
 *
 * The hero, projects, timeline, stat band and footer each arrive in their own
 * sprint-1 task. The strip is here because it belongs to the page's chrome,
 * not to a section.
 */
export default async function HomePage({
  params,
}: {
  readonly params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <main id="content">
      <MarqueeStrip phrases={getContent(locale).strip.phrases} />
    </main>
  );
}
