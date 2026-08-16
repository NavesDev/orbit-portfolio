import type { SiteContent } from '../types';

/**
 * The optional locale. A key missing here is a type error rather than a blank
 * space, so "optional" means the translation may lag behind in the database —
 * not that static copy may be incomplete.
 */
export const ptBR: SiteContent = {
  nav: {
    mark: 'Davi Naves',
    skipToContent: 'Ir para o conteúdo',
  },
  languageSwitcher: {
    label: 'Idioma',
    localeLabels: { 'en-US': 'EN', 'pt-BR': 'PT' },
    localeNames: { 'en-US': 'Inglês (EN)', 'pt-BR': 'Português (PT)' },
  },
  hero: {
    availability: {
      open: 'Disponível para novos projetos',
      closed: 'Agenda fechada para novos projetos',
    },
    headline: {
      lead: 'Sistemas que funcionam ',
      emphasis: 'de verdade',
      trail: ', não só na demo.',
    },
    scrollCue: 'Role para explorar',
  },
  band: {
    label: 'Números',
    statLabels: {
      commits: 'commits públicos',
      pullRequests: 'pull requests abertos',
      coffee: 'xícaras de café este ano',
      years: 'anos codando',
    },
    illustrativeNote: 'Números ilustrativos — ainda não conectados ao GitHub.',
  },
};
