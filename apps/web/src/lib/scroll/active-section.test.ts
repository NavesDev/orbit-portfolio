import { afterEach, describe, expect, it, vi } from 'vitest';

import { computeActiveSectionIndex } from './active-section';

function stubSection(id: string, top: number): void {
  const element = document.createElement('section');
  element.id = id;
  document.body.appendChild(element);
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({ top } as DOMRect);
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('computeActiveSectionIndex', () => {
  it('picks the first section when the page is at rest', () => {
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
    stubSection('hero', 0);
    stubSection('band', 1200);

    expect(computeActiveSectionIndex(['hero', 'band'])).toBe(0);
  });

  it('picks a much taller section correctly, unlike an equal-division guess', () => {
    // A projects section several cards tall sits between hero and band —
    // exactly the shape that broke the old scroll-progress-based derivation.
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
    stubSection('hero', -3000);
    stubSection('projects', -500);
    stubSection('band', 600);

    expect(computeActiveSectionIndex(['hero', 'projects', 'band'])).toBe(1);
  });

  it('picks the last section once its top has crossed the viewport centre', () => {
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
    stubSection('hero', -3000);
    stubSection('band', -1000);
    stubSection('closing', 200);

    expect(computeActiveSectionIndex(['hero', 'band', 'closing'])).toBe(2);
  });

  it('skips an id with no matching element rather than throwing', () => {
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
    stubSection('hero', 0);

    expect(computeActiveSectionIndex(['hero', 'missing'])).toBe(0);
  });
});
