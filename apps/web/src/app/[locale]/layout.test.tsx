import { describe, expect, it, vi } from 'vitest';

// `vi.mock` is hoisted above every other statement, so the stub has to be
// created inside `vi.hoisted` to exist by the time it runs.
const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({ notFound }));

import LocaleLayout, { generateStaticParams, revalidate } from './layout';

describe('generateStaticParams', () => {
  it('builds one page per supported locale (NFR-01)', () => {
    expect(generateStaticParams()).toEqual([{ locale: 'en-US' }, { locale: 'pt-BR' }]);
  });

  it('revalidates on the documented timer (NFR-01)', () => {
    expect(revalidate).toBe(3600);
  });
});

describe('LocaleLayout', () => {
  it.each(['en-US', 'pt-BR'])('declares %s on the document (FR-29)', async (locale) => {
    const tree = await LocaleLayout({
      children: null,
      params: Promise.resolve({ locale }),
    });

    expect(tree.props.lang).toBe(locale);
  });

  it('404s on a segment that is not a supported locale', async () => {
    await expect(
      LocaleLayout({ children: null, params: Promise.resolve({ locale: 'fr' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalled();
  });
});
