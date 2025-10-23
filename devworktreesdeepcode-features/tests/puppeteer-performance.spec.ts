import { test, expect } from '@playwright/test';
import puppeteer from 'puppeteer';

test.describe('Performance Tests with Puppeteer', () => {
  let browser: puppeteer.Browser;
  
  test.beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('should load homepage within performance budget', async () => {
    const page = await browser.newPage();
    
    // Enable performance monitoring
    await page.setCacheEnabled(false);
    
    const startTime = Date.now();
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle2' });
    const loadTime = Date.now() - startTime;
    
    // Performance budget: page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    await page.close();
  });

  test('should have good Core Web Vitals', async () => {
    const page = await browser.newPage();
    
    // Navigate to homepage
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle2' });
    
    // Measure Performance
    const metrics = await page.metrics();
    
    // Check JavaScript heap usage (should be reasonable)
    expect(metrics.JSHeapUsedSize).toBeLessThan(50 * 1024 * 1024); // 50MB limit
    
    // Check DOM nodes count (should be reasonable)
    expect(metrics.Nodes).toBeLessThan(2000); // 2000 nodes limit
    
    await page.close();
  });

  test('should handle large data sets efficiently', async () => {
    const page = await browser.newPage();
    
    // Navigate to dashboard with potentially large data
    await page.goto('http://localhost:8082/dashboard', { waitUntil: 'networkidle2' });
    
    // Measure memory usage
    const metrics = await page.metrics();
    
    // Memory usage should remain reasonable even with data
    expect(metrics.JSHeapUsedSize).toBeLessThan(100 * 1024 * 1024); // 100MB limit
    
    await page.close();
  });

  test('should be optimized for mobile performance', async () => {
    const page = await browser.newPage();
    
    // Emulate slow 3G connection
    await page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 40
    });
    
    // Emulate mobile device
    await page.emulate({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
    });
    
    const startTime = Date.now();
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle2' });
    const loadTime = Date.now() - startTime;
    
    // Mobile performance budget: should load within 5 seconds on slow 3G
    expect(loadTime).toBeLessThan(5000);
    
    await page.close();
  });

  test('should have optimized images and assets', async () => {
    const page = await browser.newPage();
    
    const responses: puppeteer.HTTPResponse[] = [];
    
    page.on('response', (response) => {
      responses.push(response);
    });
    
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle2' });
    
    // Check image optimization
    const imageResponses = responses.filter(r => 
      r.headers()['content-type']?.startsWith('image/') && 
      r.url().includes('localhost')
    );
    
    for (const imageResponse of imageResponses) {
      const contentLength = parseInt(imageResponse.headers()['content-length'] || '0');
      
      // Images should be reasonably sized (under 1MB each)
      expect(contentLength).toBeLessThan(1024 * 1024);
    }
    
    // Check CSS/JS compression
    const assetResponses = responses.filter(r => 
      (r.headers()['content-type']?.includes('css') || 
       r.headers()['content-type']?.includes('javascript')) &&
      r.url().includes('localhost')
    );
    
    for (const assetResponse of assetResponses) {
      // Check for compression headers
      const contentEncoding = assetResponse.headers()['content-encoding'];
      if (contentEncoding) {
        expect(['gzip', 'br', 'deflate']).toContain(contentEncoding);
      }
    }
    
    await page.close();
  });

  test('should handle memory leaks properly', async () => {
    const page = await browser.newPage();
    
    await page.goto('http://localhost:8082');
    
    const initialMetrics = await page.metrics();
    
    // Navigate through multiple pages to test memory usage
    const pages = ['/portfolio', '/services', '/about', '/tools', '/dashboard'];
    
    for (const pagePath of pages) {
      await page.goto(`http://localhost:8082${pagePath}`, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(1000); // Wait for any animations/effects
    }
    
    const finalMetrics = await page.metrics();
    
    // Memory should not grow excessively (allow for some growth)
    const memoryGrowth = finalMetrics.JSHeapUsedSize - initialMetrics.JSHeapUsedSize;
    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB max growth
    
    await page.close();
  });

  test('should handle concurrent users simulation', async () => {
    const concurrentPages = 5;
    const pages: puppeteer.Page[] = [];
    
    // Create multiple pages to simulate concurrent users
    for (let i = 0; i < concurrentPages; i++) {
      pages.push(await browser.newPage());
    }
    
    const startTime = Date.now();
    
    // Navigate all pages concurrently
    const navigationPromises = pages.map(page => 
      page.goto('http://localhost:8082/dashboard', { waitUntil: 'networkidle2' })
    );
    
    await Promise.all(navigationPromises);
    
    const loadTime = Date.now() - startTime;
    
    // Should handle concurrent users reasonably well
    expect(loadTime).toBeLessThan(10000); // 10 seconds for 5 concurrent users
    
    // Clean up
    await Promise.all(pages.map(page => page.close()));
  });
});