/**
 * RulesParser Service
 *
 * Parses custom instruction files for AI coding assistance:
 * - Legacy: .cursorrules (plain text)
 * - Modern: .deepcoderules (YAML with frontmatter)
 *
 * Based on 2025 Cursor IDE specification with enhancements
 */

import * as yaml from 'js-yaml';
import { minimatch } from 'minimatch';

export interface Rule {
  description?: string;
  content: string;
  globs?: string[];
  alwaysApply?: boolean;
  priority?: 'low' | 'normal' | 'high';
  tags?: string[];
  scope: 'global' | 'file-specific';
}

export interface ParsedRules {
  type: 'legacy' | 'modern';
  rules: Rule[];
}

type FileReader = (path: string) => Promise<string>;

export class RulesParser {
  private fileReader?: FileReader;

  /**
   * Set custom file reader (for testing)
   */
  setFileReader(reader: FileReader): void {
    this.fileReader = reader;
  }

  /**
   * Parse rules from content string
   */
  parse(content: string, filename: string): ParsedRules {
    if (!content.trim()) {
      return {
        type: filename.endsWith('.cursorrules') ? 'legacy' : 'modern',
        rules: [],
      };
    }

    // Legacy .cursorrules format (plain text)
    if (filename.endsWith('.cursorrules')) {
      return this.parseLegacy(content);
    }

    // Modern .deepcoderules format (YAML frontmatter)
    return this.parseModern(content);
  }

  /**
   * Parse legacy .cursorrules (plain text)
   */
  private parseLegacy(content: string): ParsedRules {
    return {
      type: 'legacy',
      rules: [
        {
          content: content.trim(),
          scope: 'global',
          priority: 'normal',
        },
      ],
    };
  }

  /**
   * Parse modern .deepcoderules (YAML with frontmatter)
   */
  private parseModern(content: string): ParsedRules {
    const rules: Rule[] = [];

    // Split by YAML frontmatter delimiters (---)
    const sections = content.split(/^---$/gm).filter((s) => s.trim());

    // If no frontmatter, treat as plain content
    if (!content.includes('---')) {
      rules.push({
        content: content.trim(),
        scope: 'global',
        priority: 'normal',
      });
      return { type: 'modern', rules };
    }

    // Process sections in pairs: [frontmatter, content, frontmatter, content, ...]
    for (let i = 0; i < sections.length; i += 2) {
      // Skip if no content section following frontmatter
      if (i + 1 >= sections.length) {
        throw new Error('Rule must have content');
      }

      const frontmatter = sections[i].trim();
      const ruleContent = sections[i + 1].trim();

      if (!ruleContent) {
        throw new Error('Rule must have content');
      }

      try {
        const metadata = yaml.load(frontmatter) as Record<string, unknown>;

        // Validate globs if present
        if (metadata.globs !== undefined && !Array.isArray(metadata.globs)) {
          throw new Error('globs must be an array');
        }

        const rule: Rule = {
          description: metadata.description as string | undefined,
          content: ruleContent,
          globs: metadata.globs as string[] | undefined,
          alwaysApply: metadata.alwaysApply as boolean | undefined,
          priority: (metadata.priority as Rule['priority']) || 'normal',
          tags: metadata.tags as string[] | undefined,
          scope: metadata.alwaysApply ? 'global' : 'file-specific',
        };

        rules.push(rule);
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to parse YAML frontmatter: ${error.message}`);
        }
        throw error;
      }
    }

    return { type: 'modern', rules };
  }

  /**
   * Check if a rule matches a given file path
   */
  matchesFile(rule: Rule, filePath: string): boolean {
    // Always apply rules match everything
    if (rule.alwaysApply) {
      return true;
    }

    // No globs = global rule
    if (!rule.globs || rule.globs.length === 0) {
      return rule.scope === 'global';
    }

    // Separate positive and negative patterns
    const positivePatterns = rule.globs.filter((p) => !p.startsWith('!'));
    const negativePatterns = rule.globs.filter((p) => p.startsWith('!')).map((p) => p.slice(1));

    // First check if any positive pattern matches
    let matchesPositive = false;
    for (const pattern of positivePatterns) {
      if (minimatch(filePath, pattern)) {
        matchesPositive = true;
        break;
      }
    }

    // If no positive match, file doesn't match
    if (!matchesPositive) {
      return false;
    }

    // Now check if any negative pattern excludes it
    for (const pattern of negativePatterns) {
      if (minimatch(filePath, pattern)) {
        return false; // Excluded by negative pattern
      }
    }

    return true;
  }

  /**
   * Sort rules by priority (high > normal > low)
   */
  sortByPriority(rules: Rule[]): Rule[] {
    const priorityOrder = { high: 0, normal: 1, low: 2 };

    return [...rules].sort((a, b) => {
      const aPriority = priorityOrder[a.priority || 'normal'];
      const bPriority = priorityOrder[b.priority || 'normal'];
      return aPriority - bPriority;
    });
  }

  /**
   * Get rules that apply to a specific file
   */
  mergeRulesForFile(rules: Rule[], filePath: string): Rule[] {
    const applicable = rules.filter((rule) => this.matchesFile(rule, filePath));
    return this.sortByPriority(applicable);
  }

  /**
   * Load rules from file
   */
  async loadFromFile(filePath: string): Promise<ParsedRules> {
    if (!this.fileReader) {
      throw new Error('File reader not configured');
    }

    const content = await this.fileReader(filePath);
    return this.parse(content, filePath);
  }

  /**
   * Get built-in template library
   */
  getTemplates(): Record<string, string> {
    return {
      react: this.getTemplate('react'),
      typescript: this.getTemplate('typescript'),
      nodejs: this.getTemplate('nodejs'),
      python: this.getTemplate('python'),
      testing: this.getTemplate('testing'),
      documentation: this.getTemplate('documentation'),
    };
  }

  /**
   * Get specific template by name
   */
  getTemplate(name: string): string {
    const templates: Record<string, string> = {
      react: `---
description: React best practices
globs: ["**/*.tsx", "**/*.jsx"]
priority: high
tags: ["react", "frontend"]
---

You are an expert React developer.

**Component Guidelines:**
- Always use functional components with hooks
- Prefer composition over inheritance
- Keep components small and focused (< 200 lines)
- Use TypeScript for type safety

**State Management:**
- Use useState for local state
- Use useContext for shared state
- Consider useReducer for complex state logic
- Avoid prop drilling (max 2-3 levels)

**Performance:**
- Memoize expensive computations with useMemo
- Memoize callbacks with useCallback
- Use React.memo for expensive components
- Lazy load components with React.lazy

**Naming Conventions:**
- Components: PascalCase (Button.tsx)
- Hooks: camelCase with 'use' prefix (useAuth.ts)
- Props interfaces: ComponentNameProps

**Code Style:**
- Destructure props in function signature
- Use optional chaining (?.) and nullish coalescing (??)
- Prefer early returns for cleaner code
- Add PropTypes or TypeScript interfaces`,

      typescript: `---
description: TypeScript coding standards
globs: ["**/*.ts", "**/*.tsx"]
priority: high
tags: ["typescript", "type-safety"]
---

You are an expert TypeScript developer.

**Type Safety:**
- Enable strict mode in tsconfig.json
- Avoid 'any' type - use 'unknown' instead
- Define explicit return types for functions
- Use type guards for runtime type checking

**Best Practices:**
- Prefer interfaces over type aliases for objects
- Use enums for fixed sets of values
- Leverage utility types (Partial, Required, Pick, Omit)
- Use const assertions for literal types

**Code Organization:**
- Group related types in separate .types.ts files
- Export types alongside implementation
- Use barrel exports (index.ts) for clean imports
- Keep type complexity manageable (< 5 generics)

**Naming Conventions:**
- Interfaces: PascalCase (UserProfile)
- Types: PascalCase (RequestStatus)
- Generics: Single uppercase letter or descriptive (T, TData, TError)

**Error Handling:**
- Define custom error types
- Use discriminated unions for result types
- Validate external data with type guards`,

      nodejs: `---
description: Node.js backend best practices
globs: ["**/api/**/*.ts", "**/server/**/*.ts"]
priority: high
tags: ["nodejs", "backend"]
---

You are an expert Node.js backend developer.

**API Design:**
- Use RESTful conventions (GET, POST, PUT, DELETE)
- Version APIs (/api/v1/)
- Return consistent response formats
- Use HTTP status codes correctly

**Error Handling:**
- Use try-catch for async operations
- Create custom error classes
- Use error middleware in Express
- Log errors with context

**Security:**
- Validate all input data
- Sanitize user input to prevent injection
- Use parameterized queries for SQL
- Implement rate limiting
- Use HTTPS in production

**Performance:**
- Use async/await for I/O operations
- Implement caching (Redis, memory)
- Use connection pooling for databases
- Stream large responses

**Code Organization:**
- Separate routes, controllers, services
- Use dependency injection
- Keep controllers thin, services thick
- Use middleware for cross-cutting concerns`,

      python: `---
description: Python coding standards
globs: ["**/*.py"]
priority: high
tags: ["python"]
---

You are an expert Python developer.

**Code Style:**
- Follow PEP 8 style guide
- Use type hints for function signatures
- Write docstrings for all public functions
- Keep functions focused (< 50 lines)

**Best Practices:**
- Use list comprehensions for simple loops
- Prefer f-strings for formatting
- Use context managers (with) for resources
- Leverage standard library before external deps

**Error Handling:**
- Use specific exception types
- Don't use bare except clauses
- Re-raise exceptions when appropriate
- Use logging instead of print

**Type Safety:**
- Use type hints (typing module)
- Run mypy for static type checking
- Use dataclasses for structured data
- Leverage Protocol for duck typing`,

      testing: `---
description: Testing best practices
globs: ["**/*.test.ts", "**/*.spec.ts", "**/*.test.tsx"]
priority: high
tags: ["testing", "quality"]
---

You are an expert in software testing.

**Test Structure:**
- Follow AAA pattern (Arrange, Act, Assert)
- One assertion per test when possible
- Use descriptive test names (should X when Y)
- Group related tests with describe blocks

**Coverage:**
- Aim for 80%+ code coverage
- Test edge cases and error paths
- Test public API, not implementation
- Mock external dependencies

**Best Practices:**
- Keep tests independent and isolated
- Use test fixtures and factories
- Clean up after tests (afterEach)
- Avoid test logic in tests

**Types of Tests:**
- Unit tests for isolated functions
- Integration tests for module interactions
- E2E tests for critical user flows
- Use snapshot testing sparingly`,

      documentation: `---
description: Documentation standards
globs: ["**/*.md", "**/*.mdx"]
priority: normal
tags: ["documentation"]
---

You are a technical documentation expert.

**Documentation Style:**
- Write in clear, concise language
- Use active voice
- Include code examples
- Add diagrams for complex concepts

**Structure:**
- Start with overview/summary
- Include table of contents for long docs
- Use consistent heading hierarchy
- Add related links at the end

**Code Examples:**
- Show complete, runnable examples
- Include error cases
- Add comments for clarity
- Test all code examples

**Maintenance:**
- Keep docs in sync with code
- Version documentation
- Add deprecation notices
- Use TODO for incomplete sections`,
    };

    return templates[name] || '';
  }
}
