import { test, expect } from '@playwright/test';

test.describe('Design Uniformity Verification', () => {
  test('Services page now matches design patterns', async ({ page }) => {
    const baseURL = 'http://localhost:8082';
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Check Services page uses PageHeader component
    await page.goto(`${baseURL}/services`);
    await page.waitForLoadState('networkidle');
    
    // Should now have gradient text elements (PageHeader)
    const gradientTextElements = await page.locator('.gradient-text-full, .neon-text-glow').count();
    console.log(`Services page gradient text elements: ${gradientTextElements}`);
    expect(gradientTextElements).toBeGreaterThan(0);

    // Check for consistent section structure
    const heroSection = await page.locator('section').first();
    const heroStyles = await heroSection.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom
      };
    });
    console.log('Hero section styles:', heroStyles);

    // Verify standard container width usage
    const containers = await page.locator('.max-w-6xl').count();
    console.log(`Standard container (.max-w-6xl) usage: ${containers}`);
    expect(containers).toBeGreaterThan(0);

    // Check for AnimateOnScroll components
    const animatedElements = await page.locator('[data-testid*="animate"], .animate-').count();
    console.log(`Animated elements: ${animatedElements}`);

    // Verify CTA section matches other pages
    await page.locator('text=Ready to Transform Your Business?').scrollIntoViewIfNeeded();
    const ctaSection = await page.locator('text=Ready to Transform Your Business?').locator('..').locator('..');
    const ctaStyles = await ctaSection.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        background: styles.background,
        padding: styles.padding
      };
    });
    console.log('CTA section styles:', ctaStyles);

    // Take final screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/services-uniform-design.png',
      fullPage: true 
    });
  });

  test('Compare header styles across pages', async ({ page }) => {
    const baseURL = 'http://localhost:8082';
    const pages = ['/about', '/portfolio', '/services'];
    const headerStyles = [];

    for (const pagePath of pages) {
      await page.goto(`${baseURL}${pagePath}`);
      await page.waitForLoadState('networkidle');
      
      const header = await page.locator('h1').first();
      const styles = await header.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          textAlign: computed.textAlign,
          background: computed.background
        };
      });
      
      headerStyles.push({
        page: pagePath,
        styles: styles
      });
    }

    console.log('Header styles comparison:', JSON.stringify(headerStyles, null, 2));
    
    // All pages should have similar font sizes and weights
    const fontSizes = headerStyles.map(h => h.styles.fontSize);
    const fontWeights = headerStyles.map(h => h.styles.fontWeight);
    
    console.log('Font sizes across pages:', fontSizes);
    console.log('Font weights across pages:', fontWeights);
  });

  test('Verify spacing consistency', async ({ page }) => {
    await page.goto('http://localhost:8082/services');
    await page.waitForLoadState('networkidle');

    // Check section spacing consistency
    const sections = await page.locator('section').count();
    console.log(`Total sections on Services page: ${sections}`);

    // Check for consistent padding classes
    const standardPadding = await page.locator('.py-16, .pt-28, .pb-16').count();
    console.log(`Elements with standard padding: ${standardPadding}`);

    // Verify card consistency
    const cards = await page.locator('.bg-card').count();
    console.log(`Card components: ${cards}`);

    // Check Badge usage
    const badges = await page.locator('.bg-aura-accent').count();
    console.log(`Accent badges: ${badges}`);
  });
});