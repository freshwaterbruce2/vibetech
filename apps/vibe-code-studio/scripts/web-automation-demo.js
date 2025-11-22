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

async function demoWebAutomation() {
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless mode
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Demo 1: Navigate to our local editor
    console.log('🚀 Demo 1: Testing local editor...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
    
    // Take screenshot of the editor
    const screenshotPath = path.join(__dirname, '..', 'screenshots', 'editor-current.png');
    await fs.promises.mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
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
    const gradientElements = await page.$$eval('*', elements => {
      return elements.filter(el => {
        const style = window.getComputedStyle(el);
        return style.background.includes('gradient');
      }).length;
    });
    console.log(`✅ Found ${gradientElements} elements with gradients`);
    
    // Check for Vibe Tech colors
    const vibeColors = await page.$$eval('*', elements => {
      const vibeColorValues = ['#8b5cf6', '#00d4ff', '#0a0a0f', '#1a1a2e'];
      return elements.filter(el => {
        const style = window.getComputedStyle(el);
        return vibeColorValues.some(color => 
          style.color.includes(color) || 
          style.backgroundColor.includes(color) ||
          style.borderColor.includes(color)
        );
      }).length;
    });
    console.log(`✅ Found ${vibeColors} elements with Vibe Tech colors`);
    
    // Demo 4: Performance testing
    console.log('⚡ Demo 4: Performance metrics...');
    const metrics = await page.metrics();
    console.log(`📊 Performance metrics:
      - JSEventListeners: ${metrics.JSEventListeners}
      - Nodes: ${metrics.Nodes}
      - JSHeapUsedSize: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB
      - JSHeapTotalSize: ${(metrics.JSHeapTotalSize / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('❌ Error during automation:', error.message);
    
    // If localhost:3001 is not available, demo with a public site
    if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      console.log('🌐 Local server not running, testing with public site...');
      
      const page = await browser.newPage();
      await page.goto('https://code.visualstudio.com', { waitUntil: 'networkidle0' });
      
      // Take screenshot for design inspiration
      const inspirationPath = path.join(__dirname, '..', 'screenshots', 'vscode-inspiration.png');
      await fs.promises.mkdir(path.dirname(inspirationPath), { recursive: true });
      await page.screenshot({ path: inspirationPath, fullPage: true });
      console.log(`📸 VS Code inspiration screenshot: ${inspirationPath}`);
      
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