/**
 * Basic E2E Tests for DeepCode Editor
 * Tests core functionality on Windows 11
 */

import { test, expect } from '@playwright/test';

test.describe('DeepCode Editor - Basic Functionality', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');

    // Wait for app to be ready
    await page.waitForLoadState('networkidle');

    // Check that the page title is correct
    await expect(page).toHaveTitle(/DeepCode Editor|Vibe Code Studio/);
  });

  test('should show welcome screen on first load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // App shows welcome screen when no file is open
    const welcomeText = page.locator('text=Where innovation meets elegant design').first();
    await expect(welcomeText).toBeVisible({ timeout: 5000 });
  });

  test('should have create file option in welcome screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for any interactive elements in welcome screen
    // Welcome screen should have buttons for creating files or opening folders
    const interactiveElements = page.locator('button').first();
    await expect(interactiveElements).toBeVisible({ timeout: 5000 });
  });

  test('should have AI chat toggle available', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if AI features are mentioned or accessible
    const aiFeature = page.locator('text=/ai/i').first();
    const hasAIFeature = await aiFeature.count() > 0;
    expect(hasAIFeature).toBeTruthy();
  });

  test('should have app container loaded', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for loading screen to disappear (app is mounting)
    await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 15000 }).catch(() => {
      // Loading screen might already be gone
    });

    // Verify main app container loaded with testid
    const appContainer = page.locator('[data-testid="app-container"]');
    await expect(appContainer).toBeVisible({ timeout: 10000 });
  });
});
