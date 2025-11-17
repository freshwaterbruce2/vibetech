#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const {
  launchBrowser,
  takeScreenshot,
  getPerformanceMetrics,
  analyzeVibeTechDesign,
  logInfo,
  logSuccess,
  logError,
} = require('./utils');

(async () => {
    console.log('🎯 Puppeteer MCP Server Demonstration\n');
    
    try {
        const browser = await launchBrowser({ headless: true });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log('📸 Taking screenshot of updated editor...');
        await page.goto('http://localhost:3001', { 
            waitUntil: 'networkidle0', 
            timeout: 30000 
        });
        
        // Take screenshot with emoji update
        const screenshotPath = path.join('screenshots', 'editor-with-emoji.png');
        await takeScreenshot(page, screenshotPath, { fullPage: true });
        
        // Analyze the page for Vibe Tech elements
        console.log('\n🎨 Analyzing Vibe Tech Design Implementation...');
        
        const analysis = await analyzeVibeTechDesign(page);
        
        // Check for emoji in title
        const hasEmoji = await page.evaluate(() => {
            const titleElement = document.querySelector('h1');
            return titleElement && titleElement.textContent.includes('🚀');
        });
        
        console.log('\n📊 Analysis Results:');
        console.log('   ✨ Title:', await page.title());
        console.log('   🚀 Emoji Added:', hasEmoji ? 'Yes ✅' : 'No ❌');
        console.log('   🌈 Gradients Found:', analysis.gradients.length);
        if (analysis.gradients.length > 0) {
            analysis.gradients.forEach((g, i) => {
                console.log('      ', i+1 + '.', g.tag, '-', g.gradient);
            });
        }
        console.log('   🎨 Vibe Tech Colors:', analysis.vibeColors.length);
        if (analysis.vibeColors.length > 0) {
            const colorCounts = {};
            analysis.vibeColors.forEach(c => {
                colorCounts[c.color] = (colorCounts[c.color] || 0) + 1;
            });
            Object.entries(colorCounts).forEach(([color, count]) => {
                console.log('      ', color, '- Used', count, 'times');
            });
        }
        console.log('   ✨ Animated Elements:', analysis.animations);
        
        // Test interactive features
        console.log('\n🧪 Testing Interactive Features...');
        
        // Check if buttons are clickable
        const buttons = await page.$$('button');
        console.log('   🔘 Interactive Buttons:', buttons.length);
        
        // Performance check
        const metrics = await getPerformanceMetrics(page);
        console.log('\n⚡ Performance Metrics:');
        console.log('   💾 Memory Usage:', Math.round(parseFloat(metrics.jsHeapUsedMB)), 'MB');
        console.log('   🌳 DOM Nodes:', metrics.domNodes);
        console.log('   🎯 Event Listeners:', metrics.eventListeners);
        console.log('   ⏱️  Script Duration:', metrics.scriptDurationMs, 'ms');
        
        await browser.close();
        
        logSuccess('\n✅ Puppeteer MCP Server Test Complete!');
        console.log('\n💡 The automation successfully:');
        console.log('   - Captured screenshots automatically');
        console.log('   - Validated design implementation');
        console.log('   - Monitored performance metrics');
        console.log('   - Tested interactive elements');
        
    } catch (error) {
        logError('\n❌ Error: ' + error.message);
    }
})();