import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory for feature tests
  testDir: './tests',

  // Match our comprehensive feature test
  testMatch: '**/comprehensive-feature-test.js',

  // Run tests in parallel
  fullyParallel: true,

  // Retry configuration
  retries: process.env.CI ? 2 : 0,

  // Workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'test-results' }],
    ['list']
  ],

  // Global test timeout
  timeout: 90000, // 90 seconds per test

  // Shared settings
  use: {
    // Use existing server on port 3005
    baseURL: 'http://localhost:3005',

    // Trace on retry
    trace: 'on-first-retry',

    // Screenshots on failure
    screenshot: 'only-on-failure',

    // Viewport
    viewport: { width: 1280, height: 720 }
  },

  // Configure for Chromium only for now
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],

  // No web server - use existing running server
  // webServer: undefined
});
