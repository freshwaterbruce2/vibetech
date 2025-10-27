/**
 * CustomRulesEngine - Manages .deepcoderules files and applies inheritance
 * Loads rules from workspace hierarchy and resolves them for specific files
 */
import { logger } from '../services/Logger';
import {
  DeepCodeRules,
  GlobalRules,
  PatternRules,
  ResolvedRules,
  RuleContext,
} from '../types/customInstructions';

import { DeepCodeRulesParser } from './DeepCodeRulesParser';
import { FileSystemService } from './FileSystemService';

export class CustomRulesEngine {
  private parser: DeepCodeRulesParser;
  private fsService: FileSystemService;
  private rulesCache: Map<string, DeepCodeRules> = new Map();
  private workspaceRoot: string = '';

  constructor(fsService: FileSystemService) {
    this.parser = new DeepCodeRulesParser();
    this.fsService = fsService;
  }

  /**
   * Set workspace root directory
   */
  setWorkspaceRoot(root: string): void {
    this.workspaceRoot = root;
    this.rulesCache.clear();
  }

  /**
   * Load and resolve rules for a specific file
   */
  async resolveRulesForFile(filePath: string): Promise<ResolvedRules> {
    const context: RuleContext = {
      filePath,
      fileType: this.getFileExtension(filePath),
      directory: this.getDirectory(filePath),
      language: this.detectLanguage(filePath),
    };

    // Find all .deepcoderules files in hierarchy
    const ruleFiles = await this.findRulesInHierarchy(filePath);

    // Load and parse all rules
    const rulesList: DeepCodeRules[] = [];
    const sources: string[] = [];

    for (const ruleFile of ruleFiles) {
      const rules = await this.loadRules(ruleFile);
      if (rules) {
        rulesList.push(rules);
        sources.push(ruleFile);
      }
    }

    // Merge rules with inheritance (workspace → project → file level)
    const mergedRules = this.parser.mergeRules(rulesList);

    // Apply pattern-specific rules
    const { rules: finalRules, appliedPatterns } = this.applyPatternRules(
      mergedRules,
      context
    );

    return {
      rules: finalRules,
      sources,
      appliedPatterns,
    };
  }

  /**
   * Get all available templates
   */
  async getAllTemplates(): Promise<Map<string, DeepCodeRules['templates']>> {
    const templatesMap = new Map<string, DeepCodeRules['templates']>();

    // Load workspace-level templates
    const workspaceRulesPath = `${this.workspaceRoot}/.deepcoderules`;
    const workspaceRules = await this.loadRules(workspaceRulesPath);

    if (workspaceRules?.templates) {
      templatesMap.set('workspace', workspaceRules.templates);
    }

    // Load built-in templates
    const builtInTemplates = await this.getBuiltInTemplates();
    templatesMap.set('built-in', builtInTemplates);

    return templatesMap;
  }

  /**
   * Apply rules to AI prompt
   */
  applyRulesToPrompt(
    basePrompt: string,
    rules: DeepCodeRules,
    context: RuleContext
  ): string {
    let enhancedPrompt = basePrompt;

    // Add system instructions
    if (rules.aiConfig?.systemPrompt) {
      enhancedPrompt = `${rules.aiConfig.systemPrompt}\n\n${enhancedPrompt}`;
    }

    // Add context instructions
    if (rules.aiConfig?.contextInstructions) {
      const contextInstructions = rules.aiConfig.contextInstructions.join('\n');
      enhancedPrompt = `${contextInstructions}\n\n${enhancedPrompt}`;
    }

    // Add style preferences
    if (rules.global?.style) {
      enhancedPrompt += this.generateStyleInstructions(rules.global.style);
    }

    // Add naming conventions
    if (rules.global?.style?.naming) {
      enhancedPrompt += this.generateNamingInstructions(rules.global.style.naming);
    }

    // Add coding conventions
    if (rules.global?.conventions) {
      enhancedPrompt += this.generateConventionInstructions(rules.global.conventions);
    }

    // Add prohibited patterns
    if (rules.global?.prohibited) {
      enhancedPrompt += `\n\nDO NOT use: ${rules.global.prohibited.keywords?.join(', ') || 'N/A'}`;
      if (rules.global.prohibited.reason) {
        enhancedPrompt += `\nReason: ${rules.global.prohibited.reason}`;
      }
    }

    return enhancedPrompt;
  }

  /**
   * Validate code against rules
   */
  async validateCode(
    code: string,
    filePath: string
  ): Promise<{ valid: boolean; violations: string[] }> {
    const resolved = await this.resolveRulesForFile(filePath);
    const violations: string[] = [];
    const {rules} = resolved;

    // Check prohibited keywords
    if (rules.global?.prohibited?.keywords) {
      rules.global.prohibited.keywords.forEach((keyword) => {
        if (code.includes(keyword)) {
          violations.push(`Prohibited keyword found: ${keyword}`);
        }
      });
    }

    // Check max function length
    if (rules.global?.conventions?.maxFunctionLength) {
      const functions = this.extractFunctions(code);
      functions.forEach((func) => {
        if (func.lines > rules.global!.conventions!.maxFunctionLength!) {
          violations.push(
            `Function "${func.name}" exceeds max length (${func.lines} > ${rules.global!.conventions!.maxFunctionLength})`
          );
        }
      });
    }

    // Check max file length
    if (rules.global?.conventions?.maxFileLength) {
      const lineCount = code.split('\n').length;
      if (lineCount > rules.global.conventions.maxFileLength) {
        violations.push(
          `File exceeds max length (${lineCount} > ${rules.global.conventions.maxFileLength})`
        );
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Clear rules cache
   */
  clearCache(): void {
    this.rulesCache.clear();
  }

  // --- Private Methods ---

  /**
   * Find all .deepcoderules files from file path up to workspace root
   */
  private async findRulesInHierarchy(filePath: string): Promise<string[]> {
    const ruleFiles: string[] = [];
    let currentDir = this.getDirectory(filePath);

    while (currentDir && currentDir.startsWith(this.workspaceRoot)) {
      const rulesPath = `${currentDir}/.deepcoderules`;

      try {
        const exists = await this.fsService.exists(rulesPath);
        if (exists) {
          ruleFiles.unshift(rulesPath); // Add to beginning (workspace first)
        }
      } catch (error) {
        // File doesn't exist, continue
      }

      // Move up one directory
      const parentDir = this.getParentDirectory(currentDir);
      if (parentDir === currentDir) {break;} // Reached root
      currentDir = parentDir;
    }

    return ruleFiles;
  }

  /**
   * Load rules from file (with caching)
   */
  private async loadRules(filePath: string): Promise<DeepCodeRules | null> {
    // Check cache
    if (this.rulesCache.has(filePath)) {
      return this.rulesCache.get(filePath)!;
    }

    try {
      const content = await this.fsService.readFile(filePath);
      const rules = await this.parser.parse(content, filePath);

      // Cache the result
      this.rulesCache.set(filePath, rules);

      return rules;
    } catch (error) {
      logger.error(`Failed to load rules from ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Apply pattern-specific rules based on file matching
   */
  private applyPatternRules(
    baseRules: DeepCodeRules,
    context: RuleContext
  ): { rules: DeepCodeRules; appliedPatterns: string[] } {
    const appliedPatterns: string[] = [];

    if (!baseRules.patterns || baseRules.patterns.length === 0) {
      return { rules: baseRules, appliedPatterns };
    }

    // Sort patterns by priority (higher first)
    const sortedPatterns = [...baseRules.patterns].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );

    // Apply matching patterns
    const matchedRules: GlobalRules[] = [];

    sortedPatterns.forEach((pattern) => {
      if (this.matchesPattern(pattern, context)) {
        appliedPatterns.push(pattern.name);
        if (pattern.rules) {
          matchedRules.push(pattern.rules as GlobalRules);
        }
      }
    });

    // Merge pattern rules with base rules
    const finalRules: DeepCodeRules = {
      ...baseRules,
      global: (this.parser['deepMerge'] as any)(
        baseRules.global || {},
        ...matchedRules
      ),
    };

    return { rules: finalRules, appliedPatterns };
  }

  /**
   * Check if file matches pattern
   */
  private matchesPattern(pattern: PatternRules, context: RuleContext): boolean {
    const { match } = pattern;

    // Check file extensions
    if (match.extensions && !match.extensions.includes(context.fileType)) {
      return false;
    }

    // Check directories
    if (match.directories) {
      const matchesDir = match.directories.some((dir) =>
        context.directory.includes(dir)
      );
      if (!matchesDir) {return false;}
    }

    // Check file glob patterns
    if (match.files) {
      const matchesFile = match.files.some((glob) =>
        this.matchGlob(context.filePath, glob)
      );
      if (!matchesFile) {return false;}
    }

    // Check exclusions
    if (match.excludeFiles) {
      const excluded = match.excludeFiles.some((glob) =>
        this.matchGlob(context.filePath, glob)
      );
      if (excluded) {return false;}
    }

    if (match.excludeDirectories) {
      const excluded = match.excludeDirectories.some((dir) =>
        context.directory.includes(dir)
      );
      if (excluded) {return false;}
    }

    return true;
  }

  /**
   * Simple glob matcher
   */
  private matchGlob(path: string, pattern: string): boolean {
    const regex = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    return new RegExp(`^${regex}$`).test(path);
  }

  /**
   * Generate style instructions for AI
   */
  private generateStyleInstructions(style: any): string {
    let instructions = '\n\nStyle Preferences:\n';

    if (style.indentation) {
      instructions += `- Use ${style.indentation} for indentation (${style.indentSize || 2} ${style.indentation === 'spaces' ? 'spaces' : 'tab'})\n`;
    }

    if (style.quotes) {
      instructions += `- Use ${style.quotes} quotes\n`;
    }

    if (style.semicolons !== undefined) {
      instructions += `- ${style.semicolons ? 'Always use' : 'Never use'} semicolons\n`;
    }

    if (style.lineLength) {
      instructions += `- Keep lines under ${style.lineLength} characters\n`;
    }

    return instructions;
  }

  /**
   * Generate naming convention instructions
   */
  private generateNamingInstructions(naming: any): string {
    let instructions = '\n\nNaming Conventions:\n';

    if (naming.variables) {instructions += `- Variables: ${naming.variables}\n`;}
    if (naming.functions) {instructions += `- Functions: ${naming.functions}\n`;}
    if (naming.classes) {instructions += `- Classes: ${naming.classes}\n`;}
    if (naming.constants) {instructions += `- Constants: ${naming.constants}\n`;}

    return instructions;
  }

  /**
   * Generate coding convention instructions
   */
  private generateConventionInstructions(conventions: any): string {
    let instructions = '\n\nCoding Conventions:\n';

    if (conventions.errorHandling) {
      instructions += `- Error handling: Use ${conventions.errorHandling}\n`;
    }

    if (conventions.asyncPattern) {
      instructions += `- Async pattern: Use ${conventions.asyncPattern}\n`;
    }

    if (conventions.stateManagement) {
      instructions += `- State management: ${conventions.stateManagement}\n`;
    }

    return instructions;
  }

  /**
   * Extract functions from code for validation
   */
  private extractFunctions(code: string): Array<{ name: string; lines: number }> {
    const functions: Array<{ name: string; lines: number }> = [];

    // Simple regex to find functions (not perfect, but works for validation)
    const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>)\s*\{/g;

    let match;
    while ((match = functionRegex.exec(code)) !== null) {
      const name = match[1] || match[2] || 'anonymous';
      const start = match.index;

      // Find matching closing brace (simplified)
      let braceCount = 1;
      let end = start + match[0].length;

      while (braceCount > 0 && end < code.length) {
        if (code[end] === '{') {braceCount++;}
        if (code[end] === '}') {braceCount--;}
        end++;
      }

      const functionCode = code.substring(start, end);
      const lines = functionCode.split('\n').length;

      functions.push({ name, lines });
    }

    return functions;
  }

  /**
   * Get file extension
   */
  private getFileExtension(filePath: string): string {
    const parts = filePath.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  /**
   * Get directory from file path
   */
  private getDirectory(filePath: string): string {
    const parts = filePath.split(/[/\\]/);
    parts.pop(); // Remove filename
    return parts.join('/');
  }

  /**
   * Get parent directory
   */
  private getParentDirectory(dirPath: string): string {
    const parts = dirPath.split(/[/\\]/);
    parts.pop();
    return parts.join('/');
  }

  /**
   * Detect language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = this.getFileExtension(filePath);
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      rs: 'rust',
      go: 'go',
      rb: 'ruby',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
      cs: 'csharp',
    };

    return languageMap[ext] || 'unknown';
  }

  /**
   * Get built-in templates
   */
  private async getBuiltInTemplates(): Promise<DeepCodeRules['templates']> {
    return {
      'react-component': {
        name: 'React Component',
        description: 'Create a new React functional component',
        language: 'typescript',
        tags: ['react', 'component'],
        trigger: 'rfc',
        code: `import React from 'react';
import styled from 'styled-components';

interface {{ComponentName}}Props {
  {{propName}}?: {{propType}};
}

export const {{ComponentName}}: React.FC<{{ComponentName}}Props> = ({
  {{propName}}
}) => {
  return (
    <Container>
      <h1>{{ComponentName}}</h1>
      {{content}}
    </Container>
  );
};

const Container = styled.div\`
  padding: 20px;
\`;`,
        placeholders: [
          { name: 'ComponentName', type: 'string', required: true },
          { name: 'propName', type: 'string', default: 'children' },
          { name: 'propType', type: 'string', default: 'React.ReactNode' },
          { name: 'content', type: 'string', default: '{children}' },
        ],
      },
      'async-function': {
        name: 'Async Function',
        description: 'Create an async function with error handling',
        language: 'typescript',
        tags: ['async', 'function'],
        trigger: 'afn',
        code: `async function {{functionName}}({{params}}): Promise<{{returnType}}> {
  try {
    {{body}}

    return {{returnValue}};
  } catch (error) {
    logger.error('Error in {{functionName}}:', error);
    throw error;
  }
}`,
        placeholders: [
          { name: 'functionName', type: 'string', required: true },
          { name: 'params', type: 'string', default: '' },
          { name: 'returnType', type: 'string', default: 'void' },
          { name: 'body', type: 'string', default: '// Implementation here' },
          { name: 'returnValue', type: 'string', default: 'undefined' },
        ],
      },
      'api-service': {
        name: 'API Service',
        description: 'Create an API service class',
        language: 'typescript',
        tags: ['api', 'service', 'class'],
        trigger: 'api',
        code: `export class {{ServiceName}}Service {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get{{Resource}}(id: string): Promise<{{ResourceType}}> {
    const response = await fetch(\`\${this.baseUrl}/{{endpoint}}/\${id}\`);

    if (!response.ok) {
      throw new Error(\`Failed to fetch {{resource}}: \${response.statusText}\`);
    }

    return response.json();
  }

  async create{{Resource}}(data: Partial<{{ResourceType}}>): Promise<{{ResourceType}}> {
    const response = await fetch(\`\${this.baseUrl}/{{endpoint}}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(\`Failed to create {{resource}}: \${response.statusText}\`);
    }

    return response.json();
  }
}`,
        placeholders: [
          { name: 'ServiceName', type: 'string', required: true },
          { name: 'Resource', type: 'string', required: true },
          { name: 'ResourceType', type: 'string', required: true },
          { name: 'endpoint', type: 'string', required: true },
          { name: 'resource', type: 'string', required: true },
        ],
      },
    };
  }
}
