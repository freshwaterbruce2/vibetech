import { test, expect } from '@playwright/test';

test.describe('Homepage Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display homepage with hero section', async ({ page }) => {
    // Check if hero section is visible
    await expect(page.locator('h1')).toContainText('Vibe Tech');
    
    // Check navigation elements
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('Portfolio')).toBeVisible();
    await expect(page.getByText('Services')).toBeVisible();
    await expect(page.getByText('About')).toBeVisible();
    await expect(page.getByText('Contact')).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    // Test Portfolio navigation
    await page.getByText('Portfolio').click();
    await expect(page).toHaveURL(/.*portfolio/);
    
    // Test Services navigation
    await page.goto('/');
    await page.getByText('Services').click();
    await expect(page).toHaveURL(/.*services/);
    
    // Test About navigation
    await page.goto('/');
    await page.getByText('About').click();
    await expect(page).toHaveURL(/.*about/);
  });

  test('should display portfolio preview section', async ({ page }) => {
    const portfolioSection = page.locator('[data-testid="portfolio-section"]');
    await expect(portfolioSection).toBeVisible();
    
    // Check for project cards
    const projectCards = page.locator('.project-card');
    await expect(projectCards).toHaveCount(3, { timeout: 10000 });
  });

  test('should display services section', async ({ page }) => {
    const servicesSection = page.locator('[data-testid="services-section"]');
    await expect(servicesSection).toBeVisible();
    
    // Check for service items
    await expect(page.getByText('Web Development')).toBeVisible();
    await expect(page.getByText('Mobile Apps')).toBeVisible();
    await expect(page.getByText('UI/UX Design')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile menu visibility
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(mobileMenuButton).toBeVisible();
    
    // Test mobile navigation
    await mobileMenuButton.click();
    const mobileNav = page.locator('[data-testid="mobile-nav"]');
    await expect(mobileNav).toBeVisible();
  });

  test('should have working theme toggle', async ({ page }) => {
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    
    // Check if theme toggle exists
    await expect(themeToggle).toBeVisible();
    
    // Test theme switching
    await themeToggle.click();
    
    // Verify theme change by checking body class or data attribute
    await expect(page.locator('html')).toHaveAttribute('data-theme', /.+/);
  });
});