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
  projects: {
    kicker: 'Selected work',
    heading: 'Each card below is a real problem solved start to finish.',
    viewAll: 'See all projects',
    detailsCta: 'View details',
    repoCta: 'Repository',
    tagsHeading: 'Tags',
    skillsHeading: 'Applied skills',
    backCta: 'Back to home',
  },
  timeline: {
    kicker: 'Trajectory',
    heading: 'Education and experience, on the same timeline.',
    kindLabels: {
      professional: 'Professional',
      academic: 'Academic',
      certification: 'Certification',
    },
    ongoing: {
      professional: 'present',
      academic: 'present',
      certification: 'no expiry',
    },
    detailsCta: 'View details',
    showMore: 'Show more of the trajectory',
    closeModal: 'Close',
    credentialCta: 'Verify credential',
    skillsHeading: 'Skills',
  },
  notFound: {
    heading: 'Page not found',
    body: 'The page you are looking for does not exist.',
    backCta: 'Back to home',
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
