import type { SiteContent } from '../types';

/**
 * The required locale (FR-34): every key here must exist, because this is what
 * renders when `pt-BR` has no translation for a field.
 * */
export const enUS: SiteContent = {
  nav: {
    mark: 'Davi Naves',
    skipToContent: 'Skip to content',
  },
  languageSwitcher: {
    label: 'Language',
    localeLabels: { 'en-US': 'EN', 'pt-BR': 'PT' },
    localeNames: { 'en-US': 'English (EN)', 'pt-BR': 'Portuguese (PT)' },
  },
  hero: {
    availability: {
      open: 'Available for new projects',
      closed: 'Not taking new projects',
    },
    headline: {
      lead: 'Systems that ',
      emphasis: 'really work',
      trail: ', not just in the demo.',
    },
    scrollCue: 'Scroll to explore',
  },
  band: {
    label: 'By the numbers',
    statLabels: {
      commits: 'public commits',
      pullRequests: 'public pull requests',
      coffee: 'cups of coffee this year',
      years: 'years coding',
    },
    missingNote: 'Some figures could not be read from GitHub right now.',
    unavailable: 'unavailable',
  },
  closing: {
    headline: {
      lead: "Let's build something ",
      emphasis: 'done right',
      trail: '.',
    },
    action: 'Start a conversation',
    linksLabel: 'Links and contact',
  },
};
