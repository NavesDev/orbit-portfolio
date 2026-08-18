import { describe, expect, it } from 'vitest';

import { COUNT_UP_STEPS, figureAtStep, isCountComplete } from './count-up';

describe('figureAtStep', () => {
  it('starts at zero and lands exactly on the target', () => {
    expect(figureAtStep(1230, 0)).toBe(0);
    expect(figureAtStep(1230, COUNT_UP_STEPS)).toBe(1230);
  });

  it('never overshoots, however many steps it is asked for', () => {
    expect(figureAtStep(50, COUNT_UP_STEPS * 3)).toBe(50);
  });

  it('takes the same number of steps whatever the figure — a 4 counts, not jumps', () => {
    expect(figureAtStep(4, COUNT_UP_STEPS / 2)).toBe(2);
    expect(figureAtStep(1230, COUNT_UP_STEPS / 2)).toBe(615);
  });
});

describe('isCountComplete', () => {
  it('is done only at the last step', () => {
    expect(isCountComplete(COUNT_UP_STEPS - 1)).toBe(false);
    expect(isCountComplete(COUNT_UP_STEPS)).toBe(true);
  });
});
