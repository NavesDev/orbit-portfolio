import { describe, expect, it } from 'vitest';
import {
  seedContent,
  type Localized,
  type SkillUsage,
} from './data.ts';

/**
 * The database would reject a violation anyway — that is what the CHECK
 * constraints are for. This file exists so the failure names the offending
 * field instead of arriving as a constraint violation mid-transaction.
 *
 * Nothing here asserts a row count or a specific piece of content (U-1).
 */

const LOCALES = ['pt-BR', 'en'] as const;

function budget(label: string, value: Localized, max: number): void {
  for (const locale of LOCALES) {
    const text = value[locale];
    expect(text, `${label} is missing ${locale}`).toBeTypeOf('string');
    expect(text.length, `${label} [${locale}] is over ${max} characters`).toBeLessThanOrEqual(
      max,
    );
    expect(text.trim(), `${label} [${locale}] is blank`).not.toBe('');
  }
}

function usageBudget(label: string, skills: SkillUsage): void {
  for (const [skill, note] of Object.entries(skills)) {
    budget(`${label} → ${skill}`, note, 240);
  }
}

describe('seed content', () => {
  const skillNames = new Set(seedContent.skills.map((skill) => skill.name));

  it('names every skill exactly once', () => {
    expect(skillNames.size).toBe(seedContent.skills.length);
  });

  it('references only skills that exist', () => {
    const referenced = [
      ...seedContent.projects.flatMap((project) => Object.keys(project.skills)),
      ...seedContent.timelineEntries.flatMap((entry) => Object.keys(entry.skills)),
    ];
    expect(referenced.filter((name) => !skillNames.has(name))).toEqual([]);
  });

  it('gives every skill somewhere to render', () => {
    // A skill nobody references renders nowhere — data-model.md § 2.
    const referenced = new Set([
      ...seedContent.projects.flatMap((project) => Object.keys(project.skills)),
      ...seedContent.timelineEntries.flatMap((entry) => Object.keys(entry.skills)),
    ]);
    expect([...skillNames].filter((name) => !referenced.has(name))).toEqual([]);
  });

  it('keeps every project inside its length budgets', () => {
    for (const project of seedContent.projects) {
      budget(`${project.slug}.title`, project.title, 160);
      budget(`${project.slug}.category`, project.category, 40);
      budget(`${project.slug}.description`, project.description, 8000);
      for (const locale of LOCALES) {
        const tags = project.tags[locale];
        expect(tags.length, `${project.slug}.tags [${locale}] has over 8 items`).toBeLessThanOrEqual(
          8,
        );
        for (const tag of tags) {
          expect(tag.length, `${project.slug} tag "${tag}" is over 60`).toBeLessThanOrEqual(60);
        }
      }
      usageBudget(project.slug, project.skills);
    }
  });

  it('keeps every timeline entry inside its length budgets', () => {
    for (const entry of seedContent.timelineEntries) {
      budget(`${entry.organization}.title`, entry.title, 160);
      budget(`${entry.organization}.description`, entry.description, 8000);
      expect(entry.organization.length).toBeLessThanOrEqual(160);
      usageBudget(entry.organization, entry.skills);
    }
  });

  it('keeps every period in order', () => {
    const periods = [...seedContent.projects, ...seedContent.timelineEntries];
    for (const period of periods) {
      if (period.endedOn === null) continue;
      expect(
        period.endedOn >= period.startedOn,
        `${period.startedOn} → ${period.endedOn} is reversed`,
      ).toBe(true);
    }
  });

  it('keeps every progress percent in range', () => {
    for (const project of seedContent.projects) {
      expect(project.progressPercent).toBeGreaterThanOrEqual(0);
      expect(project.progressPercent).toBeLessThanOrEqual(100);
    }
  });

  it('authors icons that satisfy the IconSvg invariant', () => {
    // data-model.md § 1: whitelisted tags, currentColor, no script, no handler.
    const allowed = /^(svg|g|path|circle|rect|line|polyline|polygon)$/;
    for (const link of seedContent.socialLinks) {
      expect(link.iconSvg, `${link.platform} icon must inherit the link colour`).toContain(
        'stroke="currentColor"',
      );
      expect(link.iconSvg, `${link.platform} icon contains a script`).not.toMatch(/<script/i);
      expect(link.iconSvg, `${link.platform} icon contains an event handler`).not.toMatch(
        /\son[a-z]+\s*=/i,
      );
      for (const [, tag] of link.iconSvg.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)/g)) {
        expect(tag!, `${link.platform} icon uses <${tag}>`).toMatch(allowed);
      }
    }
  });

  it('gives every social link an absolute https or mailto url', () => {
    for (const link of seedContent.socialLinks) {
      expect(link.url, `${link.platform} url`).toMatch(/^(https:\/\/|mailto:)/);
      expect(link.url.length).toBeLessThanOrEqual(2048);
      expect(link.platform.length).toBeLessThanOrEqual(40);
    }
  });
});
