import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  testMatch: 'test-dashboard.spec.ts',
  use: {
    ...devices['Desktop Chrome'],
    headless: true,
  },
});
