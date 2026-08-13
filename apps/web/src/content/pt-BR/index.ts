import type { SiteContent } from '../types';

/**
 * The optional locale. A key missing here is a type error rather than a blank
 * space, so "optional" means the translation may lag behind in the database —
 * not that static copy may be incomplete.
 */
export const ptBR: SiteContent = {
  nav: {
    mark: 'DN',
    skipToContent: 'Ir para o conteúdo',
  },
  languageSwitcher: {
    label: 'Idioma',
    localeLabels: { 'en-US': 'EN', 'pt-BR': 'PT' },
    localeNames: { 'en-US': 'Inglês (EN)', 'pt-BR': 'Português (PT)' },
  },
  strip: {
    phrases: [
      { lead: 'Next.js', rest: '· React · Node' },
      { lead: 'UNIP', rest: '· ADS · Brasília' },
      { lead: 'Claude Code', rest: '· automação' },
      { lead: 'PostgreSQL', rest: '· APIs REST' },
    ],
  },
};
