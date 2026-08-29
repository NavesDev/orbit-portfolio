import { describe, expect, it } from 'vitest';

import { Project, type ProjectProperties } from '../../../domain/entities/project.ts';
import { DateRange } from '../../../domain/value-objects/date-range.ts';
import { IconSvg } from '../../../domain/value-objects/icon-svg.ts';
import { LocalizedText } from '../../../domain/value-objects/localized-text.ts';
import { LocalizedTagList } from '../../../domain/value-objects/localized-tag-list.ts';
import { ProgressPercent } from '../../../domain/value-objects/progress-percent.ts';
import { Slug } from '../../../domain/value-objects/slug.ts';
import { Url } from '../../../domain/value-objects/url.ts';
import { FakeProjectRepository } from '../../ports/__fakes__/fake-project-repository.ts';
import type { ProjectSkillUsage } from '../../read-models/project-skill-usage.ts';
import { ListFeaturedProjects } from './list-featured-projects.ts';

function project(overrides: Partial<ProjectProperties> = {}): Project {
  return Project.create({
    id: overrides.slug?.toString() ?? 'orbit-portfolio',
    slug: Slug.create('orbit-portfolio'),
    title: LocalizedText.create({ 'en-US': 'Orbit Portfolio', 'pt-BR': 'Orbit Portfolio' }, 160),
    category: LocalizedText.create({ 'en-US': 'Personal portfolio' }, 40),
    description: LocalizedText.create({ 'en-US': 'A bilingual portfolio.' }, 8000),
    tags: LocalizedTagList.create({ 'en-US': ['Next.js'] }, 60, 8),
    repoUrl: Url.create('https://github.com/NavesDev/orbit-portfolio'),
    liveUrl: null,
    progress: ProgressPercent.create(100),
    period: DateRange.create({ startedOn: '2026-08-08', endedOn: null }),
    visualSvg: null,
    isFeatured: true,
    isPublished: true,
    sortOrder: 0,
    ...overrides,
  });
}

function useCase(
  projects: Project[],
  skillUsages: ReadonlyMap<string, readonly ProjectSkillUsage[]> = new Map(),
): ListFeaturedProjects {
  return new ListFeaturedProjects(new FakeProjectRepository(projects, skillUsages));
}

describe('ListFeaturedProjects', () => {
  it('orders projects by sort_order regardless of the order they arrive in', async () => {
    const { projects } = await useCase([
      project({ id: 'c', slug: Slug.create('c-project'), sortOrder: 2 }),
      project({ id: 'a', slug: Slug.create('a-project'), sortOrder: 0 }),
      project({ id: 'b', slug: Slug.create('b-project'), sortOrder: 1 }),
    ]).execute('en-US', 10);

    expect(projects.map((view) => view.slug)).toEqual(['a-project', 'b-project', 'c-project']);
  });

  it('breaks a sort_order tie on started_on, most recent first', async () => {
    const { projects } = await useCase([
      project({
        id: 'older',
        slug: Slug.create('older'),
        sortOrder: 0,
        period: DateRange.create({ startedOn: '2025-01-01', endedOn: null }),
      }),
      project({
        id: 'newer',
        slug: Slug.create('newer'),
        sortOrder: 0,
        period: DateRange.create({ startedOn: '2026-01-01', endedOn: null }),
      }),
    ]).execute('en-US', 10);

    expect(projects.map((view) => view.slug)).toEqual(['newer', 'older']);
  });

  it('never returns an unpublished or unfeatured project (FR-05, FR-28)', async () => {
    const { projects } = await useCase([
      project({ id: 'shown', slug: Slug.create('shown'), sortOrder: 0 }),
      project({ id: 'unpublished', slug: Slug.create('unpublished'), sortOrder: 1, isPublished: false }),
      project({ id: 'unfeatured', slug: Slug.create('unfeatured'), sortOrder: 2, isFeatured: false }),
    ]).execute('en-US', 10);

    expect(projects.map((view) => view.slug)).toEqual(['shown']);
  });

  it('honours the limit after sorting', async () => {
    const { projects } = await useCase([
      project({ id: 'a', slug: Slug.create('a-project'), sortOrder: 0 }),
      project({ id: 'b', slug: Slug.create('b-project'), sortOrder: 1 }),
    ]).execute('en-US', 1);

    expect(projects.map((view) => view.slug)).toEqual(['a-project']);
  });

  it('resolves a field with no pt-BR translation to its en-US text (FR-34)', async () => {
    const { projects } = await useCase([
      project({ title: LocalizedText.create({ 'en-US': 'English only' }, 160) }),
    ]).execute('pt-BR', 10);

    expect(projects[0]?.title).toBe('English only');
  });

  it('hands the card presentation plain strings, not value objects (NFR-13)', async () => {
    const { projects } = await useCase([project()]).execute('en-US', 10);

    expect(projects[0]).toEqual({
      slug: 'orbit-portfolio',
      title: 'Orbit Portfolio',
      summary: 'A bilingual portfolio.',
      category: 'Personal portfolio',
      tags: ['Next.js'],
      progressPercent: 100,
      visualSvg: null,
    });
  });

  it('carries a visualSvg string through when the project has one', async () => {
    const icon = IconSvg.create('<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>');
    const { projects } = await useCase([project({ visualSvg: icon })]).execute('en-US', 10);

    expect(projects[0]?.visualSvg).toBe(icon.toString());
  });

  it('keys the detail view by slug and includes applied skills with usage notes', async () => {
    const shown = project();
    const usages: ProjectSkillUsage[] = [
      {
        skillName: 'Next.js',
        usageNote: LocalizedText.create({ 'en-US': 'App Router throughout.' }, 240),
      },
      { skillName: 'PostgreSQL', usageNote: null },
    ];

    const { details } = await useCase([shown], new Map([[shown.id, usages]])).execute('en-US', 10);

    expect(details['orbit-portfolio']).toEqual({
      slug: 'orbit-portfolio',
      title: 'Orbit Portfolio',
      summary: 'A bilingual portfolio.',
      category: 'Personal portfolio',
      tags: ['Next.js'],
      progressPercent: 100,
      visualSvg: null,
      description: 'A bilingual portfolio.',
      repoUrl: 'https://github.com/NavesDev/orbit-portfolio',
      liveUrl: null,
      skills: [
        { name: 'Next.js', usageNote: 'App Router throughout.' },
        { name: 'PostgreSQL', usageNote: null },
      ],
    });
  });

  it('omits repoUrl and liveUrl from the detail view when the project has none', async () => {
    const { details } = await useCase([project({ repoUrl: null, liveUrl: null })]).execute(
      'en-US',
      10,
    );

    expect(details['orbit-portfolio']?.repoUrl).toBeNull();
    expect(details['orbit-portfolio']?.liveUrl).toBeNull();
  });

  it('returns nothing when there are no featured, published projects', async () => {
    const { projects, details } = await useCase([]).execute('en-US', 10);

    expect(projects).toEqual([]);
    expect(details).toEqual({});
  });

  describe('the card summary', () => {
    const description = (text: string) => LocalizedText.create({ 'en-US': text }, 8000);

    it('lifts the opening paragraph, leaving the bullets behind', async () => {
      const { projects } = await useCase([
        project({
          description: description(
            'A bilingual portfolio built on persisted content.\n\n- **Clean architecture** in a monorepo.\n- Hand-written SQL.',
          ),
        }),
      ]).execute('en-US', 10);

      expect(projects[0]?.summary).toBe('A bilingual portfolio built on persisted content.');
    });

    it('summarises a project with no description to null', async () => {
      const { projects } = await useCase([project({ description: null })]).execute('en-US', 10);

      expect(projects[0]?.summary).toBeNull();
    });

    it('summarises to null rather than to markup when the description opens on a list', async () => {
      const { projects } = await useCase([
        project({ description: description('- **Clean architecture** in a monorepo.\n- Hand-written SQL.') }),
      ]).execute('en-US', 10);

      expect(projects[0]?.summary).toBeNull();
    });

    it('resolves the summary in the reader’s locale', async () => {
      const { projects } = await useCase([
        project({
          description: LocalizedText.create(
            { 'en-US': 'This site.\n\n- A bullet.', 'pt-BR': 'Este site.\n\n- Um bullet.' },
            8000,
          ),
        }),
      ]).execute('pt-BR', 10);

      expect(projects[0]?.summary).toBe('Este site.');
    });
  });
});
