import { describe, expect, it } from 'vitest';

import { computeSpineFill, isNodePassed } from './spine';

const VIEWPORT = 800;

describe('computeSpineFill', () => {
  it('is empty while the section is still below the middle of the screen', () => {
    expect(computeSpineFill(VIEWPORT, 1000, VIEWPORT)).toBe(0);
  });

  it('is half full once the midline has crossed half the section', () => {
    expect(computeSpineFill(-100, 1000, VIEWPORT)).toBe(0.5);
  });

  it('is full once the whole section has been scrolled past', () => {
    expect(computeSpineFill(-2000, 1000, VIEWPORT)).toBe(1);
  });

  it('clamps rather than reporting a negative fill for a section far below', () => {
    expect(computeSpineFill(5000, 1000, VIEWPORT)).toBe(0);
  });

  it('returns nothing for a wrapper with no height instead of dividing by zero', () => {
    expect(computeSpineFill(0, 0, VIEWPORT)).toBe(0);
  });
});

describe('isNodePassed', () => {
  it('is false for a node still below the midline', () => {
    expect(isNodePassed(600, VIEWPORT)).toBe(false);
  });

  it('is true once the node has risen past the midline', () => {
    expect(isNodePassed(200, VIEWPORT)).toBe(true);
  });

  it('leads the midline slightly, so a card lights before it is centred', () => {
    expect(isNodePassed(VIEWPORT / 2 + 20, VIEWPORT)).toBe(true);
  });
});
