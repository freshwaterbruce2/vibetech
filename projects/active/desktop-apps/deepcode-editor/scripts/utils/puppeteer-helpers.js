/**
 * Shared Puppeteer automation utilities
 * Provides reusable browser automation functions
 */

const { logInfo, logSuccess, logError } = require('./logger');

// Lazy-load puppeteer to avoid errors if it's not installed
let puppeteer;
function getPuppeteer() {
  if (!puppeteer) {
    puppeteer = require('puppeteer');
  }
  return puppeteer;
}

/**
 * Launch a browser with common configuration
 * @param {object} options - Browser launch options
 * @param {boolean} options.headless - Run in headless mode (default: true)
 * @param {object} options.viewport - Viewport dimensions
 * @returns {Promise<Browser>} Puppeteer browser instance
 */
async function launchBrowser(options = {}) {
  const puppeteer = getPuppeteer();
  const {
    headless = true,
    viewport = { width: 1920, height: 1080 },
  } = options;

  logInfo('Launching browser...');
  
  const browser = await puppeteer.launch({
    headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: viewport,
  });

  logSuccess('Browser launched');
  return browser;
}

/**
 * Take a screenshot of a page
 * @param {Page} page - Puppeteer page instance
 * @param {string} path - Path to save screenshot
 * @param {object} options - Screenshot options
 * @returns {Promise<void>}
 */
async function takeScreenshot(page, path, options = {}) {
  const { fullPage = true } = options;
  
  logInfo(`Taking screenshot: ${path}`);
  await page.screenshot({ path, fullPage, ...options });
  logSuccess(`Screenshot saved: ${path}`);
}

/**
 * Get performance metrics from a page
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<object>} Performance metrics
 */
async function getPerformanceMetrics(page) {
  const metrics = await page.metrics();
  
  return {
    jsHeapUsedMB: (metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2),
    jsHeapTotalMB: (metrics.JSHeapTotalSize / 1024 / 1024).toFixed(2),
    domNodes: metrics.Nodes,
    eventListeners: metrics.JSEventListeners,
    scriptDurationMs: Math.round(metrics.ScriptDuration * 1000),
  };
}

/**
 * Analyze Vibe Tech design elements on a page
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<object>} Design analysis results
 */
async function analyzeVibeTechDesign(page) {
  return await page.evaluate(() => {
    const results = {
      gradients: [],
      vibeColors: [],
      animations: 0,
    };

    const elements = Array.from(document.querySelectorAll('*')).slice(0, 200);
    const vibeColorValues = ['#8b5cf6', '#00d4ff', '#0a0a0f', '#1a1a2e'];

    elements.forEach((el) => {
      const style = window.getComputedStyle(el);

      // Check for gradients
      if (style.backgroundImage && style.backgroundImage.includes('gradient')) {
        results.gradients.push({
          tag: el.tagName,
          gradient: style.backgroundImage.substring(0, 50) + '...',
        });
      }

      // Check for Vibe colors
      vibeColorValues.forEach((color) => {
        if (
          style.backgroundColor.includes(color) ||
          style.color.includes(color) ||
          style.borderColor.includes(color)
        ) {
          results.vibeColors.push({
            tag: el.tagName,
            color: color,
            property: style.backgroundColor.includes(color)
              ? 'background'
              : style.color.includes(color)
              ? 'text'
              : 'border',
          });
        }
      });

      // Check for animations
      if (style.animation !== 'none' || style.transition !== 'all 0s ease 0s') {
        results.animations++;
      }
    });

    // Limit results
    results.gradients = results.gradients.slice(0, 5);
    results.vibeColors = results.vibeColors.slice(0, 10);

    return results;
  });
}

/**
 * Count elements with gradients on a page
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<number>} Number of elements with gradients
 */
async function countGradientElements(page) {
  return await page.$$eval('*', (elements) => {
    return elements.filter((el) => {
      const style = window.getComputedStyle(el);
      return style.background.includes('gradient');
    }).length;
  });
}

/**
 * Count elements with specific colors
 * @param {Page} page - Puppeteer page instance
 * @param {string[]} colorValues - Array of color values to check
 * @returns {Promise<number>} Number of elements with specified colors
 */
async function countColorElements(page, colorValues) {
  return await page.$$eval(
    '*',
    (elements, colors) => {
      return elements.filter((el) => {
        const style = window.getComputedStyle(el);
        return colors.some(
          (color) =>
            style.color.includes(color) ||
            style.backgroundColor.includes(color) ||
            style.borderColor.includes(color)
        );
      }).length;
    },
    colorValues
  );
}

module.exports = {
  launchBrowser,
  takeScreenshot,
  getPerformanceMetrics,
  analyzeVibeTechDesign,
  countGradientElements,
  countColorElements,
};

