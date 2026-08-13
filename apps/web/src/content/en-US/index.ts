import type { SiteContent } from '../types';

/**
 * The required locale (FR-34): every key here must exist, because this is what
 * renders when `pt-BR` has no translation for a field.
 *
 * The strip's phrases come from the prototype. Proper nouns are not translated
 * (FR-35), so only the trailing words differ between the two modules.
 */
export const enUS: SiteContent = {
  nav: {
    mark: 'DN',
    skipToContent: 'Skip to content',
  },
  languageSwitcher: {
    label: 'Language',
    localeLabels: { 'en-US': 'EN', 'pt-BR': 'PT' },
    localeNames: { 'en-US': 'English (EN)', 'pt-BR': 'Portuguese (PT)' },
  },
  strip: {
    phrases: [
      { lead: 'Next.js', rest: '· React · Node' },
      { lead: 'UNIP', rest: '· ADS · Brasília' },
      { lead: 'Claude Code', rest: '· automation' },
      { lead: 'PostgreSQL', rest: '· REST APIs' },
    ],
  },
};
