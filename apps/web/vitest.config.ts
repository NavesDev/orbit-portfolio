import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'web',
    // The default for components. `middleware.test.ts` opts out per file with
    // an `@vitest-environment node` docblock, because `NextRequest` needs Web
    // APIs rather than a DOM.
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.tsx', 'src/**/*.test.ts'],
    exclude: ['e2e/**'],
  },
});
