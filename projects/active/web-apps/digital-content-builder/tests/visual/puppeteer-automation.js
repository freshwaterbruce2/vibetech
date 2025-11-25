import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DesignAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
    this.screenshotDir = path.join(__dirname, 'screenshots', 'puppeteer');
  }

  async initialize() {
    // Create screenshot directory if it doesn't exist
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }

    // Launch browser with specific viewport
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2 // High DPI for better screenshots
    });

    // Set up console logging
    this.page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    this.page.on('error', err => console.error('PAGE ERROR:', err));
  }

  async captureDesignSystem() {
    await this.page.goto('http://localhost:5564', {
      waitUntil: 'networkidle0'
    });

    const designElements = {
      // Color palette extraction
      colors: await this.extractColors(),

      // Typography analysis
      typography: await this.extractTypography(),

      // Spacing and layout metrics
      spacing: await this.extractSpacing(),

      // Component inventory
      components: await this.captureComponents(),

      // Animation timings
      animations: await this.extractAnimations()
    };

    // Save design system data
    fs.writeFileSync(
      path.join(__dirname, 'design-system.json'),
      JSON.stringify(designElements, null, 2)
    );

    return designElements;
  }

  async extractColors() {
    return await this.page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      const colors = {};

      // Extract CSS custom properties (variables)
      for (const prop of styles) {
        if (prop.startsWith('--') && prop.includes('color') || prop.includes('primary') || prop.includes('secondary')) {
          colors[prop] = styles.getPropertyValue(prop);
        }
      }

      // Extract actual used colors from elements
      const elements = document.querySelectorAll('*');
      const usedColors = new Set();

      elements.forEach(el => {
        const computed = getComputedStyle(el);
        usedColors.add(computed.color);
        usedColors.add(computed.backgroundColor);
        usedColors.add(computed.borderColor);
      });

      return {
        variables: colors,
        used: Array.from(usedColors).filter(c => c && c !== 'rgba(0, 0, 0, 0)')
      };
    });
  }

  async extractTypography() {
    return await this.page.evaluate(() => {
      const typographyMap = new Map();

      document.querySelectorAll('*').forEach(el => {
        const computed = getComputedStyle(el);
        const tag = el.tagName.toLowerCase();

        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'button', 'a'].includes(tag)) {
          typographyMap.set(tag, {
            fontFamily: computed.fontFamily,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            lineHeight: computed.lineHeight,
            letterSpacing: computed.letterSpacing
          });
        }
      });

      return Object.fromEntries(typographyMap);
    });
  }

  async extractSpacing() {
    return await this.page.evaluate(() => {
      const spacingPatterns = new Set();

      document.querySelectorAll('*').forEach(el => {
        const computed = getComputedStyle(el);
        spacingPatterns.add(computed.padding);
        spacingPatterns.add(computed.margin);
        spacingPatterns.add(computed.gap);
      });

      return Array.from(spacingPatterns).filter(s => s && s !== '0px');
    });
  }

  async captureComponents() {
    const components = [];

    // Capture each content type button
    const contentTypes = ['blog', 'landing', 'email', 'social', 'code',
                          'documentation', 'product', 'marketing', 'general'];

    for (const type of contentTypes) {
      const selector = `[data-type="${type}"]`;
      try {
        await this.page.waitForSelector(selector, { timeout: 5000 });
        const element = await this.page.$(selector);

        if (element) {
          // Capture component screenshot
          await element.screenshot({
            path: path.join(this.screenshotDir, `component-${type}.png`)
          });

          // Get component dimensions and styles
          const componentData = await this.page.evaluate((sel) => {
            const el = document.querySelector(sel);
            const rect = el.getBoundingClientRect();
            const styles = getComputedStyle(el);

            return {
              width: rect.width,
              height: rect.height,
              borderRadius: styles.borderRadius,
              boxShadow: styles.boxShadow,
              background: styles.background
            };
          }, selector);

          components.push({
            type,
            ...componentData
          });
        }
      } catch (e) {
        console.log(`Component ${type} not found`);
      }
    }

    return components;
  }

  async extractAnimations() {
    return await this.page.evaluate(() => {
      const animations = [];

      document.querySelectorAll('*').forEach(el => {
        const computed = getComputedStyle(el);

        if (computed.transition !== 'none' && computed.transition !== 'all 0s ease 0s') {
          animations.push({
            selector: el.className || el.tagName.toLowerCase(),
            transition: computed.transition,
            transform: computed.transform,
            animation: computed.animation
          });
        }
      });

      return animations;
    });
  }

  async performVisualTest(testName, actions) {
    console.log(`Running visual test: ${testName}`);

    // Take before screenshot
    await this.page.screenshot({
      path: path.join(this.screenshotDir, `${testName}-before.png`),
      fullPage: true
    });

    // Perform actions
    if (actions) {
      await actions(this.page);
    }

    // Take after screenshot
    await this.page.screenshot({
      path: path.join(this.screenshotDir, `${testName}-after.png`),
      fullPage: true
    });
  }

  async testContentGeneration() {
    await this.performVisualTest('content-generation', async (page) => {
      // Type a prompt
      await page.type('#prompt', 'Create a professional blog post about AI');

      // Select blog type
      await page.click('[data-type="blog"]');

      // Click generate
      await page.click('.generate-btn');

      // Wait for content
      await new Promise(resolve => setTimeout(resolve, 3000));
    });
  }

  async testResponsiveDesign() {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'ultrawide', width: 3440, height: 1440 }
    ];

    for (const viewport of viewports) {
      await this.page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1
      });

      await this.page.screenshot({
        path: path.join(this.screenshotDir, `responsive-${viewport.name}.png`),
        fullPage: true
      });
    }
  }

  async generateDesignReport() {
    const report = {
      timestamp: new Date().toISOString(),
      designSystem: await this.captureDesignSystem(),
      tests: {
        contentGeneration: 'completed',
        responsiveDesign: 'completed'
      }
    };

    // Generate HTML report
    const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>Design System Report</title>
  <style>
    body {
      font-family: 'Inter', system-ui, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: #f9fafb;
    }
    h1 { color: #111827; }
    h2 { color: #374151; margin-top: 2rem; }
    .color-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }
    .color-swatch {
      padding: 1rem;
      border-radius: 8px;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .color-preview {
      width: 100%;
      height: 60px;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }
    .typography-sample {
      padding: 1rem;
      background: white;
      border-radius: 8px;
      margin: 0.5rem 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    pre {
      background: #1f2937;
      color: #f3f4f6;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <h1>Digital Content Builder - Design System Report</h1>
  <p>Generated: ${report.timestamp}</p>

  <h2>Color Palette</h2>
  <div class="color-grid">
    ${Object.entries(report.designSystem.colors.variables || {}).map(([name, value]) => `
      <div class="color-swatch">
        <div class="color-preview" style="background: ${value}"></div>
        <strong>${name}</strong><br>
        <code>${value}</code>
      </div>
    `).join('')}
  </div>

  <h2>Typography</h2>
  ${Object.entries(report.designSystem.typography || {}).map(([tag, styles]) => `
    <div class="typography-sample">
      <strong>${tag.toUpperCase()}</strong><br>
      Font: ${styles.fontFamily}<br>
      Size: ${styles.fontSize}<br>
      Weight: ${styles.fontWeight}<br>
      Line Height: ${styles.lineHeight}
    </div>
  `).join('')}

  <h2>Component Inventory</h2>
  <pre>${JSON.stringify(report.designSystem.components, null, 2)}</pre>

  <h2>Animation Patterns</h2>
  <pre>${JSON.stringify(report.designSystem.animations, null, 2)}</pre>
</body>
</html>
    `;

    fs.writeFileSync(
      path.join(__dirname, 'design-report.html'),
      htmlReport
    );

    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run automation if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const automation = new DesignAutomation();

  (async () => {
    try {
      await automation.initialize();
      console.log('🎨 Starting design automation...');

      await automation.captureDesignSystem();
      console.log('✅ Design system captured');

      await automation.testContentGeneration();
      console.log('✅ Content generation tested');

      await automation.testResponsiveDesign();
      console.log('✅ Responsive design tested');

      const report = await automation.generateDesignReport();
      console.log('✅ Design report generated');

      console.log('\n📊 Report saved to:', path.join(__dirname, 'design-report.html'));
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      await automation.cleanup();
    }
  })();
}

export default DesignAutomation;