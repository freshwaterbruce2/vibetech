/**
 * RulesParser Tests - TDD Approach
 *
 * Supports both:
 * 1. Legacy .cursorrules (plain text)
 * 2. Modern .deepcoderules (YAML with frontmatter)
 *
 * Based on 2025 Cursor IDE specification
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RulesParser } from '../../services/RulesParser';

describe('RulesParser', () => {
  let parser: RulesParser;

  beforeEach(() => {
    parser = new RulesParser();
  });

  describe('Legacy .cursorrules Format (Plain Text)', () => {
    it('should parse simple plain text rules', () => {
      const content = `
You are an expert TypeScript developer.
Always use functional components with hooks.
Prefer const over let.
      `.trim();

      const result = parser.parse(content, '.cursorrules');

      expect(result.type).toBe('legacy');
      expect(result.rules).toHaveLength(1);
      expect(result.rules[0].content).toContain('expert TypeScript');
      expect(result.rules[0].scope).toBe('global');
    });

    it('should handle empty .cursorrules file', () => {
      const result = parser.parse('', '.cursorrules');

      expect(result.type).toBe('legacy');
      expect(result.rules).toHaveLength(0);
    });

    it('should preserve multi-line rules', () => {
      const content = `
Rule 1: Use TypeScript strict mode
Rule 2: Always add JSDoc comments
Rule 3: Follow SOLID principles
      `.trim();

      const result = parser.parse(content, '.cursorrules');

      expect(result.rules[0].content).toContain('Rule 1');
      expect(result.rules[0].content).toContain('Rule 2');
      expect(result.rules[0].content).toContain('Rule 3');
    });
  });

  describe('Modern .deepcoderules Format (YAML)', () => {
    it('should parse YAML frontmatter with metadata', () => {
      const content = `---
description: TypeScript coding standards
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: true
---

You are an expert TypeScript developer.
Use functional programming principles.
      `.trim();

      const result = parser.parse(content, '.deepcoderules');

      expect(result.type).toBe('modern');
      expect(result.rules).toHaveLength(1);
      expect(result.rules[0].description).toBe('TypeScript coding standards');
      expect(result.rules[0].globs).toEqual(['**/*.ts', '**/*.tsx']);
      expect(result.rules[0].alwaysApply).toBe(true);
      expect(result.rules[0].content).toContain('expert TypeScript');
    });

    it('should handle multiple rules in one file', () => {
      const content = `---
description: React best practices
globs: ["**/*.tsx"]
---

Use functional components with hooks.

---
description: Testing standards
globs: ["**/*.test.ts"]
---

Write comprehensive unit tests.
      `.trim();

      const result = parser.parse(content, '.deepcoderules');

      expect(result.rules).toHaveLength(2);
      expect(result.rules[0].description).toBe('React best practices');
      expect(result.rules[1].description).toBe('Testing standards');
    });

    it('should handle rules without frontmatter (plain content)', () => {
      const content = 'Always use TypeScript strict mode.';

      const result = parser.parse(content, '.deepcoderules');

      expect(result.rules).toHaveLength(1);
      expect(result.rules[0].content).toBe('Always use TypeScript strict mode.');
      expect(result.rules[0].scope).toBe('global');
    });

    it('should support optional metadata fields', () => {
      const content = `---
description: Backend rules
globs: ["src/api/**/*.ts"]
priority: high
tags: ["backend", "api"]
---

Use dependency injection pattern.
      `.trim();

      const result = parser.parse(content, '.deepcoderules');

      expect(result.rules[0].priority).toBe('high');
      expect(result.rules[0].tags).toEqual(['backend', 'api']);
    });
  });

  describe('File Matching with Globs', () => {
    it('should match files based on glob patterns', () => {
      const content = `---
description: React rules
globs: ["**/*.tsx", "**/*.jsx"]
---
Use hooks.
      `.trim();

      const result = parser.parse(content, '.deepcoderules');
      const rule = result.rules[0];

      expect(parser.matchesFile(rule, 'src/App.tsx')).toBe(true);
      expect(parser.matchesFile(rule, 'components/Button.jsx')).toBe(true);
      expect(parser.matchesFile(rule, 'src/utils.ts')).toBe(false);
    });

    it('should match all files when alwaysApply is true', () => {
      const content = `---
description: Global rules
alwaysApply: true
---
Use consistent formatting.
      `.trim();

      const result = parser.parse(content, '.deepcoderules');
      const rule = result.rules[0];

      expect(parser.matchesFile(rule, 'anything.ts')).toBe(true);
      expect(parser.matchesFile(rule, 'any/path/file.js')).toBe(true);
    });

    it('should support negative glob patterns', () => {
      const content = `---
description: Exclude test files
globs: ["**/*.ts", "!**/*.test.ts"]
---
Production code only.
      `.trim();

      const result = parser.parse(content, '.deepcoderules');
      const rule = result.rules[0];

      expect(parser.matchesFile(rule, 'src/utils.ts')).toBe(true);
      expect(parser.matchesFile(rule, 'src/utils.test.ts')).toBe(false);
    });
  });

  describe('Rule Validation', () => {
    it('should validate required fields', () => {
      const invalidContent = `---
globs: ["**/*.ts"]
---`;

      expect(() => parser.parse(invalidContent, '.deepcoderules')).toThrow('Rule must have content');
    });

    it('should validate glob patterns format', () => {
      const invalidContent = `---
description: Test
globs: "not-an-array"
---
Content here.
      `.trim();

      expect(() => parser.parse(invalidContent, '.deepcoderules')).toThrow('globs must be an array');
    });

    it('should allow empty globs with alwaysApply', () => {
      const content = `---
description: Global rule
alwaysApply: true
---
Apply everywhere.
      `.trim();

      expect(() => parser.parse(content, '.deepcoderules')).not.toThrow();
    });
  });

  describe('Rule Priority & Merging', () => {
    it('should sort rules by priority (high > normal > low)', () => {
      const rules = parser.parse(`---
description: Low priority
priority: low
---
Low rule.
---
description: High priority
priority: high
---
High rule.
---
description: Normal priority
---
Normal rule.
      `.trim(), '.deepcoderules');

      const sorted = parser.sortByPriority(rules.rules);

      expect(sorted[0].priority).toBe('high');
      expect(sorted[1].priority).toBe('normal');
      expect(sorted[2].priority).toBe('low');
    });

    it('should merge rules for a specific file', () => {
      const globalRules = `---
description: Global
alwaysApply: true
---
Use TypeScript.
      `.trim();

      const specificRules = `---
description: React rules
globs: ["**/*.tsx"]
---
Use hooks.
      `.trim();

      const global = parser.parse(globalRules, '.deepcoderules');
      const specific = parser.parse(specificRules, '.deepcoderules');

      const merged = parser.mergeRulesForFile(
        [...global.rules, ...specific.rules],
        'App.tsx'
      );

      expect(merged).toHaveLength(2);
      expect(merged[0].content).toContain('Use TypeScript');
      expect(merged[1].content).toContain('Use hooks');
    });
  });

  describe('Template Library', () => {
    it('should provide built-in templates', () => {
      const templates = parser.getTemplates();

      expect(templates).toHaveProperty('react');
      expect(templates).toHaveProperty('typescript');
      expect(templates).toHaveProperty('nodejs');
      expect(templates).toHaveProperty('python');
    });

    it('should expand template by name', () => {
      const template = parser.getTemplate('react');

      expect(template).toContain('functional components');
      expect(template).toContain('hooks');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed YAML gracefully', () => {
      const malformed = `---
description: "Unclosed quote
globs: [invalid
---
Content`;

      expect(() => parser.parse(malformed, '.deepcoderules')).toThrow();
    });

    it('should provide helpful error messages', () => {
      const invalid = `---
description: Test
globs: 123
---
Content`;

      try {
        parser.parse(invalid, '.deepcoderules');
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('globs must be an array');
      }
    });
  });

  describe('File Loading', () => {
    it('should load rules from file path', async () => {
      const mockFileSystem = vi.fn().mockResolvedValue(`---
description: Test rules
---
Use best practices.
      `.trim());

      parser.setFileReader(mockFileSystem);

      const result = await parser.loadFromFile('.deepcoderules');

      expect(result.rules).toHaveLength(1);
      expect(result.rules[0].content).toContain('best practices');
    });

    it('should handle file not found', async () => {
      const mockFileSystem = vi.fn().mockRejectedValue(new Error('File not found'));

      parser.setFileReader(mockFileSystem);

      await expect(parser.loadFromFile('.nonexistent')).rejects.toThrow('File not found');
    });
  });

  describe('Comments in YAML', () => {
    it('should preserve comments in content', () => {
      const content = `---
description: Documented rules
---
# Main coding standards
Use TypeScript for all new code.

# Testing guidelines
Write tests for all public APIs.
      `.trim();

      const result = parser.parse(content, '.deepcoderules');

      expect(result.rules[0].content).toContain('# Main coding standards');
      expect(result.rules[0].content).toContain('# Testing guidelines');
    });
  });
});
