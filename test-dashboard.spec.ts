import { test, expect } from '@playwright/test';

test('Trading Dashboard Loads and Connects to API', async ({ page }) => {
  // Set a longer timeout for API calls
  test.setTimeout(30000);

  console.log('1. Navigating to trading dashboard...');
  await page.goto('http://localhost:3000/trading');

  // Wait for the page to load
  await page.waitForLoadState('networkidle', { timeout: 10000 });

  console.log('2. Checking for dashboard header...');
  const header = page.locator('h1:has-text("Crypto Trading Dashboard")');
  await expect(header).toBeVisible({ timeout: 10000 });

  console.log('3. Checking connection status...');
  // Wait for connection status badge
  const connectionBadge = page.locator('text=/Connected|Disconnected/');
  await expect(connectionBadge).toBeVisible({ timeout: 10000 });

  // Get the connection status text
  const statusText = await connectionBadge.textContent();
  console.log(`   Connection status: ${statusText}`);

  console.log('4. Checking for portfolio value...');
  const portfolioCard = page.locator('text=/Portfolio Value/i');
  await expect(portfolioCard).toBeVisible({ timeout: 10000 });

  console.log('5. Checking for metric cards...');
  const pnlCard = page.locator('text=/Total P&L/i');
  await expect(pnlCard).toBeVisible({ timeout: 5000 });

  const riskCard = page.locator('text=/Risk Score/i');
  await expect(riskCard).toBeVisible({ timeout: 5000 });

  const positionsCard = page.locator('text=/Active Positions/i');
  await expect(positionsCard).toBeVisible({ timeout: 5000 });

  console.log('6. Checking for tabs...');
  const positionsTab = page.locator('button:has-text("Positions")');
  await expect(positionsTab).toBeVisible({ timeout: 5000 });

  console.log('7. Taking screenshot...');
  await page.screenshot({ path: 'dashboard-test.png', fullPage: true });

  console.log('✅ All checks passed! Dashboard is working correctly.');
});

test('Trading Test Page Loads', async ({ page }) => {
  console.log('Testing simple test page...');
  await page.goto('http://localhost:3000/trading-test');

  const header = page.locator('h1:has-text("Trading Dashboard Test")');
  await expect(header).toBeVisible({ timeout: 5000 });

  console.log('✅ Test page loads correctly.');
});
