import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

/**
 * Testing Library auto-cleans only when Vitest runs with `globals: true`. It
 * does not here, so without this every `render` in a file stacks into the same
 * document and the second query finds two of everything.
 */
afterEach(cleanup);

/**
 * `next/font/google` is a build-time transform the Next compiler performs, not
 * a runtime module — calling it under Vitest throws. The tests care about what
 * the layout does with the returned class name, not about the font pipeline, so
 * a stub returning a stable variable is the whole contract.
 */
vi.mock('next/font/google', () => ({
  Inter_Tight: () => ({ variable: 'font-sans', className: 'font-sans' }),
  Newsreader: () => ({ variable: 'font-serif', className: 'font-serif' }),
}));
