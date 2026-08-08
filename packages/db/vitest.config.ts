import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'db',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Integration tests share one database; parallel files would race on schema.
    fileParallelism: false,
  },
});
