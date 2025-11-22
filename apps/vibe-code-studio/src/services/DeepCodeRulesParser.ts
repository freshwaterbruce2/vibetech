/**
 * DeepCodeRulesParser - Parses .deepcoderules files
 * Supports YAML format with validation
 */
import { logger } from '../services/Logger';
import { DeepCodeRules, RuleValidationResult, RuleViolation } from '../types/customInstructions';

export class DeepCodeRulesParser {
  /**
   * Parse a .deepcoderules file content
   */
  async parse(content: string, filePath: string): Promise<DeepCodeRules> {
    try {
      // Simple YAML parser (in production, use a library like js-yaml)
      const rules = this.parseYAML(content);

      // Validate the parsed rules
      const validation = this.validate(rules);
      if (!validation.valid) {
        logger.warn(`Validation warnings in ${filePath}:`, validation.warnings);
      }

      return rules;
    } catch (error) {
      throw new Error(
        `Failed to parse .deepcoderules at ${filePath}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Parse multiple .deepcoderules files and merge them
   */
  async parseMultiple(files: Map<string, string>): Promise<DeepCodeRules> {
    const rulesList: DeepCodeRules[] = [];

    for (const [filePath, content] of files.entries()) {
      const rules = await this.parse(content, filePath);
      rulesList.push(rules);
    }

    return this.mergeRules(rulesList);
  }

  /**
   * Validate rules structure
   */
  validate(rules: DeepCodeRules): RuleValidationResult {
    const violations: RuleViolation[] = [];
    const warnings: string[] = [];

    // Check version
    if (!rules.version) {
      violations.push({
        rule: 'version',
        severity: 'error',
        message: 'Missing required field: version',
      });
    }

    // Check global rules
    if (rules.global) {
      if (rules.global.style?.indentSize && rules.global.style.indentSize < 1) {
        violations.push({
          rule: 'global.style.indentSize',
          severity: 'error',
          message: 'indentSize must be greater than 0',
        });
      }

      if (
        rules.global.style?.lineLength &&
        (rules.global.style.lineLength < 40 || rules.global.style.lineLength > 200)
      ) {
        warnings.push('lineLength is outside recommended range (40-200)');
      }
    }

    // Check patterns
    if (rules.patterns) {
      rules.patterns.forEach((pattern, index) => {
        if (!pattern.name) {
          violations.push({
            rule: `patterns[${index}].name`,
            severity: 'error',
            message: 'Pattern must have a name',
          });
        }

        if (!pattern.match || (!pattern.match.files && !pattern.match.extensions)) {
          violations.push({
            rule: `patterns[${index}].match`,
            severity: 'error',
            message: 'Pattern must have file matching criteria',
          });
        }
      });
    }

    // Check templates
    if (rules.templates) {
      Object.entries(rules.templates).forEach(([name, template]) => {
        if (!template.code) {
          violations.push({
            rule: `templates.${name}.code`,
            severity: 'error',
            message: 'Template must have code',
          });
        }
      });
    }

    return {
      valid: violations.length === 0,
      violations,
      warnings,
    };
  }

  /**
   * Merge multiple rule sets (later rules override earlier ones)
   */
  mergeRules(rulesList: DeepCodeRules[]): DeepCodeRules {
    if (rulesList.length === 0) {
      return this.getDefaultRules();
    }

    if (rulesList.length === 1) {
      return rulesList[0];
    }

    const merged: DeepCodeRules = {
      version: '1.0',
      global: {},
      patterns: [],
      templates: {},
      aiConfig: {},
    };

    rulesList.forEach((rules) => {
      // Merge metadata
      if (rules.metadata) {
        merged.metadata = { ...merged.metadata, ...rules.metadata };
      }

      // Merge global rules (deep merge)
      if (rules.global) {
        merged.global = this.deepMerge(merged.global || {}, rules.global);
      }

      // Append patterns
      if (rules.patterns) {
        merged.patterns = [...(merged.patterns || []), ...rules.patterns];
      }

      // Merge templates
      if (rules.templates) {
        merged.templates = { ...merged.templates, ...rules.templates };
      }

      // Merge AI config
      if (rules.aiConfig) {
        merged.aiConfig = { ...merged.aiConfig, ...rules.aiConfig };
      }
    });

    return merged;
  }

  /**
   * Get default rules
   */
  getDefaultRules(): DeepCodeRules {
    return {
      version: '1.0',
      description: 'Default DeepCode rules',
      global: {
        style: {
          indentation: 'spaces',
          indentSize: 2,
          quotes: 'single',
          semicolons: true,
          trailingComma: true,
          lineLength: 100,
          naming: {
            variables: 'camelCase',
            functions: 'camelCase',
            classes: 'PascalCase',
            constants: 'SCREAMING_SNAKE_CASE',
            files: 'kebab-case',
            components: 'PascalCase',
          },
        },
        conventions: {
          errorHandling: 'async-await',
          asyncPattern: 'async-await',
          maxFunctionLength: 50,
          maxFileLength: 500,
        },
        comments: {
          style: 'tsdoc',
          requireForFunctions: true,
          requireForClasses: true,
          includeTypeInfo: true,
        },
      },
      aiConfig: {
        model: 'auto',
        temperature: 0.7,
        maxTokens: 2000,
        completionStyle: 'balanced',
        includeComments: true,
        includeTypes: true,
      },
    };
  }

  /**
   * Serialize rules to YAML string
   */
  serialize(rules: DeepCodeRules): string {
    // Simple YAML serializer (in production, use a library like js-yaml)
    return this.toYAML(rules, 0);
  }

  // --- Private Methods ---

  /**
   * Simple YAML parser (basic implementation)
   * In production, use js-yaml library
   */
  private parseYAML(content: string): DeepCodeRules {
    try {
      // For now, try JSON parse (YAML is a superset of JSON)
      // In production, use proper YAML parser
      const cleaned = content.trim();

      // Try JSON first
      if (cleaned.startsWith('{')) {
        return JSON.parse(content);
      }

      // Basic YAML parsing (simplified)
      const rules: any = { version: '1.0' };
      const lines = content.split('\n');
      let currentSection: any = rules;
      let indent = 0;

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {return;}

        const currentIndent = line.search(/\S/);

        if (trimmed.includes(':')) {
          const [key, ...valueParts] = trimmed.split(':');
          const value = valueParts.join(':').trim();

          if (value) {
            // Simple key-value pair
            currentSection[key.trim()] = this.parseValue(value);
          } else {
            // New section
            currentSection[key.trim()] = {};
            currentSection = currentSection[key.trim()];
            indent = currentIndent;
          }
        }
      });

      return rules as DeepCodeRules;
    } catch (error) {
      throw new Error(`YAML parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseValue(value: string): any {
    // Remove quotes
    const cleaned = value.replace(/^['"]|['"]$/g, '');

    // Boolean
    if (cleaned === 'true') {return true;}
    if (cleaned === 'false') {return false;}

    // Number
    if (/^\d+$/.test(cleaned)) {return parseInt(cleaned, 10);}
    if (/^\d+\.\d+$/.test(cleaned)) {return parseFloat(cleaned);}

    // Array
    if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
      return cleaned
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim());
    }

    return cleaned;
  }

  /**
   * Simple YAML serializer
   */
  private toYAML(obj: any, indent: number): string {
    const spaces = ' '.repeat(indent);
    let yaml = '';

    Object.entries(obj).forEach(([key, value]) => {
      if (value === undefined || value === null) {return;}

      if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.toYAML(value, indent + 2);
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach((item) => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n`;
            yaml += this.toYAML(item, indent + 4);
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else {
        const valueStr = typeof value === 'string' ? `"${value}"` : value;
        yaml += `${spaces}${key}: ${valueStr}\n`;
      }
    });

    return yaml;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };

    Object.keys(source).forEach((key) => {
      if (source[key] instanceof Object && key in target) {
        output[key] = this.deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    });

    return output;
  }
}
