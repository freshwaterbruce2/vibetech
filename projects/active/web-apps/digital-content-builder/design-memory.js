import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Design Memory System
 * Tracks UI decisions, design patterns, and component usage
 * Integrates with Memory Bank MCP for persistent storage
 */
class DesignMemory {
  constructor() {
    this.memoryFile = path.join(__dirname, 'design-memory.json');
    this.memory = this.loadMemory();
  }

  loadMemory() {
    if (fs.existsSync(this.memoryFile)) {
      const data = fs.readFileSync(this.memoryFile, 'utf8');
      return JSON.parse(data);
    }

    // Initialize with default structure
    return {
      version: '1.0.0',
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      designSystem: {
        colors: {
          primary: '#ff7f7f',
          secondary: '#ffb299',
          background: '#fdf4f1',
          text: '#2c1f1a',
          accent: '#ff6b6b'
        },
        typography: {
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontSizes: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem'
          }
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem',
          '3xl': '4rem'
        },
        borderRadius: {
          sm: '0.25rem',
          md: '0.375rem',
          lg: '0.5rem',
          xl: '1rem',
          '2xl': '1.25rem',
          full: '9999px'
        }
      },
      components: {},
      patterns: {},
      decisions: [],
      changes: []
    };
  }

  saveMemory() {
    this.memory.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.memoryFile, JSON.stringify(this.memory, null, 2));
  }

  // Track component usage
  trackComponent(componentName, properties) {
    if (!this.memory.components[componentName]) {
      this.memory.components[componentName] = {
        firstUsed: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        usageCount: 0,
        variations: []
      };
    }

    const component = this.memory.components[componentName];
    component.lastUsed = new Date().toISOString();
    component.usageCount++;

    // Track variations
    const variationKey = JSON.stringify(properties);
    if (!component.variations.find(v => JSON.stringify(v) === variationKey)) {
      component.variations.push(properties);
    }

    this.saveMemory();
  }

  // Record design decisions
  recordDecision(decision) {
    this.memory.decisions.push({
      timestamp: new Date().toISOString(),
      type: decision.type,
      description: decision.description,
      rationale: decision.rationale,
      impact: decision.impact,
      tags: decision.tags || []
    });

    this.saveMemory();
  }

  // Track design pattern usage
  trackPattern(patternName, implementation) {
    if (!this.memory.patterns[patternName]) {
      this.memory.patterns[patternName] = {
        name: patternName,
        category: implementation.category || 'general',
        firstUsed: new Date().toISOString(),
        implementations: []
      };
    }

    this.memory.patterns[patternName].implementations.push({
      timestamp: new Date().toISOString(),
      location: implementation.location,
      code: implementation.code,
      notes: implementation.notes
    });

    this.saveMemory();
  }

  // Track design system changes
  trackChange(change) {
    this.memory.changes.push({
      timestamp: new Date().toISOString(),
      type: change.type,
      before: change.before,
      after: change.after,
      reason: change.reason,
      author: change.author || 'system'
    });

    // Update design system if applicable
    if (change.updateSystem) {
      this.updateDesignSystem(change.path, change.after);
    }

    this.saveMemory();
  }

  // Update design system values
  updateDesignSystem(path, value) {
    const keys = path.split('.');
    let current = this.memory.designSystem;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  // Get design recommendations based on history
  getRecommendations(context) {
    const recommendations = [];

    // Recommend frequently used components
    const sortedComponents = Object.entries(this.memory.components)
      .sort((a, b) => b[1].usageCount - a[1].usageCount)
      .slice(0, 5);

    if (sortedComponents.length > 0) {
      recommendations.push({
        type: 'components',
        message: 'Consider using these frequently used components:',
        items: sortedComponents.map(([name, data]) => ({
          name,
          usageCount: data.usageCount,
          lastUsed: data.lastUsed
        }))
      });
    }

    // Recommend patterns based on context
    if (context && context.type) {
      const relevantPatterns = Object.entries(this.memory.patterns)
        .filter(([_, pattern]) => pattern.category === context.type);

      if (relevantPatterns.length > 0) {
        recommendations.push({
          type: 'patterns',
          message: `Patterns for ${context.type}:`,
          items: relevantPatterns.map(([name, pattern]) => ({
            name,
            implementations: pattern.implementations.length
          }))
        });
      }
    }

    // Include recent decisions
    const recentDecisions = this.memory.decisions.slice(-3);
    if (recentDecisions.length > 0) {
      recommendations.push({
        type: 'decisions',
        message: 'Recent design decisions to consider:',
        items: recentDecisions
      });
    }

    return recommendations;
  }

  // Analyze design consistency
  analyzeConsistency() {
    const analysis = {
      colorUsage: {},
      typographyUsage: {},
      spacingUsage: {},
      componentVariations: {},
      inconsistencies: []
    };

    // Analyze component variations
    Object.entries(this.memory.components).forEach(([name, component]) => {
      if (component.variations.length > 3) {
        analysis.inconsistencies.push({
          type: 'component',
          name,
          issue: `Too many variations (${component.variations.length})`,
          recommendation: 'Consider standardizing component props'
        });
      }
    });

    // Check for recent breaking changes
    const recentChanges = this.memory.changes.slice(-10);
    const breakingChanges = recentChanges.filter(c =>
      c.type === 'breaking' || c.reason?.includes('fix') || c.reason?.includes('bug')
    );

    if (breakingChanges.length > 0) {
      analysis.inconsistencies.push({
        type: 'changes',
        issue: `${breakingChanges.length} breaking changes in recent history`,
        recommendation: 'Review and stabilize design system'
      });
    }

    return analysis;
  }

  // Export design tokens for CSS/JavaScript
  exportTokens(format = 'css') {
    const { colors, typography, spacing, borderRadius } = this.memory.designSystem;

    if (format === 'css') {
      let css = ':root {\n';

      // Colors
      Object.entries(colors).forEach(([key, value]) => {
        css += `  --color-${key}: ${value};\n`;
      });

      // Typography
      Object.entries(typography.fontSizes).forEach(([key, value]) => {
        css += `  --font-size-${key}: ${value};\n`;
      });

      // Spacing
      Object.entries(spacing).forEach(([key, value]) => {
        css += `  --spacing-${key}: ${value};\n`;
      });

      // Border radius
      Object.entries(borderRadius).forEach(([key, value]) => {
        css += `  --radius-${key}: ${value};\n`;
      });

      css += '}';
      return css;
    }

    if (format === 'js') {
      return `export const designTokens = ${JSON.stringify(this.memory.designSystem, null, 2)};`;
    }

    return this.memory.designSystem;
  }

  // Generate design documentation
  generateDocumentation() {
    const doc = {
      title: 'Digital Content Builder - Design System Documentation',
      generated: new Date().toISOString(),
      sections: [
        {
          title: 'Design Tokens',
          content: this.memory.designSystem
        },
        {
          title: 'Components',
          content: Object.entries(this.memory.components).map(([name, data]) => ({
            name,
            usageCount: data.usageCount,
            variations: data.variations.length,
            lastUsed: data.lastUsed
          }))
        },
        {
          title: 'Patterns',
          content: this.memory.patterns
        },
        {
          title: 'Design Decisions',
          content: this.memory.decisions.slice(-20)
        },
        {
          title: 'Recent Changes',
          content: this.memory.changes.slice(-20)
        },
        {
          title: 'Consistency Analysis',
          content: this.analyzeConsistency()
        }
      ]
    };

    return doc;
  }
}

// Export singleton instance
const designMemory = new DesignMemory();

// Example usage and tracking
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Track initial design decisions
  designMemory.recordDecision({
    type: 'color-scheme',
    description: 'Switched from dark theme to warm, friendly light theme',
    rationale: 'User feedback indicated dark theme was too harsh, wanted welcoming design',
    impact: 'high',
    tags: ['ux', 'accessibility', 'branding']
  });

  designMemory.trackPattern('glassmorphism', {
    category: 'visual-effect',
    location: 'header, cards',
    code: 'backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.1);',
    notes: 'Creates modern frosted glass effect for depth'
  });

  designMemory.trackComponent('ContentTypeButton', {
    variant: 'friendly',
    iconType: 'lucide-rounded',
    hoverEffect: 'scale-shadow',
    borderRadius: '20px'
  });

  // Export tokens
  console.log('CSS Tokens:\n', designMemory.exportTokens('css'));

  // Get recommendations
  console.log('\nRecommendations:', designMemory.getRecommendations({ type: 'visual-effect' }));

  // Generate documentation
  const docs = designMemory.generateDocumentation();
  fs.writeFileSync(
    path.join(__dirname, 'design-documentation.json'),
    JSON.stringify(docs, null, 2)
  );

  console.log('\n✅ Design memory system initialized and tracking');
}

export default designMemory;