import { test, expect } from '@playwright/test';

test('verify dev server loads without CSS errors', async ({ page }) => {
  // Listen for console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Listen for page errors
  const pageErrors: Error[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error);
  });

  // Navigate to the dev server
  await page.goto('http://localhost:5181', { waitUntil: 'networkidle' });

  // Wait for the page to fully load
  await page.waitForLoadState('domcontentloaded');

  // Check that no CSS compilation errors occurred
  const hasCSSError = errors.some(error =>
    error.includes('border-border') ||
    error.includes('Cannot apply unknown utility')
  );

  // Check that page errors don't include CSS issues
  const hasCSSPageError = pageErrors.some(error =>
    error.message.includes('border-border') ||
    error.message.includes('Cannot apply unknown utility')
  );

  // Verify the page title loaded
  const title = await page.title();
  console.log('Page title:', title);

  // Take a screenshot for verification
  await page.screenshot({ path: 'dev-server-verification.png', fullPage: false });

  // Assertions
  expect(hasCSSError).toBe(false);
  expect(hasCSSPageError).toBe(false);
  expect(title).toBeTruthy();

  console.log('✓ Dev server loaded successfully');
  console.log('✓ No border-border errors found');
  console.log('✓ CSS compiled correctly');
  console.log(`✓ Total console errors: ${errors.length}`);
  console.log(`✓ Total page errors: ${pageErrors.length}`);
});
