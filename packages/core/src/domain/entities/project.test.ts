import { describe, expect, it } from 'vitest';

import { ENTITY_VIOLATIONS, InvalidEntityError } from '../errors/invalid-entity-error.ts';
import { InvalidProjectError, PROJECT_VIOLATIONS } from '../errors/invalid-project-error.ts';
import { DateRange } from '../value-objects/date-range.ts';
import { LocalizedText } from '../value-objects/localized-text.ts';
import { ProgressPercent } from '../value-objects/progress-percent.ts';
import { Slug } from '../value-objects/slug.ts';
import { Url } from '../value-objects/url.ts';
import { Project, type ProjectProperties } from './project.ts';

function properties(overrides: Partial<ProjectProperties> = {}): ProjectProperties {
  return {
    id: '5f1f1f1f-1f1f-4f1f-8f1f-1f1f1f1f1f1f',
    slug: Slug.create('orbit-portfolio'),
    title: LocalizedText.create({ 'en-US': 'Orbit Portfolio' }, 160),
    category: null,
    description: null,
    tags: null,
    repoUrl: null,
    liveUrl: null,
    progress: ProgressPercent.create(100),
    period: DateRange.create({ startedOn: '2026-08-08', endedOn: null }),
    visualSvg: null,
    isFeatured: true,
    isPublished: true,
    sortOrder: 0,
    ...overrides,
  };
}

function violationOf(overrides: Partial<ProjectProperties>): string {
  try {
    Project.create(properties(overrides));
  } catch (error) {
    if (error instanceof InvalidProjectError || error instanceof InvalidEntityError) {
      return error.violation;
    }

    throw error;
  }

  throw new Error('Expected the project to be rejected, and it was not.');
}

describe('Project', () => {
  it('holds every property it was created with', () => {
    const repoUrl = Url.create('https://github.com/NavesDev/orbit-portfolio');
    const project = Project.create(properties({ repoUrl }));

    expect(project.slug.toString()).toBe('orbit-portfolio');
    expect(project.title.resolve('en-US')).toBe('Orbit Portfolio');
    expect(project.repoUrl).toBe(repoUrl);
    expect(project.isFeatured).toBe(true);
    expect(project.isPublished).toBe(true);
  });

  it('rejects a missing id, from the shared Entity base', () => {
    expect(violationOf({ id: '' })).toBe(ENTITY_VIOLATIONS.MISSING_ID);
  });

  it('rejects a non-integer sort order', () => {
    expect(violationOf({ sortOrder: 1.5 })).toBe(PROJECT_VIOLATIONS.SORT_ORDER_NOT_AN_INTEGER);
  });

  it('two projects sharing an id are equal even with different content', () => {
    const first = Project.create(properties());
    const second = Project.create(properties({ isFeatured: false }));

    expect(first.equals(second)).toBe(true);
  });
});
