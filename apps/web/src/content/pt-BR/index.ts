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
  projects: {
    kicker: 'Projetos selecionados',
    heading: 'Cada card abaixo representa um problema real resolvido do início ao fim.',
    viewAll: 'Ver todos os projetos',
    detailsCta: 'Ver detalhes',
    repoCta: 'Repositório',
    tagsHeading: 'Tags',
    skillsHeading: 'Habilidades aplicadas',
    backCta: 'Voltar para o início',
  },
  timeline: {
    kicker: 'Trajetória',
    heading: 'Formação e experiência, na mesma linha do tempo.',
    kindLabels: {
      professional: 'Profissional',
      academic: 'Acadêmico',
      certification: 'Certificação',
    },
    ongoing: {
      professional: 'atual',
      academic: 'atual',
      certification: 'não expira',
    },
    detailsCta: 'Ver detalhes',
    showMore: 'Ver mais da trajetória',
    closeModal: 'Fechar',
    credentialCta: 'Verificar credencial',
    skillsHeading: 'Habilidades',
  },
  notFound: {
    heading: 'Página não encontrada',
    body: 'A página que você está procurando não existe.',
    backCta: 'Voltar para o início',
  },
  band: {
    label: 'Números',
    statLabels: {
      commits: 'commits públicos',
      pullRequests: 'pull requests públicos',
      coffee: 'xícaras de café este ano',
      years: 'anos codando',
    },
    missingNote: 'Alguns números não puderam ser lidos do GitHub agora.',
    unavailable: 'indisponível',
  },
  closing: {
    headline: {
      lead: 'Vamos construir algo ',
      emphasis: 'bem feito',
      trail: '.',
    },
    action: 'Iniciar conversa',
    linksLabel: 'Redes e contato',
  },
};
