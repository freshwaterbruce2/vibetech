# Visual Testing & Design Automation Guide

## Overview
This guide documents the comprehensive visual testing and design automation system for the Digital Content Builder. The system includes Playwright for visual regression testing, Puppeteer for design automation, and a Memory Bank system for tracking design decisions.

## Architecture

### Components
1. **Playwright Visual Testing** - Cross-browser visual regression testing
2. **Puppeteer Design Automation** - Automated design system capture and analysis
3. **Design Memory System** - Persistent tracking of UI patterns and decisions
4. **MCP Server Integration** - Figma and Memory Bank connections

## Getting Started

### Installation
```bash
# Dependencies already installed
npm install --save-dev @playwright/test playwright puppeteer

# Install Playwright browsers
npx playwright install
```

### Configuration Files
- `.vscode/mcp.json` - MCP server configurations
- `playwright.config.js` - Playwright test configuration
- `design-memory.js` - Design tracking system

## Running Visual Tests

### Playwright Visual Testing
```bash
# Run visual tests
npm run test:visual

# Update baseline screenshots
npm run test:visual:update

# View test report
npm run test:visual:report
```

### Puppeteer Design Automation
```bash
# Capture design system and generate report
npm run test:puppeteer

# This will:
# - Extract color palette and typography
# - Capture component screenshots
# - Test responsive design across viewports
# - Generate HTML design report
```

## Design Memory System

### Features
- Tracks component usage and variations
- Records design decisions with rationale
- Monitors design pattern implementations
- Generates CSS tokens and documentation

### Usage
```javascript
import designMemory from './design-memory.js';

// Track a component
designMemory.trackComponent('ButtonPrimary', {
  variant: 'large',
  color: 'coral',
  borderRadius: '20px'
});

// Record a design decision
designMemory.recordDecision({
  type: 'color-scheme',
  description: 'Changed to warm coral theme',
  rationale: 'User feedback requested friendlier design',
  impact: 'high'
});

// Export CSS tokens
const cssTokens = designMemory.exportTokens('css');
```

## MCP Server Integration

### Figma Context MCP
Configured in `.vscode/mcp.json` to:
- Sync design tokens from Figma
- Import component specifications
- Track design system updates

### Memory Bank MCP
- Stores design decisions persistently
- Tracks UI pattern evolution
- Provides historical context for changes

## Visual Testing Strategy

### Test Coverage
1. **Component Tests** - All 9 content type buttons
2. **Layout Tests** - Header, content area, footer
3. **Interaction Tests** - Hover states, focus states
4. **Responsive Tests** - Mobile, tablet, desktop viewports
5. **Cross-browser Tests** - Chrome, Firefox, Safari

### Best Practices
- Run tests before each deployment
- Update baselines only after design review
- Use pixel tolerance of 0.2% for minor variations
- Document significant visual changes

## Automated Reports

### Design System Report
Generated at `tests/visual/design-report.html`
Contains:
- Color palette analysis
- Typography specifications
- Component inventory
- Animation patterns
- Spacing metrics

### Visual Test Report
Generated at `tests/visual/reports/index.html`
Shows:
- Pass/fail status for each test
- Visual diffs for failures
- Screenshot comparisons
- Test execution timeline

## CI/CD Integration

### GitHub Actions (Example)
```yaml
name: Visual Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:visual
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: visual-test-results
          path: tests/visual/reports
```

## Troubleshooting

### Common Issues

1. **CSP Errors**
   - Server uses strict Content Security Policy
   - Inline event handlers blocked
   - Solution: Move to addEventListener in production

2. **Port Conflicts**
   - Default port 5563 may be in use
   - Update port in both server start and test config

3. **Screenshot Differences**
   - Font rendering varies by OS
   - Use Docker for consistent environments
   - Adjust threshold if needed

## Design Tokens

Current design system uses warm, friendly colors:
```css
--color-primary: #ff7f7f;     /* Coral */
--color-secondary: #ffb299;   /* Peach */
--color-background: #fdf4f1;  /* Cream */
--color-text: #2c1f1a;        /* Dark brown */
--color-accent: #ff6b6b;      /* Bright coral */
```

## Future Enhancements

1. **shadcn/ui Integration** - Migrate to modern component library
2. **V0.dev AI Generation** - Automate component creation
3. **BrowserStack Percy** - Cloud-based visual testing
4. **Chromatic Integration** - Advanced UI review workflows

## Commands Summary

```bash
# Visual Testing
npm run test:visual         # Run visual tests
npm run test:visual:update  # Update baselines
npm run test:visual:report  # View report
npm run test:puppeteer      # Run design automation

# Server
npm start                   # Start production server
npm run dev                 # Start dev server

# Quality
npm run lint               # Check code style
npm run security-check     # Audit dependencies
```

## Support

For issues or questions:
- Check `tests/visual/design-report.html` for current design state
- Review `design-memory.json` for design history
- Consult `tests/visual/screenshots/` for visual baselines

---

*Last updated: September 28, 2025*
*Version: 1.0.0*