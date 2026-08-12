import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

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
