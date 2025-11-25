import { test, expect } from '@playwright/test';

/**
 * Basic Agent Mode Functionality Tests
 *
 * Tests core Agent Mode features with existing DOM structure
 */

test.describe('Agent Mode - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (uses baseURL from playwright.config.ts)
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for app to load
    await page.waitForTimeout(2000);
  });

  test('should open Agent Mode with keyboard shortcut', async ({ page }) => {
    // Open Agent Mode with Ctrl+Shift+A
    await page.keyboard.press('Control+Shift+A');

    // Wait for AI Chat panel to appear
    await page.waitForTimeout(1000);

    // Verify AI Chat is visible (check for common elements)
    const chatVisible = await page.locator('text=AI Assistant').or(page.locator('text=Agent Mode')).isVisible();
    expect(chatVisible).toBeTruthy();
  });

  test('should execute simple file read task', async ({ page }) => {
    // Open Agent Mode
    await page.keyboard.press('Control+Shift+A');
    await page.waitForTimeout(1000);

    // Find chat input - try multiple selectors
    const input = page.locator('textarea').first().or(page.locator('input[type="text"]').first());

    await input.fill('read the package.json file');
    await input.press('Enter');

    // Wait for task to start
    await page.waitForTimeout(2000);

    // Check for task completion indicators
    const completed = await page.locator('text=completed').or(page.locator('text=✅')).waitFor({
      state: 'visible',
      timeout: 30000
    });

    expect(completed).toBeTruthy();
  });

  test('should display task steps during execution', async ({ page }) => {
    // Open Agent Mode
    await page.keyboard.press('Control+Shift+A');
    await page.waitForTimeout(1000);

    // Submit task
    const input = page.locator('textarea').first();
    await input.fill('analyze the vite.config.ts file');
    await input.press('Enter');

    // Wait for task to start
    await page.waitForTimeout(3000);

    // Look for step indicators (numbers, checkmarks, or progress text)
    const hasSteps = await page.locator('text=Step').or(page.locator('text=🔄')).or(page.locator('text=📖')).count();

    expect(hasSteps).toBeGreaterThan(0);
  });

  test('should show AI synthesis after analysis', async ({ page }) => {
    // Open Agent Mode
    await page.keyboard.press('Control+Shift+A');
    await page.waitForTimeout(1000);

    // Submit analysis task
    const input = page.locator('textarea').first();
    await input.fill('review the App.tsx file');
    await input.press('Enter');

    // Wait for analysis to complete
    await page.waitForTimeout(15000);

    // Look for synthesis indicators (code blocks, markdown, or AUTO-GENERATED)
    const hasSynthesis = await page.locator('text=AUTO-GENERATED').or(
      page.locator('text=##').or(
        page.locator('pre').first()
      )
    ).count();

    expect(hasSynthesis).toBeGreaterThan(0);
  });
});

test.describe('Agent Mode - File Operations', () => {
  test('should handle file creation request', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Open Agent Mode
    await page.keyboard.press('Control+Shift+A');
    await page.waitForTimeout(1000);

    // Request file creation
    const input = page.locator('textarea').first();
    await input.fill('create a file called TestComponent.tsx with a simple React component');
    await input.press('Enter');

    // Wait for execution
    await page.waitForTimeout(10000);

    // Check for success indicators
    const hasSuccess = await page.locator('text=created').or(
      page.locator('text=✅').or(
        page.locator('text=TestComponent.tsx')
      )
    ).count();

    expect(hasSuccess).toBeGreaterThan(0);
  });
});

test.describe('Agent Mode - UI Responsiveness', () => {
  test('should not freeze during long-running task', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Open Agent Mode
    await page.keyboard.press('Control+Shift+A');
    await page.waitForTimeout(1000);

    // Submit task
    const input = page.locator('textarea').first();
    await input.fill('analyze all files in src/components/');
    await input.press('Enter');

    // Wait a moment for task to start
    await page.waitForTimeout(3000);

    // Verify input is still editable (UI not frozen)
    const isEditable = await input.isEditable();
    expect(isEditable).toBeTruthy();
  });
});
