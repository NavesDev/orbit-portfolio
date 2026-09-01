import { beforeEach, describe, expect, it } from 'vitest';

import { ORGANIZATION_MAX_LENGTH, TITLE_MAX_LENGTH } from '../../../domain/constants/text-budgets.ts';
import { TimelineEntry } from '../../../domain/entities/timeline-entry.ts';
import type { TimelineKind } from '../../../domain/enums/timeline-kind.ts';
import { DateRange } from '../../../domain/value-objects/date-range.ts';
import { LocalizedText } from '../../../domain/value-objects/localized-text.ts';
import { FakeTimelineRepository } from '../../ports/__fakes__/fake-timeline-repository.ts';
import { GetTimeline } from './get-timeline.ts';

const WHOLE_PAGE = { limit: 10, offset: 0 };

interface EntryOptions {
  readonly id: string;
  readonly startedOn: string | null;
  readonly endedOn?: string | null;
  readonly title?: Record<string, string>;
  readonly kind?: TimelineKind;
  readonly isPublished?: boolean;
  readonly sortOrder?: number;
}

function entry(options: EntryOptions): TimelineEntry {
  return TimelineEntry.create({
    id: options.id,
    kind: options.kind ?? 'professional',
    title: LocalizedText.create(options.title ?? { 'en-US': `Role ${options.id}` }, TITLE_MAX_LENGTH),
    organization: 'Sea Tecnologia'.slice(0, ORGANIZATION_MAX_LENGTH),
    description: null,
    credentialUrl: null,
    period: DateRange.create({ startedOn: options.startedOn, endedOn: options.endedOn ?? null }),
    isFeatured: false,
    isPublished: options.isPublished ?? true,
    sortOrder: options.sortOrder ?? 0,
  });
}

function titlesOf(entries: readonly { readonly title: string }[]): string[] {
  return entries.map((view) => view.title);
}

describe('GetTimeline', () => {
  describe('what it lists', () => {
    let useCase: GetTimeline;

    beforeEach(() => {
      useCase = new GetTimeline(
        new FakeTimelineRepository([
          entry({ id: 'b', startedOn: '2025-06-01' }),
          entry({ id: 'a', startedOn: '2026-07-25' }),
          entry({ id: 'd', startedOn: '2022-02-01' }),
          entry({ id: 'c', startedOn: '2025-02-01' }),
        ]),
      );
    });

    it('puts the most recent entry first (FR-11)', async () => {
      const { entries } = await useCase.execute('en-US', WHOLE_PAGE);

      expect(titlesOf(entries)).toEqual(['Role a', 'Role b', 'Role c', 'Role d']);
    });

    it('counts every published entry, not the page it returned', async () => {
      const { entries, total } = await useCase.execute('en-US', { limit: 2, offset: 0 });

      expect(entries).toHaveLength(2);
      expect(total).toBe(4);
    });

    it('returns a window that continues where the previous one stopped', async () => {
      const first = await useCase.execute('en-US', { limit: 2, offset: 0 });
      const second = await useCase.execute('en-US', { limit: 2, offset: 2 });

      expect(titlesOf(first.entries)).toEqual(['Role a', 'Role b']);
      expect(titlesOf(second.entries)).toEqual(['Role c', 'Role d']);
    });

    it('returns nothing past the last entry rather than wrapping around', async () => {
      const { entries, total } = await useCase.execute('en-US', { limit: 2, offset: 4 });

      expect(entries).toEqual([]);
      expect(total).toBe(4);
    });
  });

  it('never returns an unpublished entry (FR-28)', async () => {
    const useCase = new GetTimeline(
      new FakeTimelineRepository([
        entry({ id: 'draft', startedOn: '2026-01-01', isPublished: false }),
        entry({ id: 'live', startedOn: '2025-01-01' }),
      ]),
    );

    const { entries, total } = await useCase.execute('en-US', WHOLE_PAGE);

    expect(titlesOf(entries)).toEqual(['Role live']);
    expect(total).toBe(1);
  });

  it('sorts an entry with no start date last — it cannot claim to be the most recent', async () => {
    const useCase = new GetTimeline(
      new FakeTimelineRepository([
        entry({ id: 'undated', startedOn: null }),
        entry({ id: 'dated', startedOn: '2020-01-01' }),
      ]),
    );

    const { entries } = await useCase.execute('en-US', WHOLE_PAGE);

    expect(titlesOf(entries)).toEqual(['Role dated', 'Role undated']);
  });

  it('breaks a tie on sort order, then on id, so pages never overlap', async () => {
    const useCase = new GetTimeline(
      new FakeTimelineRepository([
        entry({ id: 'z', startedOn: '2025-01-01', sortOrder: 0 }),
        entry({ id: 'a', startedOn: '2025-01-01', sortOrder: 0 }),
        entry({ id: 'm', startedOn: '2025-01-01', sortOrder: -1 }),
      ]),
    );

    const { entries } = await useCase.execute('en-US', WHOLE_PAGE);

    expect(titlesOf(entries)).toEqual(['Role m', 'Role a', 'Role z']);
  });

  describe('what it resolves', () => {
    it('resolves each localized field to the requested language', async () => {
      const useCase = new GetTimeline(
        new FakeTimelineRepository([
          entry({
            id: 'a',
            startedOn: '2025-12-01',
            title: { 'en-US': 'Development Intern', 'pt-BR': 'Estagiário de Desenvolvimento' },
          }),
        ]),
      );

      const { entries } = await useCase.execute('pt-BR', WHOLE_PAGE);

      expect(titlesOf(entries)).toEqual(['Estagiário de Desenvolvimento']);
    });

    it('falls back to en-US for a field with no translation yet (FR-34)', async () => {
      const useCase = new GetTimeline(
        new FakeTimelineRepository([
          entry({ id: 'a', startedOn: '2025-12-01', title: { 'en-US': 'Development Intern' } }),
        ]),
      );

      const { entries } = await useCase.execute('pt-BR', WHOLE_PAGE);

      expect(titlesOf(entries)).toEqual(['Development Intern']);
    });

    it('carries the domain’s own answer to whether an entry is ongoing (FR-13)', async () => {
      const useCase = new GetTimeline(
        new FakeTimelineRepository([
          entry({ id: 'a', startedOn: '2025-12-01' }),
          entry({ id: 'b', startedOn: '2025-06-01', endedOn: '2025-11-30' }),
        ]),
      );

      const { entries } = await useCase.execute('en-US', WHOLE_PAGE);

      expect(entries.map((view) => view.isOngoing)).toEqual([true, false]);
    });

    it('attaches each entry’s own skills', async () => {
      const useCase = new GetTimeline(
        new FakeTimelineRepository(
          [
            entry({ id: 'a', startedOn: '2025-12-01' }),
            entry({ id: 'b', startedOn: '2025-06-01' }),
          ],
          new Map([
            ['a', ['Java', 'Liferay']],
            ['b', ['Python']],
          ]),
        ),
      );

      const { entries } = await useCase.execute('en-US', WHOLE_PAGE);

      expect(entries.map((view) => view.skills)).toEqual([['Java', 'Liferay'], ['Python']]);
    });
  });
});
