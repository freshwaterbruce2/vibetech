import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests/visual',

  // Test match pattern
  testMatch: '**/*.visual.test.js',

  // Parallel execution
  fullyParallel: true,

  // Fail on CI if accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Parallel workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'tests/visual/reports' }],
    ['json', { outputFile: 'tests/visual/results.json' }],
    ['list']
  ],

  // Shared settings for all projects
  use: {
    // Base URL for testing
    baseURL: process.env.BASE_URL || 'http://localhost:5563',

    // Trace configuration
    trace: 'on-first-retry',

    // Screenshot configuration
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true
    },

    // Video configuration
    video: process.env.CI ? 'retain-on-failure' : 'off',

    // Visual comparison settings
    ignoreHTTPSErrors: true,

    // Viewport size
    viewport: { width: 1280, height: 720 }
  },

  // Visual testing specific configuration
  expect: {
    // Threshold for pixel differences (0.2% tolerance)
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide'
    }
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Store screenshots per browser
        screenshotsPath: './tests/visual/screenshots/chromium'
      }
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        screenshotsPath: './tests/visual/screenshots/firefox'
      }
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        screenshotsPath: './tests/visual/screenshots/webkit'
      }
    },

    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        screenshotsPath: './tests/visual/screenshots/mobile-chrome'
      }
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        screenshotsPath: './tests/visual/screenshots/mobile-safari'
      }
    }
  ],

  // Web Server configuration
  webServer: {
    command: 'npm run start',
    port: 5563,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
});