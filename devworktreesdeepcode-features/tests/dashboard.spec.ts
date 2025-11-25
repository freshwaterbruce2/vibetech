import { test, expect } from '@playwright/test';

test.describe('Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display dashboard with metrics', async ({ page }) => {
    // Check dashboard header
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check metrics cards
    const metricsCards = page.locator('[data-testid="metric-card"]');
    await expect(metricsCards).toHaveCount(4, { timeout: 10000 });
    
    // Check specific metrics
    await expect(page.getByText('Total Leads')).toBeVisible();
    await expect(page.getByText('New Leads Today')).toBeVisible();
    await expect(page.getByText('Conversion Rate')).toBeVisible();
    await expect(page.getByText('Avg Response Time')).toBeVisible();
  });

  test('should display leads table', async ({ page }) => {
    // Wait for leads table to load
    const leadsTable = page.locator('[data-testid="leads-table"]');
    await expect(leadsTable).toBeVisible({ timeout: 15000 });
    
    // Check table headers
    await expect(page.getByText('Name')).toBeVisible();
    await expect(page.getByText('Email')).toBeVisible();
    await expect(page.getByText('Source')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
  });

  test('should allow adding new lead', async ({ page }) => {
    // Click add lead button
    const addLeadButton = page.getByRole('button', { name: /add.*lead/i });
    await addLeadButton.click();
    
    // Fill out form
    await page.fill('[data-testid="company-name"]', 'Test Company');
    await page.fill('[data-testid="contact-name"]', 'John Doe');
    await page.fill('[data-testid="contact-email"]', 'john@example.com');
    await page.fill('[data-testid="phone"]', '555-0123');
    
    // Submit form
    await page.getByRole('button', { name: /save|submit/i }).click();
    
    // Verify lead was added
    await expect(page.getByText('Test Company')).toBeVisible({ timeout: 10000 });
  });

  test('should allow switching between tabs', async ({ page }) => {
    // Test Overview tab
    const overviewTab = page.getByRole('tab', { name: 'Overview' });
    await overviewTab.click();
    await expect(page.locator('[data-testid="overview-content"]')).toBeVisible();
    
    // Test Leads tab
    const leadsTab = page.getByRole('tab', { name: 'Leads' });
    await leadsTab.click();
    await expect(page.locator('[data-testid="leads-content"]')).toBeVisible();
    
    // Test Analytics tab
    const analyticsTab = page.getByRole('tab', { name: 'Analytics' });
    await analyticsTab.click();
    await expect(page.locator('[data-testid="analytics-content"]')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and return errors
    await page.route('/api/leads', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
    
    // Reload page to trigger API call
    await page.reload();
    
    // Check for error handling
    await expect(page.getByText(/error|failed/i)).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile layout
    const dashboardContent = page.locator('[data-testid="dashboard-content"]');
    await expect(dashboardContent).toBeVisible();
    
    // Check metrics stack vertically on mobile
    const metricsGrid = page.locator('[data-testid="metrics-grid"]');
    const boundingBox = await metricsGrid.boundingBox();
    expect(boundingBox?.width).toBeLessThan(400);
  });
});