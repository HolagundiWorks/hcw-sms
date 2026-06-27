import { defineConfig } from 'vitest/config';

// API + DB tests for LEOS. A single isolated server is started in
// tests/global/vitest-global.ts and shared with all tests.
//
// Scope a run with a path:  `vitest run tests/api`  /  `vitest run tests/db`.
export default defineConfig({
  test: {
    globalSetup: ['./tests/global/vitest-global.ts'],
    include: ['tests/api/**/*.spec.ts', 'tests/db/**/*.spec.ts'],
    // The shared server is the single point of contention; keep DB assertions
    // deterministic by running test files serially.
    fileParallelism: false,
    reporters: process.env.CI ? ['default', 'json'] : ['default'],
    outputFile: { json: 'tests/reports/vitest/results.json' },
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
