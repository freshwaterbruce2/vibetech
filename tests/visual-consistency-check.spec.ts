import { test, expect } from '@playwright/test';

test.describe('Visual Consistency Analysis', () => {
  test('Compare Services page design with other pages', async ({ page }) => {
    const baseURL = 'http://localhost:8082';
    
    // Test responsive design on desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Capture About page (reference design)
    await page.goto(`${baseURL}/about`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'tests/screenshots/about-page-desktop.png',
      fullPage: true 
    });

    // Capture Portfolio page (reference design)
    await page.goto(`${baseURL}/portfolio`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'tests/screenshots/portfolio-page-desktop.png',
      fullPage: true 
    });

    // Capture current Services page
    await page.goto(`${baseURL}/services`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'tests/screenshots/services-page-desktop.png',
      fullPage: true 
    });

    // Test mobile responsive design
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${baseURL}/about`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'tests/screenshots/about-page-mobile.png',
      fullPage: true 
    });

    await page.goto(`${baseURL}/services`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'tests/screenshots/services-page-mobile.png',
      fullPage: true 
    });

    // Analyze header consistency
    const aboutHeader = await page.locator('h1').first();
    const aboutHeaderStyles = await aboutHeader.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        textAlign: styles.textAlign,
        marginBottom: styles.marginBottom
      };
    });

    console.log('About page header styles:', aboutHeaderStyles);

    // Check for consistent section spacing
    const sections = await page.locator('section').count();
    console.log(`Number of sections on About page: ${sections}`);

    // Move to Services page and compare
    await page.goto(`${baseURL}/services`);
    await page.waitForLoadState('networkidle');

    const servicesHeader = await page.locator('h1').first();
    const servicesHeaderStyles = await servicesHeader.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        textAlign: styles.textAlign,
        marginBottom: styles.marginBottom
      };
    });

    console.log('Services page header styles:', servicesHeaderStyles);
  });

  test('Check for design pattern inconsistencies', async ({ page }) => {
    await page.goto('http://localhost:8082/services');
    await page.waitForLoadState('networkidle');

    // Check if PageHeader component is used
    const pageHeader = await page.locator('.gradient-text-full, .neon-text-glow').count();
    console.log(`PageHeader gradient text elements: ${pageHeader}`);

    // Check section padding consistency
    const sectionPadding = await page.evaluate(() => {
      const sections = document.querySelectorAll('section');
      const paddingStyles = [];
      sections.forEach((section, index) => {
        const styles = window.getComputedStyle(section);
        paddingStyles.push({
          section: index,
          paddingTop: styles.paddingTop,
          paddingBottom: styles.paddingBottom,
          paddingLeft: styles.paddingLeft,
          paddingRight: styles.paddingRight
        });
      });
      return paddingStyles;
    });

    console.log('Section padding styles:', paddingStyles);

    // Check container width consistency
    const containerWidths = await page.evaluate(() => {
      const containers = document.querySelectorAll('.max-w-6xl, .max-w-7xl, .max-w-4xl, .max-w-5xl');
      const widths = [];
      containers.forEach((container, index) => {
        const styles = window.getComputedStyle(container);
        widths.push({
          container: index,
          maxWidth: styles.maxWidth,
          className: container.className
        });
      });
      return widths;
    });

    console.log('Container width styles:', containerWidths);
  });
});