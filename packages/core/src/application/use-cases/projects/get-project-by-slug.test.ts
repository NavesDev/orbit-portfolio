import { describe, expect, it } from 'vitest';

import { Project, type ProjectProperties } from '../../../domain/entities/project.ts';
import { DateRange } from '../../../domain/value-objects/date-range.ts';
import { LocalizedText } from '../../../domain/value-objects/localized-text.ts';
import { LocalizedTagList } from '../../../domain/value-objects/localized-tag-list.ts';
import { ProgressPercent } from '../../../domain/value-objects/progress-percent.ts';
import { Slug } from '../../../domain/value-objects/slug.ts';
import { Url } from '../../../domain/value-objects/url.ts';
import { FakeProjectRepository } from '../../ports/__fakes__/fake-project-repository.ts';
import type { ProjectSkillUsage } from '../../read-models/project-skill-usage.ts';
import { GetProjectBySlug } from './get-project-by-slug.ts';

function project(overrides: Partial<ProjectProperties> = {}): Project {
  return Project.create({
    id: 'orbit-portfolio',
    slug: Slug.create('orbit-portfolio'),
    title: LocalizedText.create({ 'en-US': 'Orbit Portfolio' }, 160),
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
): GetProjectBySlug {
  return new GetProjectBySlug(new FakeProjectRepository(projects, skillUsages));
}

describe('GetProjectBySlug', () => {
  it('returns the project a slug names', async () => {
    const { detail } = await useCase([project()]).execute('orbit-portfolio', 'en-US');

    expect(detail?.slug).toBe('orbit-portfolio');
    expect(detail?.title).toBe('Orbit Portfolio');
  });

  it('finds a project regardless of whether it is featured (unlike ListFeaturedProjects)', async () => {
    const { detail } = await useCase([project({ isFeatured: false })]).execute(
      'orbit-portfolio',
      'en-US',
    );

    expect(detail).not.toBeNull();
  });

  it('returns null for an unpublished project — same as not existing (FR-28)', async () => {
    const { detail } = await useCase([project({ isPublished: false })]).execute(
      'orbit-portfolio',
      'en-US',
    );

    expect(detail).toBeNull();
  });

  it('returns null for a slug that names no project', async () => {
    const { detail } = await useCase([project()]).execute('no-such-project', 'en-US');

    expect(detail).toBeNull();
  });

  it('resolves a field with no pt-BR translation to its en-US text (FR-34)', async () => {
    const { detail } = await useCase([
      project({ title: LocalizedText.create({ 'en-US': 'English only' }, 160) }),
    ]).execute('orbit-portfolio', 'pt-BR');

    expect(detail?.title).toBe('English only');
  });

  it('includes applied skills with their usage note', async () => {
    const shown = project();
    const usages: ProjectSkillUsage[] = [
      { skillName: 'Next.js', usageNote: LocalizedText.create({ 'en-US': 'App Router.' }, 240) },
    ];

    const { detail } = await useCase([shown], new Map([[shown.id, usages]])).execute(
      'orbit-portfolio',
      'en-US',
    );

    expect(detail?.skills).toEqual([{ name: 'Next.js', usageNote: 'App Router.' }]);
  });
});
