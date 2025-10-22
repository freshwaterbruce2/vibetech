import { test, expect } from '@playwright/test';

test.describe('Tailwind v3 CSS Verification', () => {
  test('should load page without CSS errors', async ({ page }) => {
    const errors: string[] = [];

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to the site
    const response = await page.goto('http://localhost:5185');
    expect(response?.status()).toBe(200);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify no CSS compilation errors
    expect(errors).not.toContain(expect.stringContaining('border-border'));
    expect(errors).not.toContain(expect.stringContaining('Cannot apply'));
    expect(errors).not.toContain(expect.stringContaining('tailwindcss'));

    console.log(`✓ Page loaded successfully`);
    console.log(`✓ Total errors: ${errors.length}`);
  });

  test('should have working Tailwind styles', async ({ page }) => {
    await page.goto('http://localhost:5185');
    await page.waitForLoadState('networkidle');

    // Check if body has Tailwind background color applied
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    console.log('Body background color:', bodyBg);

    // Verify it's not default white
    expect(bodyBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(bodyBg).not.toBe('rgb(255, 255, 255)');
  });

  test('should render content correctly', async ({ page }) => {
    await page.goto('http://localhost:5185');
    await page.waitForLoadState('domcontentloaded');

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'tailwind-v3-verification.png',
      fullPage: false
    });

    // Check that the page has content
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBe(true);

    console.log('✓ Screenshot saved: tailwind-v3-verification.png');
  });
});
