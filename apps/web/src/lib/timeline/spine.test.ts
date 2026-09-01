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

  it('is still false for a node just short of the midline', () => {
    expect(isNodePassed(VIEWPORT / 2 + 1, VIEWPORT)).toBe(false);
  });
});

/*
 * The two functions answer one question between them, so they are tested
 * together: a card that lights before the rule reaches its dot is the defect
 * this describes, and neither function shows it alone.
 */
describe('the fill and the nodes agree on where the rule is', () => {
  const WRAP_TOP = -300;
  const WRAP_HEIGHT = 1000;

  function fillEdge(): number {
    return WRAP_TOP + computeSpineFill(WRAP_TOP, WRAP_HEIGHT, VIEWPORT) * WRAP_HEIGHT;
  }

  it('lights a node exactly at the fill’s leading edge', () => {
    expect(isNodePassed(fillEdge(), VIEWPORT)).toBe(true);
  });

  it('leaves a node one pixel below that edge unlit', () => {
    expect(isNodePassed(fillEdge() + 1, VIEWPORT)).toBe(false);
  });
});
