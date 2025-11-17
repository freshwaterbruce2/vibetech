#!/usr/bin/env node

/**
 * Puppeteer MCP Server Demo for DeepCode Editor Development
 * 
 * This script demonstrates how the Puppeteer MCP server could be used
 * to assist with editor development through web automation.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const {
  launchBrowser,
  takeScreenshot,
  getPerformanceMetrics,
  countGradientElements,
  countColorElements,
  ensureDirectory,
} = require('./utils');

async function demoWebAutomation() {
  const browser = await launchBrowser({ headless: false });
  
  try {
    const page = await browser.newPage();
    
    // Demo 1: Navigate to our local editor
    console.log('🚀 Demo 1: Testing local editor...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
    
    // Take screenshot of the editor
    const screenshotPath = path.join(__dirname, '..', 'screenshots', 'editor-current.png');
    await ensureDirectory(path.dirname(screenshotPath));
    await takeScreenshot(page, screenshotPath, { fullPage: true });
    
    // Demo 2: Test editor interactions
    console.log('🖱️  Demo 2: Testing editor interactions...');
    
    // Check if welcome screen is visible
    const welcomeScreen = await page.$('[data-testid="welcome-screen"]');
    if (welcomeScreen) {
      console.log('✅ Welcome screen is visible');
      
      // Test opening a new file
      const newFileButton = await page.$('button:has-text("New File")');
      if (newFileButton) {
        await newFileButton.click();
        console.log('✅ New file button clicked');
      }
    }
    
    // Demo 3: Check for design elements
    console.log('🎨 Demo 3: Checking Vibe Tech design elements...');
    
    // Check for gradient backgrounds
    const gradientElements = await countGradientElements(page);
    console.log(`✅ Found ${gradientElements} elements with gradients`);
    
    // Check for Vibe Tech colors
    const vibeColorValues = ['#8b5cf6', '#00d4ff', '#0a0a0f', '#1a1a2e'];
    const vibeColors = await countColorElements(page, vibeColorValues);
    console.log(`✅ Found ${vibeColors} elements with Vibe Tech colors`);
    
    // Demo 4: Performance testing
    console.log('⚡ Demo 4: Performance metrics...');
    const metrics = await getPerformanceMetrics(page);
    console.log(`📊 Performance metrics:
      - JSEventListeners: ${metrics.eventListeners}
      - Nodes: ${metrics.domNodes}
      - JSHeapUsedSize: ${metrics.jsHeapUsedMB} MB
      - JSHeapTotalSize: ${metrics.jsHeapTotalMB} MB`);
    
  } catch (error) {
    console.error('❌ Error during automation:', error.message);
    
    // If localhost:3001 is not available, demo with a public site
    if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      console.log('🌐 Local server not running, testing with public site...');
      
      const page = await browser.newPage();
      await page.goto('https://code.visualstudio.com', { waitUntil: 'networkidle0' });
      
      // Take screenshot for design inspiration
      const inspirationPath = path.join(__dirname, '..', 'screenshots', 'vscode-inspiration.png');
      await ensureDirectory(path.dirname(inspirationPath));
      await takeScreenshot(page, inspirationPath, { fullPage: true });
      
      // Extract color scheme
      const colors = await page.$$eval('*', elements => {
        const colorSet = new Set();
        elements.slice(0, 100).forEach(el => { // Limit to first 100 elements
          const style = window.getComputedStyle(el);
          if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            colorSet.add(style.backgroundColor);
          }
          if (style.color && style.color !== 'rgba(0, 0, 0, 0)') {
            colorSet.add(style.color);
          }
        });
        return Array.from(colorSet).slice(0, 10); // Return first 10 unique colors
      });
      console.log('🎨 VS Code color palette:', colors);
    }
  } finally {
    await browser.close();
  }
}

// Demo usage scenarios for editor development
function printUsageCases() {
  console.log(`
🔧 Puppeteer MCP Server Usage Cases for DeepCode Editor:

1. 📱 UI Testing & Validation
   - Automated testing of editor features
   - Cross-browser compatibility testing
   - Responsive design validation

2. 🎨 Design System Verification
   - Ensure Vibe Tech colors are applied correctly
   - Validate gradient implementations
   - Check animation performance

3. 📊 Performance Monitoring
   - Memory usage tracking
   - Load time measurements
   - Bundle size analysis

4. 🌐 Web Scraping for Development
   - Collect coding examples from documentation sites
   - Extract color palettes from design inspiration
   - Gather feature ideas from competitor analysis

5. 🧪 Automated Testing
   - E2E testing of editor workflows
   - Screenshot regression testing
   - User interaction simulation

6. 📸 Documentation Generation
   - Capture feature screenshots
   - Create tutorial GIFs
   - Generate comparison images

To use with Claude Code MCP:
- Restart Claude Code to activate the MCP server
- Use tools like mcp__puppeteer_navigate, mcp__puppeteer_screenshot
- Automate development workflows through MCP integration
  `);
}

// Run the demo
if (require.main === module) {
  console.log('🤖 Puppeteer MCP Server Demo for DeepCode Editor\n');
  printUsageCases();
  
  // Uncomment to run actual browser automation
  // demoWebAutomation().catch(console.error);
  
  console.log('\n💡 To run browser automation, uncomment the last line in the script.');
  console.log('🔄 Restart Claude Code to activate MCP tools: mcp__puppeteer_* functions');
}

module.exports = { demoWebAutomation };