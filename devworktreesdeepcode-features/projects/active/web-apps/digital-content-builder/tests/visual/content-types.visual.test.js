import { test, expect } from '@playwright/test';

test.describe('Digital Content Builder - Visual Regression Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('Landing page visual consistency', async ({ page }) => {
    // Take full page screenshot
    await expect(page).toHaveScreenshot('landing-page-full.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Content type selector grid', async ({ page }) => {
    // Screenshot the content type selector area
    const contentSelector = page.locator('.content-selector');
    await expect(contentSelector).toHaveScreenshot('content-type-grid.png');
  });

  test('All content type buttons', async ({ page }) => {
    const contentTypes = [
      'blog', 'landing', 'email', 'social', 'code',
      'documentation', 'product', 'marketing', 'general'
    ];

    for (const type of contentTypes) {
      const button = page.locator(`[data-type="${type}"]`);
      await button.scrollIntoViewIfNeeded();
      await expect(button).toHaveScreenshot(`button-${type}.png`);
    }
  });

  test('Header with glassmorphism effect', async ({ page }) => {
    const header = page.locator('.header');
    await expect(header).toHaveScreenshot('header-glassmorphism.png');
  });

  test('Input area with prompt field', async ({ page }) => {
    const inputArea = page.locator('.input-area');
    await expect(inputArea).toHaveScreenshot('input-area.png');

    // Test with typed text
    await page.fill('#prompt', 'Sample prompt for testing visual consistency');
    await expect(inputArea).toHaveScreenshot('input-area-with-text.png');
  });

  test('View mode buttons', async ({ page }) => {
    const viewButtons = page.locator('.view-buttons');
    await expect(viewButtons).toHaveScreenshot('view-buttons.png');

    // Test each view mode
    const views = ['preview', 'code', 'split'];
    for (const view of views) {
      await page.click(`[onclick="setViewMode('${view}')"]`);
      await page.waitForTimeout(300); // Allow animation to complete
      await expect(viewButtons).toHaveScreenshot(`view-buttons-${view}-active.png`);
    }
  });

  test('Export dropdown menu', async ({ page }) => {
    // Click export button to show dropdown
    await page.click('.export-btn');
    await page.waitForTimeout(300); // Allow animation

    const dropdown = page.locator('.export-dropdown');
    await expect(dropdown).toHaveScreenshot('export-dropdown.png');
  });

  test('Generated content display', async ({ page }) => {
    // Generate sample content
    await page.fill('#prompt', 'Create a brief welcome message');
    await page.click('[data-type="general"]');
    await page.click('.generate-btn');

    // Wait for content to be generated (mock or real)
    await page.waitForTimeout(2000);

    const outputArea = page.locator('.output-area');
    await expect(outputArea).toHaveScreenshot('generated-content.png');
  });

  test('Responsive design - Mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page).toHaveScreenshot('mobile-view.png', {
      fullPage: true
    });

    // Test content selector on mobile
    const contentSelector = page.locator('.content-selector');
    await expect(contentSelector).toHaveScreenshot('mobile-content-selector.png');
  });

  test('Responsive design - Tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await expect(page).toHaveScreenshot('tablet-view.png', {
      fullPage: true
    });
  });

  test('Dark mode toggle (if applicable)', async ({ page }) => {
    // Check if dark mode toggle exists
    const darkModeToggle = page.locator('.dark-mode-toggle');
    const toggleExists = await darkModeToggle.count() > 0;

    if (toggleExists) {
      await darkModeToggle.click();
      await page.waitForTimeout(500); // Allow theme transition
      await expect(page).toHaveScreenshot('dark-mode.png', {
        fullPage: true
      });
    }
  });

  test('Loading states', async ({ page }) => {
    // Intercept API calls to simulate loading
    await page.route('**/api/deepseek/generate', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ content: 'Test content' })
        });
      }, 5000);
    });

    await page.fill('#prompt', 'Test prompt');
    await page.click('[data-type="general"]');
    await page.click('.generate-btn');

    // Capture loading state
    await page.waitForTimeout(100);
    const outputArea = page.locator('.output-area');
    await expect(outputArea).toHaveScreenshot('loading-state.png');
  });

  test('Error states', async ({ page }) => {
    // Simulate API error
    await page.route('**/api/deepseek/generate', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    await page.fill('#prompt', 'Test prompt');
    await page.click('[data-type="general"]');
    await page.click('.generate-btn');

    await page.waitForTimeout(500);
    const errorMessage = page.locator('.error-message, .output-area');
    await expect(errorMessage).toHaveScreenshot('error-state.png');
  });

  test('Hover states for interactive elements', async ({ page }) => {
    // Test hover on content type buttons
    const blogButton = page.locator('[data-type="blog"]');
    await blogButton.hover();
    await expect(blogButton).toHaveScreenshot('button-blog-hover.png');

    // Test hover on generate button
    const generateBtn = page.locator('.generate-btn');
    await generateBtn.hover();
    await expect(generateBtn).toHaveScreenshot('generate-button-hover.png');
  });

  test('Focus states for accessibility', async ({ page }) => {
    // Test focus on input field
    await page.focus('#prompt');
    const inputArea = page.locator('.input-area');
    await expect(inputArea).toHaveScreenshot('input-focus-state.png');

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const activeElement = page.locator(':focus');
    await expect(activeElement).toHaveScreenshot('keyboard-focus.png');
  });
});

test.describe('Cross-browser visual consistency', () => {
  const contentTypes = ['blog', 'social', 'email'];

  contentTypes.forEach(type => {
    test(`${type} content generation across browsers`, async ({ page, browserName }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.fill('#prompt', `Test ${type} content`);
      await page.click(`[data-type="${type}"]`);

      // Screenshot with browser name in filename
      await expect(page).toHaveScreenshot(`${type}-${browserName}.png`, {
        fullPage: false,
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      });
    });
  });
});