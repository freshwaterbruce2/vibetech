/**
 * Custom Instructions Types
 * Defines the structure for .deepcoderules files
 */

export interface DeepCodeRules {
  version: string;
  description?: string;
  metadata?: RuleMetadata;
  global?: GlobalRules;
  patterns?: PatternRules[];
  templates?: TemplateLibrary;
  aiConfig?: AIConfiguration;
}

export interface RuleMetadata {
  author?: string;
  created?: string;
  lastModified?: string;
  tags?: string[];
  extends?: string[]; // Inherit from other .deepcoderules files
}

export interface GlobalRules {
  language?: string;
  framework?: string;
  style?: StylePreferences;
  conventions?: CodingConventions;
  imports?: ImportRules;
  comments?: CommentRules;
  formatting?: FormattingRules;
  prohibited?: ProhibitedPatterns;
  required?: RequiredPatterns;
}

export interface StylePreferences {
  indentation?: 'spaces' | 'tabs';
  indentSize?: number;
  quotes?: 'single' | 'double';
  semicolons?: boolean;
  trailingComma?: boolean;
  lineLength?: number;
  naming?: NamingConventions;
}

export interface NamingConventions {
  variables?: 'camelCase' | 'snake_case' | 'PascalCase' | 'SCREAMING_SNAKE_CASE';
  functions?: 'camelCase' | 'snake_case' | 'PascalCase';
  classes?: 'PascalCase' | 'snake_case';
  constants?: 'SCREAMING_SNAKE_CASE' | 'camelCase';
  files?: 'kebab-case' | 'camelCase' | 'PascalCase' | 'snake_case';
  components?: 'PascalCase' | 'kebab-case';
}

export interface CodingConventions {
  errorHandling?: 'try-catch' | 'error-first-callback' | 'promises' | 'async-await';
  asyncPattern?: 'callbacks' | 'promises' | 'async-await';
  stateManagement?: 'local' | 'context' | 'redux' | 'zustand' | 'jotai';
  testingFramework?: 'jest' | 'vitest' | 'mocha' | 'playwright';
  maxFunctionLength?: number;
  maxFileLength?: number;
  preferredPatterns?: string[];
  avoidedPatterns?: string[];
}

export interface ImportRules {
  order?: ('builtin' | 'external' | 'internal' | 'parent' | 'sibling' | 'index')[];
  grouping?: boolean;
  sortWithinGroups?: boolean;
  absoluteFirst?: boolean;
  preferredImportStyle?: 'named' | 'default' | 'namespace';
  pathAliases?: Record<string, string>;
}

export interface CommentRules {
  style?: 'jsdoc' | 'tsdoc' | 'inline' | 'block';
  requireForFunctions?: boolean;
  requireForClasses?: boolean;
  requireForComplexLogic?: boolean;
  includeExamples?: boolean;
  includeTypeInfo?: boolean;
}

export interface FormattingRules {
  bracesStyle?: 'same-line' | 'new-line';
  spaceBeforeFunctionParen?: boolean;
  spaceInParens?: boolean;
  arrowParens?: 'always' | 'avoid';
  endOfLine?: 'lf' | 'crlf' | 'auto';
}

export interface ProhibitedPatterns {
  keywords?: string[];
  imports?: string[];
  functions?: string[];
  patterns?: RegExp[];
  reason?: string;
}

export interface RequiredPatterns {
  imports?: string[];
  headers?: string[];
  footers?: string[];
  patterns?: RegExp[];
}

export interface PatternRules {
  name: string;
  description?: string;
  match: FilePattern;
  rules: Partial<GlobalRules>;
  priority?: number;
}

export interface FilePattern {
  files?: string[]; // Glob patterns
  extensions?: string[];
  directories?: string[];
  excludeFiles?: string[];
  excludeDirectories?: string[];
}

export interface TemplateLibrary {
  [templateName: string]: CodeTemplate;
}

export interface CodeTemplate {
  name: string;
  description?: string;
  language?: string;
  tags?: string[];
  trigger?: string; // Shorthand to insert template
  code: string;
  placeholders?: TemplatePlaceholder[];
  examples?: string[];
}

export interface TemplatePlaceholder {
  name: string;
  description?: string;
  default?: string;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
}

export interface AIConfiguration {
  model?: 'deepseek' | 'haiku' | 'sonnet' | 'auto';
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  contextInstructions?: string[];
  completionStyle?: 'concise' | 'verbose' | 'balanced';
  includeComments?: boolean;
  includeTypes?: boolean;
  suggestRefactoring?: boolean;
  suggestTests?: boolean;
}

export interface RuleContext {
  filePath: string;
  fileType: string;
  directory: string;
  language: string;
  currentCode?: string;
  cursorPosition?: { line: number; column: number };
}

export interface ResolvedRules {
  rules: DeepCodeRules;
  sources: string[]; // Paths to .deepcoderules files that were merged
  appliedPatterns: string[]; // Pattern names that matched
}

export interface RuleViolation {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
  fix?: string;
}

export interface RuleValidationResult {
  valid: boolean;
  violations: RuleViolation[];
  warnings: string[];
}
