import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./tests/setup.js'],
    testTimeout: 15000,
    // bcrypt cost 12 ≈ 2s per hash; a cabinets beforeEach registers+logs in 7
    // users (~14s wall time), so hooks need more headroom than the default.
    hookTimeout: 60000,
  },
});
