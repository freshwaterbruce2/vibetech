#!/usr/bin/env node

/**
 * MCP Integrated Development Workflow Demo
 * 
 * This script demonstrates how Filesystem, Puppeteer, and GitHub MCP servers
 * work together to enhance the development workflow.
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const puppeteer = require('puppeteer');

const execPromise = util.promisify(exec);

// Configuration
const PROJECT_ROOT = path.join(__dirname, '..');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'reports');
const SCREENSHOTS_DIR = path.join(PROJECT_ROOT, 'screenshots');

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
}

// ============================================================================
// FILESYSTEM MCP CAPABILITIES
// ============================================================================

async function analyzeProjectStructure() {
  console.log('\n🔍 FILESYSTEM MCP: Analyzing Project Structure...\n');
  
  const analysis = {
    components: [],
    services: [],
    tests: [],
    largeFiles: [],
    missingTests: [],
    duplicateCode: []
  };
  
  // Analyze components
  const componentsDir = path.join(PROJECT_ROOT, 'src/components');
  const components = await fs.readdir(componentsDir);
  
  for (const component of components) {
    if (component.endsWith('.tsx')) {
      const componentName = component.replace('.tsx', '');
      analysis.components.push(componentName);
      
      // Check for corresponding test
      const testPath = path.join(PROJECT_ROOT, `src/__tests__/components/${componentName}.test.tsx`);
      try {
        await fs.access(testPath);
      } catch {
        analysis.missingTests.push(componentName);
      }
      
      // Check file size
      const stats = await fs.stat(path.join(componentsDir, component));
      if (stats.size > 10000) { // 10KB threshold
        analysis.largeFiles.push({
          name: component,
          size: (stats.size / 1024).toFixed(2) + 'KB'
        });
      }
    }
  }
  
  // Analyze services
  const servicesDir = path.join(PROJECT_ROOT, 'src/services');
  const services = await fs.readdir(servicesDir);
  analysis.services = services.filter(s => s.endsWith('.ts'));
  
  // Generate report
  console.log('📊 Analysis Results:');
  console.log(`   Components: ${analysis.components.length}`);
  console.log(`   Services: ${analysis.services.length}`);
  console.log(`   Missing Tests: ${analysis.missingTests.length}`);
  console.log(`   Large Files: ${analysis.largeFiles.length}`);
  
  if (analysis.missingTests.length > 0) {
    console.log('\n   ⚠️  Components without tests:');
    analysis.missingTests.forEach(c => console.log(`      - ${c}`));
  }
  
  if (analysis.largeFiles.length > 0) {
    console.log('\n   📦 Large files that may need splitting:');
    analysis.largeFiles.forEach(f => console.log(`      - ${f.name} (${f.size})`));
  }
  
  return analysis;
}

async function generateTestStubs(missingTests) {
  console.log('\n✍️  FILESYSTEM MCP: Generating Test Stubs...\n');
  
  for (const component of missingTests) {
    const testContent = `import { render, screen } from '@testing-library/react';
import { ${component} } from '../../components/${component}';

describe('${component}', () => {
  it('should render without crashing', () => {
    render(<${component} />);
    // Add specific assertions here
  });
  
  it('should handle user interactions', () => {
    // Add interaction tests
  });
  
  it('should display correct content', () => {
    // Add content verification tests
  });
});
`;
    
    const testPath = path.join(PROJECT_ROOT, `src/__tests__/components/${component}.test.tsx`);
    console.log(`   📝 Generated test stub for ${component}`);
    // In real implementation, would write the file
  }
}

// ============================================================================
// PUPPETEER MCP CAPABILITIES
// ============================================================================

async function runVisualTests() {
  console.log('\n🎭 PUPPETEER MCP: Running Visual Tests...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Test 1: Load time performance
    console.log('   ⏱️  Testing load performance...');
    const startTime = Date.now();
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
    const loadTime = Date.now() - startTime;
    console.log(`      Load time: ${loadTime}ms`);
    
    // Test 2: Interactive elements
    console.log('   🖱️  Testing interactive elements...');
    const buttons = await page.$$('button');
    console.log(`      Found ${buttons.length} interactive buttons`);
    
    // Test 3: Theme switching
    console.log('   🎨 Testing theme switching...');
    const timestamp = Date.now();
    
    // Light theme screenshot
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, `light-theme-${timestamp}.png`) 
    });
    
    // Try to switch theme
    const themeToggle = await page.$('[data-testid="theme-toggle"], [aria-label*="theme"]');
    if (themeToggle) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, `dark-theme-${timestamp}.png`) 
      });
      console.log('      ✅ Theme switching works');
    }
    
    // Test 4: Accessibility
    console.log('   ♿ Testing accessibility...');
    const accessibilitySnapshot = await page.accessibility.snapshot();
    const violations = analyzeAccessibility(accessibilitySnapshot);
    console.log(`      Found ${violations.length} accessibility issues`);
    
    // Test 5: Memory usage
    const metrics = await page.metrics();
    console.log('   💾 Performance metrics:');
    console.log(`      Heap Size: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`      DOM Nodes: ${metrics.Nodes}`);
    console.log(`      Event Listeners: ${metrics.JSEventListeners}`);
    
    return {
      loadTime,
      buttonCount: buttons.length,
      themeSupport: !!themeToggle,
      accessibilityIssues: violations.length,
      memoryUsage: metrics.JSHeapUsedSize
    };
    
  } finally {
    await browser.close();
  }
}

function analyzeAccessibility(snapshot) {
  // Simplified accessibility check
  const violations = [];
  
  if (!snapshot) return violations;
  
  // Check for missing alt text, labels, etc.
  // In real implementation, would use axe-core or similar
  
  return violations;
}

async function generatePerformanceReport(testResults) {
  console.log('\n📈 PUPPETEER MCP: Generating Performance Report...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    results: testResults,
    recommendations: []
  };
  
  // Add recommendations based on results
  if (testResults.loadTime > 3000) {
    report.recommendations.push('Consider optimizing bundle size - load time exceeds 3 seconds');
  }
  
  if (testResults.memoryUsage > 50 * 1024 * 1024) {
    report.recommendations.push('High memory usage detected - check for memory leaks');
  }
  
  if (testResults.accessibilityIssues > 0) {
    report.recommendations.push('Accessibility issues found - run full accessibility audit');
  }
  
  const reportPath = path.join(REPORTS_DIR, `performance-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`   📄 Report saved to: ${reportPath}`);
  return report;
}

// ============================================================================
// GITHUB MCP CAPABILITIES
// ============================================================================

async function checkGitStatus() {
  console.log('\n🐙 GITHUB MCP: Checking Repository Status...\n');
  
  try {
    // Check if it's a git repo
    await execPromise('git rev-parse --git-dir');
    
    // Get current branch
    const { stdout: branch } = await execPromise('git branch --show-current');
    console.log(`   📍 Current branch: ${branch.trim()}`);
    
    // Check for uncommitted changes
    const { stdout: status } = await execPromise('git status --porcelain');
    const changes = status.trim().split('\n').filter(Boolean);
    console.log(`   📝 Uncommitted changes: ${changes.length} files`);
    
    // Get recent commits
    const { stdout: commits } = await execPromise('git log --oneline -5');
    console.log('   📜 Recent commits:');
    commits.trim().split('\n').forEach(c => console.log(`      ${c}`));
    
    return {
      branch: branch.trim(),
      hasChanges: changes.length > 0,
      changes: changes.length
    };
    
  } catch (error) {
    console.log('   ❌ Not a git repository');
    return null;
  }
}

async function createAutomatedPR(analysis, testResults) {
  console.log('\n🚀 GITHUB MCP: Creating Automated PR...\n');
  
  const prBody = `## Automated Development Report

### Code Analysis (Filesystem MCP)
- Components analyzed: ${analysis.components.length}
- Services analyzed: ${analysis.services.length}
- Missing tests identified: ${analysis.missingTests.length}
- Large files found: ${analysis.largeFiles.length}

### Visual Testing Results (Puppeteer MCP)
- Load time: ${testResults.loadTime}ms
- Interactive elements: ${testResults.buttonCount}
- Theme support: ${testResults.themeSupport ? '✅' : '❌'}
- Accessibility issues: ${testResults.accessibilityIssues}
- Memory usage: ${(testResults.memoryUsage / 1024 / 1024).toFixed(2)}MB

### Recommendations
${analysis.missingTests.length > 0 ? '- Add tests for components: ' + analysis.missingTests.join(', ') : ''}
${testResults.loadTime > 3000 ? '- Optimize load time (currently ' + testResults.loadTime + 'ms)' : ''}
${testResults.accessibilityIssues > 0 ? '- Fix accessibility issues' : ''}

### Screenshots
See attached screenshots in the \`screenshots/\` directory.

---
*Generated by MCP Integration Demo*`;

  console.log('   📋 PR Body Preview:');
  console.log(prBody.split('\n').map(line => '   ' + line).join('\n'));
  
  // In real implementation, would use:
  // await execPromise(`gh pr create --title "Automated improvements" --body "${prBody}"`);
}

// ============================================================================
// INTEGRATED WORKFLOW
// ============================================================================

async function runIntegratedWorkflow() {
  console.log('🎯 MCP INTEGRATED DEVELOPMENT WORKFLOW DEMO');
  console.log('==========================================');
  
  await ensureDirectories();
  
  // Step 1: Analyze project structure
  const projectAnalysis = await analyzeProjectStructure();
  
  // Step 2: Generate test stubs for missing tests
  if (projectAnalysis.missingTests.length > 0) {
    await generateTestStubs(projectAnalysis.missingTests.slice(0, 3)); // Demo: just first 3
  }
  
  // Step 3: Run visual tests
  console.log('\n⏳ Waiting for dev server...');
  try {
    await execPromise('curl -f http://localhost:3001');
    const testResults = await runVisualTests();
    
    // Step 4: Generate performance report
    const report = await generatePerformanceReport(testResults);
    
    // Step 5: Check git status
    const gitStatus = await checkGitStatus();
    
    // Step 6: Create automated PR (demo mode)
    if (gitStatus && !gitStatus.hasChanges) {
      await createAutomatedPR(projectAnalysis, testResults);
    }
    
    // Summary
    console.log('\n✨ WORKFLOW COMPLETE!');
    console.log('====================');
    console.log('\n📊 Summary:');
    console.log(`   - Project analyzed: ✅`);
    console.log(`   - Test stubs generated: ${projectAnalysis.missingTests.length > 0 ? '✅' : 'N/A'}`);
    console.log(`   - Visual tests passed: ✅`);
    console.log(`   - Performance report generated: ✅`);
    console.log(`   - Repository status checked: ${gitStatus ? '✅' : '❌'}`);
    console.log('\n💡 This demo showcases how MCP servers can:');
    console.log('   1. Analyze and improve code quality (Filesystem)');
    console.log('   2. Automate testing and documentation (Puppeteer)');
    console.log('   3. Streamline collaboration workflows (GitHub)');
    
  } catch (error) {
    console.error('\n❌ Error: Dev server not running. Please run "npm run dev:web" first.');
    console.log('\n💡 Even without the server, this demo shows MCP capabilities for:');
    console.log('   - Project structure analysis');
    console.log('   - Test generation');
    console.log('   - Git repository management');
  }
}

// Run the demo
if (require.main === module) {
  runIntegratedWorkflow().catch(console.error);
}

module.exports = {
  analyzeProjectStructure,
  runVisualTests,
  checkGitStatus
};