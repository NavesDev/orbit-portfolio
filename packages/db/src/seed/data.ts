/**
 * The portfolio's content, as data.
 *
 * Pure literals — no SQL and no I/O, so the content can be read and reviewed
 * without the mechanics in the way. `run.ts` is what writes it.
 *
 * Every localized value carries both locales. `en-US` is required by the
 * is_localized constraint; a `pt-BR` translation is optional and may lag
 * behind, in which case the field renders its English text (FR-34).
 * The length budgets in data-model.md apply: title 160, category 40, tag 60 in
 * at most 8 items, usage note 240, description 8000 — the CHECK constraints are
 * what catch a violation here, which is exactly why they exist.
 */

export type Locale = 'en-US' | 'pt-BR';

export type Localized = Record<Locale, string>;
export type LocalizedList = Record<Locale, string[]>;

export interface SeedSkill {
  name: string;
  category: 'frontend' | 'backend' | 'tooling' | 'data';
  sortOrder: number;
}

/** Skill name → what that skill did here. Keys must exist in `skills`. */
export type SkillUsage = Record<string, Localized>;

export interface SeedProject {
  slug: string;
  title: Localized;
  category: Localized;
  description: Localized;
  tags: LocalizedList;
  visualSvg: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
  progressPercent: number;
  startedOn: string;
  endedOn: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  skills: SkillUsage;
}

export interface SeedTimelineEntry {
  kind: 'professional' | 'academic' | 'certification';
  title: Localized;
  organization: string;
  description: Localized;
  credentialUrl: string | null;
  startedOn: string;
  endedOn: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  skills: SkillUsage;
}

export interface SeedSocialLink {
  platform: string;
  url: string;
  iconSvg: string;
  isPublished: boolean;
  sortOrder: number;
}

export interface SeedContent {
  skills: SeedSkill[];
  projects: SeedProject[];
  timelineEntries: SeedTimelineEntry[];
  socialLinks: SeedSocialLink[];
}

/**
 * Stroke icons, authored here rather than copied: the prototype uses two-letter
 * text placeholders. `stroke="currentColor"` is what lets a footer link's hover
 * colour reach the icon — an <img> cannot inherit it. Tags are limited to the
 * whitelist in data-model.md § 1 and there is no script and no `on*` handler.
 */
function icon(body: string): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"' +
    ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"' +
    ` stroke-linejoin="round">${body}</svg>`
  );
}

/**
 * A project's decorative visual (U-5): fixed colours rather than
 * `currentColor` — this is a standalone illustration, not an icon inheriting
 * a link's hover state — sized to the card's `4:3` box. Elements may carry a
 * `class` naming one of `IconSvg`'s four whitelisted animations; the
 * `@keyframes` themselves live in `apps/web`.
 */
function projectVisual(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 225">${body}</svg>`;
}

export const seedContent: SeedContent = {
  skills: [
    // frontend
    { name: 'HTML', category: 'frontend', sortOrder: 0 },
    { name: 'CSS', category: 'frontend', sortOrder: 1 },
    { name: 'JavaScript', category: 'frontend', sortOrder: 2 },
    { name: 'TypeScript', category: 'frontend', sortOrder: 3 },
    { name: 'React', category: 'frontend', sortOrder: 4 },
    { name: 'Next.js', category: 'frontend', sortOrder: 5 },
    { name: 'FreeMarker', category: 'frontend', sortOrder: 6 },
    // backend
    { name: 'Java', category: 'backend', sortOrder: 0 },
    { name: 'Liferay', category: 'backend', sortOrder: 1 },
    { name: 'Hibernate', category: 'backend', sortOrder: 2 },
    { name: 'Ruby on Rails', category: 'backend', sortOrder: 3 },
    { name: 'Python', category: 'backend', sortOrder: 4 },
    { name: 'Node.js', category: 'backend', sortOrder: 5 },
    // data
    { name: 'SQL', category: 'data', sortOrder: 0 },
    { name: 'PostgreSQL', category: 'data', sortOrder: 1 },
    { name: 'Groovy', category: 'data', sortOrder: 2 },
    { name: 'RAG', category: 'data', sortOrder: 3 },
    // tooling
    { name: 'Git', category: 'tooling', sortOrder: 0 },
    { name: 'GitLab', category: 'tooling', sortOrder: 1 },
    { name: 'CI/CD', category: 'tooling', sortOrder: 2 },
    { name: 'JUnit', category: 'tooling', sortOrder: 3 },
    { name: 'TDD', category: 'tooling', sortOrder: 4 },
    { name: 'Selenium', category: 'tooling', sortOrder: 5 },
    { name: 'Claude Code', category: 'tooling', sortOrder: 6 },
    { name: 'Docker', category: 'tooling', sortOrder: 7 },
    { name: 'Vercel', category: 'tooling', sortOrder: 8 },
  ],

  projects: [
    {
      slug: 'orbit-portfolio',
      title: { 'pt-BR': 'Orbit Portfolio', 'en-US': 'Orbit Portfolio' },
      category: { 'pt-BR': 'Portfólio pessoal', 'en-US': 'Personal portfolio' },
      description: {
        'pt-BR': [
          'Este site. Um portfólio bilíngue construído sobre conteúdo persistido, não sobre literais no código.',
          '',
          '- **Arquitetura limpa** em um monorepo de três pacotes: o domínio não conhece framework nem driver.',
          '- **Bilíngue por dado**, não por arquivo de tradução: cada coluna traduzida é `jsonb` com uma chave por locale e `pt-BR` como fallback garantido.',
          '- **SQL escrito à mão**, sem ORM — migrations forward-only e um seed re-executável.',
          '- **Testado por camada**: invariantes de domínio em memória, constraints e migrations contra um PostgreSQL real.',
        ].join('\n'),
        'en-US': [
          'This site. A bilingual portfolio built on persisted content rather than on literals in the code.',
          '',
          '- **Clean architecture** across a three-package monorepo: the domain knows neither framework nor driver.',
          '- **Bilingual by data**, not by translation file: every translated column is `jsonb` keyed by locale, with `pt-BR` as a guaranteed fallback.',
          '- **Hand-written SQL**, no ORM — forward-only migrations and a re-runnable seed.',
          '- **Tested per layer**: domain invariants in memory, constraints and migrations against a real PostgreSQL.',
        ].join('\n'),
      },
      tags: {
        'pt-BR': ['Next.js', 'TypeScript', 'PostgreSQL', 'Arquitetura limpa', 'Bilíngue'],
        'en-US': ['Next.js', 'TypeScript', 'PostgreSQL', 'Clean architecture', 'Bilingual'],
      },
      visualSvg: projectVisual(
        '<line x1="0" y1="75" x2="300" y2="75" stroke="rgb(37,106,191)" opacity="0.25"/>' +
          '<line x1="100" y1="0" x2="100" y2="225" stroke="rgb(37,106,191)" opacity="0.25"/>' +
          '<circle class="orbit-pulse" cx="100" cy="75" r="5" fill="rgb(37,106,191)"/>',
      ),
      repoUrl: 'https://github.com/NavesDev/orbit-portfolio',
      liveUrl: null,
      progressPercent: 100,
      startedOn: '2026-08-08',
      endedOn: null,
      isFeatured: true,
      isPublished: true,
      sortOrder: 0,
      skills: {
        'Next.js': {
          'pt-BR':
            'App Router com Server Components por padrão: os dados são buscados no servidor e descem como props já resolvidas em um idioma.',
          'en-US': 'App Router with Server Components by default: data is fetched on the server and passed down already resolved to one language.',
        },
        React: {
          'pt-BR':
            'Apenas as peças interativas são Client Components — o seletor de idioma, o campo de partículas do hero e os modais.',
          'en-US': 'Only the interactive pieces are Client Components — the language switcher, the hero particle field and the modals.',
        },
        TypeScript: {
          'pt-BR':
            'Configuração estrita com noUncheckedIndexedAccess e exactOptionalPropertyTypes: uma tradução faltando vira erro de tipo, não uma tela em branco.',
          'en-US': 'Strict setup with noUncheckedIndexedAccess and exactOptionalPropertyTypes: a missing translation is a type error, not a blank screen.',
        },
        PostgreSQL: {
          'pt-BR':
            'Seis tabelas, dois enums nativos e colunas jsonb por locale, validadas por funções is_localized como segunda linha de defesa do domínio.',
          'en-US': 'Six tables, two native enums and per-locale jsonb columns, validated by is_localized functions as the domain’s second line of defence.',
        },
        SQL: {
          'pt-BR':
            'Escrito à mão, sem ORM. Migrations forward-only aplicadas por um runner de quarenta linhas com um ledger que decide o que já rodou.',
          'en-US': 'Hand-written, no ORM. Forward-only migrations applied by a forty-line runner whose ledger decides what has already run.',
        },
        CSS: {
          'pt-BR':
            'Tokens de design em custom properties, layout responsivo de 380 px ao desktop e transições de página com a View Transition API.',
          'en-US': 'Design tokens as custom properties, a layout responsive from 380 px to desktop, and page transitions through the View Transition API.',
        },
        'Node.js': {
          'pt-BR':
            'Runner de migrations e seed executados direto do TypeScript pelo type stripping nativo do Node 24, sem passo de build.',
          'en-US': 'The migration runner and the seed run straight from TypeScript through Node 24’s native type stripping, with no build step.',
        },
        Docker: {
          'pt-BR':
            'Compose sobe o PostgreSQL 16 usado tanto no desenvolvimento local quanto pelos testes de integração.',
          'en-US': 'Compose brings up the PostgreSQL 16 used both for local development and by the integration tests.',
        },
        Vercel: {
          'pt-BR':
            'Deploy contínuo a partir do Git, com preview por pull request. Nenhum agente publica — produção vem da integração, não da CLI.',
          'en-US': 'Continuous deployment from Git with a preview per pull request. No agent publishes — production comes from the integration, not the CLI.',
        },
        Git: {
          'pt-BR':
            'Uma issue por tarefa, branches nomeadas pelo número da issue e Conventional Commits com escopo por pacote.',
          'en-US': 'One issue per task, branches named after the issue number, and Conventional Commits scoped by package.',
        },
        'CI/CD': {
          'pt-BR':
            'Cinco passos em cada push: install travado no lockfile, typecheck, testes unitários, integração contra um PostgreSQL de serviço e build.',
          'en-US': 'Five steps on every push: lockfile-frozen install, typecheck, unit tests, integration against a service PostgreSQL, and build.',
        },
        TDD: {
          'pt-BR':
            'O teste que prova a rejeição vem antes da constraint. As migrations foram fechadas contra uma suíte que já exigia cada CHECK.',
          'en-US': 'The test proving a rejection comes before the constraint. The migrations closed against a suite that already demanded every CHECK.',
        },
        'Claude Code': {
          'pt-BR':
            'Documentação normativa antes do código e skills versionadas no repositório, para que o agente siga as decisões já tomadas em vez de reinventá-las.',
          'en-US': 'Normative documentation before code, and skills versioned in the repository, so the agent follows decisions already made instead of reinventing them.',
        },
      },
    },
    {
      slug: 'navi',
      title: { 'pt-BR': 'Navi', 'en-US': 'Navi' },
      category: {
        'pt-BR': 'Sistema pessoal com IA',
        'en-US': 'AI personal operating system',
      },
      description: {
        'pt-BR': [
          'Monorepo de um sistema operacional pessoal com IA: chat, painéis, metas e gestão financeira em um só lugar.',
          '',
          '- **Chat com recuperação de contexto** sobre os próprios dados do usuário, em vez de respostas genéricas.',
          '- **Painéis e metas** que leem do mesmo modelo de dados que o módulo financeiro.',
          '- **Monorepo** para manter domínios separados sem fragmentar o histórico.',
        ].join('\n'),
        'en-US': [
          'A monorepo for an AI personal operating system: chat, dashboards, goals and financial management in one place.',
          '',
          '- **Retrieval-backed chat** over the user’s own data instead of generic answers.',
          '- **Dashboards and goals** reading from the same data model as the finance module.',
          '- **A monorepo** to keep the domains separate without fragmenting the history.',
        ].join('\n'),
      },
      tags: {
        'pt-BR': ['Ruby on Rails', 'Python', 'RAG', 'Finanças pessoais', 'Monorepo'],
        'en-US': ['Ruby on Rails', 'Python', 'RAG', 'Personal finance', 'Monorepo'],
      },
      visualSvg: projectVisual(
        '<circle class="orbit-spin" cx="150" cy="112" r="70" fill="none" stroke="rgb(37,106,191)" opacity="0.35" stroke-dasharray="8 10"/>' +
          '<circle cx="150" cy="112" r="40" fill="none" stroke="rgb(37,106,191)" opacity="0.2"/>',
      ),
      repoUrl: 'https://github.com/NavesDev/Navi',
      liveUrl: null,
      progressPercent: 70,
      startedOn: '2026-06-16',
      endedOn: null,
      isFeatured: true,
      isPublished: true,
      sortOrder: 1,
      skills: {
        'Ruby on Rails': {
          'pt-BR':
            'Carrega o núcleo da aplicação — modelos, autenticação e as telas de painéis, metas e finanças.',
          'en-US': 'Carries the application core — models, authentication and the dashboard, goals and finance screens.',
        },
        Python: {
          'pt-BR':
            'Serviços de IA fora do monólito: preparo de conteúdo, geração de embeddings e as rotinas que alimentam o chat.',
          'en-US': 'AI services outside the monolith: content preparation, embedding generation and the routines that feed the chat.',
        },
        RAG: {
          'pt-BR':
            'O chat responde a partir dos dados do próprio usuário: o contexto é recuperado antes da geração, em vez de confiar na memória do modelo.',
          'en-US': 'The chat answers from the user’s own data: context is retrieved before generation instead of trusting the model’s memory.',
        },
        PostgreSQL: {
          'pt-BR':
            'Base única para os módulos de metas, painéis e finanças, mais o índice vetorial que o chat consulta.',
          'en-US': 'A single store for the goals, dashboard and finance modules, plus the vector index the chat queries.',
        },
        SQL: {
          'pt-BR':
            'Consultas de agregação por período para os painéis financeiros, escritas à mão onde o ORM ficava lento.',
          'en-US': 'Period aggregation queries behind the financial dashboards, hand-written where the ORM was slow.',
        },
        TypeScript: {
          'pt-BR': 'Camada de interface e os tipos compartilhados entre os pacotes do monorepo.',
          'en-US': 'The interface layer and the types shared across the monorepo’s packages.',
        },
        Docker: {
          'pt-BR':
            'Sobe banco e serviços de IA juntos, para que o ambiente local não dependa do que cada máquina tem instalado.',
          'en-US': 'Brings up the database and the AI services together, so the local environment does not depend on what each machine happens to have installed.',
        },
        Git: {
          'pt-BR': 'Histórico único do monorepo, com commits escopados por módulo.',
          'en-US': 'One history for the monorepo, with commits scoped per module.',
        },
      },
    },
    {
      slug: 'personal-dashboard',
      title: { 'pt-BR': 'Personal Dashboard', 'en-US': 'Personal Dashboard' },
      category: { 'pt-BR': 'Painel pessoal', 'en-US': 'Personal dashboard' },
      description: {
        'pt-BR': [
          'Painel pessoal que reúne rotina, hábitos e acompanhamento de estudos em uma única tela.',
          '',
          '- **Uma tela em vez de cinco abas**: o que precisa de atenção hoje aparece primeiro.',
          '- **Componentes tipados** e estado local previsível, sem biblioteca de estado global.',
          '- Precursor direto das decisões de front-end reaproveitadas neste portfólio.',
        ].join('\n'),
        'en-US': [
          'A personal dashboard bringing routine, habits and study tracking onto a single screen.',
          '',
          '- **One screen instead of five tabs**: whatever needs attention today comes first.',
          '- **Typed components** and predictable local state, with no global state library.',
          '- The direct precursor to the front-end decisions reused in this portfolio.',
        ].join('\n'),
      },
      tags: {
        'pt-BR': ['TypeScript', 'React', 'Produtividade', 'Interface'],
        'en-US': ['TypeScript', 'React', 'Productivity', 'Interface'],
      },
      visualSvg: projectVisual(
        '<polyline class="orbit-draw" points="20,180 90,120 160,150 230,60 280,90" fill="none"' +
          ' stroke="rgb(37,106,191)" stroke-width="2" opacity="0.6"/>' +
          '<circle class="orbit-drift" cx="280" cy="90" r="5" fill="rgb(37,106,191)"/>',
      ),
      repoUrl: 'https://github.com/NavesDev/Personal-Dashboard',
      liveUrl: null,
      progressPercent: 80,
      startedOn: '2026-04-28',
      endedOn: null,
      isFeatured: true,
      isPublished: true,
      sortOrder: 2,
      skills: {
        TypeScript: {
          'pt-BR':
            'Tipagem estrita nos modelos do painel: um widget sem os dados que declara não compila.',
          'en-US': 'Strict typing across the dashboard models: a widget missing the data it declares does not compile.',
        },
        React: {
          'pt-BR':
            'Composição em vez de props booleanas — cada widget é montado a partir de peças menores em vez de configurado por flags.',
          'en-US': 'Composition instead of boolean props — each widget is assembled from smaller pieces rather than configured by flags.',
        },
        'Next.js': {
          'pt-BR': 'Roteamento e build da aplicação, com as páginas estáticas por padrão.',
          'en-US': 'Routing and build for the application, with pages static by default.',
        },
        CSS: {
          'pt-BR':
            'Grade responsiva que reordena os cartões conforme a largura, sem esconder informação no celular.',
          'en-US': 'A responsive grid that reorders the cards by width without hiding information on a phone.',
        },
        HTML: {
          'pt-BR':
            'Marcação semântica com regiões nomeadas, para que o painel seja navegável por leitor de tela.',
          'en-US': 'Semantic markup with named regions, so the dashboard is navigable by screen reader.',
        },
        Git: {
          'pt-BR': 'Versionamento com commits pequenos por widget entregue.',
          'en-US': 'Versioned with small commits, one per delivered widget.',
        },
        Vercel: {
          'pt-BR': 'Publicação a partir do repositório, com preview a cada mudança.',
          'en-US': 'Published from the repository, with a preview on every change.',
        },
      },
    },
  ],

  timelineEntries: [
    {
      kind: 'professional',
      title: {
        'pt-BR': 'Estagiário de Desenvolvimento',
        'en-US': 'Software Development Intern',
      },
      organization: 'Sea Tecnologia',
      description: {
        'pt-BR': [
          'Projetos de larga escala para o GDF (Governo do Distrito Federal) e o SESC/DF.',
          '',
          '- **Backend Java/Liferay:** mais de 10 endpoints REST desenvolvidos e mais de 10 bugs corrigidos em portais governamentais de larga escala, aplicando Java, FreeMarker, Hibernate, JUnit, MVC e princípios SOLID.',
          '- **Refatoração:** mais de 5 módulos refatorados com Design Patterns e boas práticas, melhorando manutenibilidade e legibilidade — trabalho contínuo.',
          '- **Testes:** mais de 50 testes unitários e de integração escritos seguindo Triple A, TDD e FIRST, tornando as entregas mais resilientes.',
          '- **Desenvolvimento com IA:** uso de Claude Code para acelerar desenvolvimento, testes e ajustes, com revisão própria e de líderes técnicos — mais de 200 commits e 40 pull requests.',
          '- **Automação com IA:** engenharia de prompt e criação de skills e plugins de IA, com Cursor, Antigravity e GitHub Copilot.',
          '- **Stack complementar:** HTML, CSS e JavaScript; consultas com SQL, ORMs e Groovy; sistema de gerência em Ruby on Rails; versionamento com Git e GitLab.',
        ].join('\n'),
        'en-US': [
          'Large-scale projects for the Federal District Government (GDF) and SESC/DF.',
          '',
          '- **Java/Liferay backend:** more than 10 REST endpoints delivered and more than 10 bugs fixed across large-scale government portals, using Java, FreeMarker, Hibernate, JUnit, MVC and SOLID principles.',
          '- **Refactoring:** more than 5 modules refactored with design patterns and sound practice, improving maintainability and readability — ongoing work.',
          '- **Testing:** more than 50 unit and integration tests written under Triple A, TDD and FIRST, making deliveries more resilient.',
          '- **Development with AI:** Claude Code used to speed up development, testing and adjustments, reviewed by me and by technical leads — more than 200 commits and 40 pull requests.',
          '- **Automation with AI:** prompt engineering plus authored AI skills and plugins, with Cursor, Antigravity and GitHub Copilot.',
          '- **Supporting stack:** HTML, CSS and JavaScript; queries with SQL, ORMs and Groovy; a management system in Ruby on Rails; versioning with Git and GitLab.',
        ].join('\n'),
      },
      credentialUrl: null,
      startedOn: '2025-12-01',
      endedOn: null,
      isFeatured: true,
      isPublished: true,
      sortOrder: 0,
      skills: {
        Java: {
          'pt-BR':
            'Linguagem dos portais do GDF e do SESC/DF: mais de 10 endpoints REST entregues sobre MVC e princípios SOLID.',
          'en-US': 'The language of the GDF and SESC/DF portals: more than 10 REST endpoints delivered on MVC and SOLID principles.',
        },
        Liferay: {
          'pt-BR':
            'Plataforma dos portais governamentais em que os módulos foram desenvolvidos, corrigidos e refatorados.',
          'en-US': 'The platform behind the government portals where the modules were built, fixed and refactored.',
        },
        Hibernate: {
          'pt-BR':
            'Mapeamento objeto-relacional das entidades dos portais, incluindo os ajustes de consulta feitos durante a correção de bugs.',
          'en-US': 'Object-relational mapping for the portals’ entities, including the query fixes made while resolving bugs.',
        },
        FreeMarker: {
          'pt-BR':
            'Camada de template dos portais Liferay, onde os dados do backend viram a página que o cidadão lê.',
          'en-US': 'The template layer of the Liferay portals, where backend data becomes the page a citizen reads.',
        },
        JUnit: {
          'pt-BR':
            'Ferramenta dos mais de 50 testes unitários e de integração escritos para os módulos entregues.',
          'en-US': 'The tool behind the 50-plus unit and integration tests written for the delivered modules.',
        },
        TDD: {
          'pt-BR':
            'Testes escritos antes do código, seguindo Triple A e FIRST — a suíte é o que sustenta a refatoração contínua dos módulos.',
          'en-US': 'Tests written before the code, under Triple A and FIRST — the suite is what sustains the ongoing refactoring of the modules.',
        },
        SQL: {
          'pt-BR':
            'Consultas diretas ao banco dos portais para diagnóstico de bugs e conferência de dados em produção.',
          'en-US': 'Direct queries against the portals’ database to diagnose bugs and check production data.',
        },
        Groovy: {
          'pt-BR':
            'Scripts de consulta e manipulação de dados sobre a base dos portais, fora do caminho da aplicação.',
          'en-US': 'Query and data-manipulation scripts over the portals’ database, outside the application path.',
        },
        'Ruby on Rails': {
          'pt-BR': 'Sistema interno de gerência mantido em paralelo aos portais Java.',
          'en-US': 'An internal management system maintained alongside the Java portals.',
        },
        HTML: {
          'pt-BR': 'Marcação das telas dos portais, integrada aos templates FreeMarker.',
          'en-US': 'Markup for the portal screens, integrated into the FreeMarker templates.',
        },
        CSS: {
          'pt-BR': 'Estilos das telas dos portais, dentro do tema da plataforma.',
          'en-US': 'Styling for the portal screens, within the platform’s theme.',
        },
        JavaScript: {
          'pt-BR': 'Comportamento das telas dos portais e integração com os endpoints REST entregues.',
          'en-US': 'Behaviour of the portal screens and integration with the REST endpoints delivered.',
        },
        Git: {
          'pt-BR':
            'Versionamento do trabalho: mais de 200 commits e 40 pull requests revisados por líderes técnicos.',
          'en-US': 'Versioning the work: more than 200 commits and 40 pull requests reviewed by technical leads.',
        },
        GitLab: {
          'pt-BR': 'Onde os merge requests foram abertos e revisados pela equipe.',
          'en-US': 'Where the merge requests were opened and reviewed by the team.',
        },
        'Claude Code': {
          'pt-BR':
            'Acelerou desenvolvimento, testes e ajustes, sempre com revisão própria e de líderes técnicos antes do merge.',
          'en-US': 'Sped up development, testing and adjustments, always reviewed by me and by technical leads before merge.',
        },
      },
    },
    {
      kind: 'professional',
      title: { 'pt-BR': 'Jovem Aprendiz', 'en-US': 'Young Apprentice' },
      organization: 'Neo Energia',
      description: {
        'pt-BR': [
          '- **Automações em Python:** Selenium como biblioteca padrão para automações administrativas e coleta de dados na web.',
          '- **Automação de cadastros:** unifiquei em uma única automação um cadastro que era feito manualmente em 3 plataformas diferentes, economizando cerca de 50 horas por mês da equipe.',
          '- **Automação de coleta de dados:** automação para scraping e download em massa de conteúdos, eliminando mais de 100 horas por mês antes gastas manualmente.',
          '- **Gestão de dados e apresentação de resultados** para a equipe em Excel, Canva e PowerPoint.',
        ].join('\n'),
        'en-US': [
          '- **Automation in Python:** Selenium as the default library for administrative automation and web data collection.',
          '- **Registration automation:** folded a registration done by hand across 3 different platforms into a single automation, saving the team roughly 50 hours a month.',
          '- **Data collection automation:** scraping and bulk download of content, eliminating more than 100 hours a month previously spent by hand.',
          '- **Data handling and reporting** to the team through Excel, Canva and PowerPoint.',
        ].join('\n'),
      },
      credentialUrl: null,
      startedOn: '2025-06-01',
      endedOn: '2025-12-31',
      isFeatured: true,
      isPublished: true,
      sortOrder: 1,
      skills: {
        Python: {
          'pt-BR':
            'Linguagem de todas as automações: cadastro unificado, scraping e download em massa, mais de 150 horas por mês devolvidas à equipe.',
          'en-US': 'The language of every automation: unified registration, scraping and bulk download — over 150 hours a month handed back to the team.',
        },
        Selenium: {
          'pt-BR':
            'Biblioteca padrão para dirigir o navegador nas três plataformas de cadastro e na coleta de conteúdo.',
          'en-US': 'The default library for driving the browser across the three registration platforms and the content collection.',
        },
        SQL: {
          'pt-BR':
            'Consultas para conferir e consolidar os dados coletados antes de virarem relatório.',
          'en-US': 'Queries to check and consolidate the collected data before it became a report.',
        },
      },
    },
    {
      kind: 'academic',
      title: {
        'pt-BR': 'Superior em Análise e Desenvolvimento de Sistemas',
        'en-US': 'Associate Degree in Systems Analysis and Development',
      },
      organization: 'Universidade Paulista (UNIP)',
      description: {
        'pt-BR':
          'Cursando o 4º de 4 semestres. Base em algoritmos, estruturas de dados, engenharia de software, banco de dados e desenvolvimento web.',
        'en-US': 'In the 4th of 4 semesters. Grounding in algorithms, data structures, software engineering, databases and web development.',
      },
      credentialUrl: null,
      startedOn: '2025-02-01',
      endedOn: null,
      isFeatured: true,
      isPublished: true,
      sortOrder: 2,
      skills: {
        SQL: {
          'pt-BR':
            'Modelagem relacional e normalização — a base que sustenta o esquema deste portfólio.',
          'en-US': 'Relational modelling and normalisation — the grounding behind this portfolio’s own schema.',
        },
        Java: {
          'pt-BR':
            'Programação orientada a objetos e estruturas de dados nas disciplinas de fundamentos.',
          'en-US': 'Object-oriented programming and data structures in the foundational courses.',
        },
        JavaScript: {
          'pt-BR': 'Desenvolvimento web nas disciplinas de front-end.',
          'en-US': 'Web development in the front-end courses.',
        },
      },
    },
    {
      kind: 'academic',
      title: {
        'pt-BR': 'Técnico em Tecnologia da Informação',
        'en-US': 'Technical Diploma in Information Technology',
      },
      organization: 'Centro de Ensino Médio Integrado do Cruzeiro (CEMIC)',
      description: {
        'pt-BR':
          'Concluído em 6 semestres, integrado ao ensino médio. Primeiro contato com programação, redes e desenvolvimento web.',
        'en-US': 'Completed over 6 semesters, integrated with secondary education. First contact with programming, networking and web development.',
      },
      credentialUrl: null,
      startedOn: '2022-02-01',
      endedOn: '2024-12-31',
      isFeatured: false,
      isPublished: true,
      sortOrder: 3,
      skills: {
        HTML: {
          'pt-BR': 'Primeiras páginas escritas à mão, antes de qualquer framework.',
          'en-US': 'The first pages written by hand, before any framework.',
        },
        CSS: {
          'pt-BR': 'Layout e responsividade nas disciplinas de desenvolvimento web.',
          'en-US': 'Layout and responsiveness in the web development courses.',
        },
        JavaScript: {
          'pt-BR': 'Lógica de programação e interatividade nas primeiras aplicações.',
          'en-US': 'Programming logic and interactivity in the first applications.',
        },
        SQL: {
          'pt-BR': 'Modelagem e consultas em banco de dados relacional.',
          'en-US': 'Modelling and querying in a relational database.',
        },
      },
    },
    {
      kind: 'certification',
      title: {
        'pt-BR': 'Java Development — Nano Course (60 h)',
        'en-US': 'Java Development — Nano Course (60 h)',
      },
      organization: 'FIAP',
      description: {
        'pt-BR':
          'Nano Course de 60 horas em desenvolvimento Java, concluído em 25 de julho de 2026. Não expira.',
        'en-US': 'A 60-hour Nano Course in Java development, completed on 25 July 2026. It does not expire.',
      },
      credentialUrl: null,
      startedOn: '2026-07-25',
      endedOn: null,
      isFeatured: true,
      isPublished: true,
      sortOrder: 4,
      skills: {
        Java: {
          'pt-BR':
            'Sessenta horas de desenvolvimento Java, reforçando a base usada diariamente nos portais Liferay.',
          'en-US': 'Sixty hours of Java development, reinforcing the base used daily on the Liferay portals.',
        },
      },
    },
  ],

  socialLinks: [
    {
      platform: 'github',
      url: 'https://github.com/NavesDev',
      iconSvg: icon(
        '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54' +
          ' 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0' +
          ' 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3' +
          ' 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
      ),
      isPublished: true,
      sortOrder: 0,
    },
    {
      platform: 'linkedin',
      url: 'https://www.linkedin.com/in/davi-de-sousa-naves-b63b12351/',
      iconSvg: icon(
        '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>' +
          '<rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
      ),
      isPublished: true,
      sortOrder: 1,
    },
    {
      platform: 'email',
      url: 'mailto:davinaves.2006@gmail.com',
      iconSvg: icon(
        '<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2 7 12 14 22 7"/>',
      ),
      isPublished: true,
      sortOrder: 2,
    },
  ],
};
