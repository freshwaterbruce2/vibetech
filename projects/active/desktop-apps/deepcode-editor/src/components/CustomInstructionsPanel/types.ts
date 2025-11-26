/**
 * CustomInstructionsPanel Types
 * Type definitions for the Custom Instructions Panel component
 */
import type { CodeTemplate, DeepCodeRules } from '../../types/customInstructions';

export interface CustomInstructionsPanelProps {
  workspaceRoot: string;
  currentRules?: DeepCodeRules;
  templates?: Map<string, DeepCodeRules['templates']>;
  onSaveRules: (rules: DeepCodeRules) => Promise<void>;
  onLoadRules: () => Promise<DeepCodeRules | null>;
  onExportRules: (rules: DeepCodeRules) => void;
  onImportRules: (file: File) => Promise<void>;
}

export type TabType = 'global' | 'patterns' | 'templates' | 'ai';

export interface StylePreferences {
  indentation: 'spaces' | 'tabs';
  indentSize: number;
  quotes: 'single' | 'double';
  semicolons: boolean;
  lineLength: number;
  naming?: NamingConventions;
}

export interface NamingConventions {
  variables: 'camelCase' | 'snake_case' | 'PascalCase';
  functions: 'camelCase' | 'snake_case' | 'PascalCase';
  classes: 'PascalCase' | 'snake_case';
  constants: 'SCREAMING_SNAKE_CASE' | 'camelCase';
}

export interface AIConfig {
  model: 'auto' | 'deepseek' | 'haiku' | 'sonnet';
  temperature: number;
  maxTokens: number;
  completionStyle: 'concise' | 'balanced' | 'verbose';
  includeComments: boolean;
  includeTypes: boolean;
  systemPrompt?: string;
}

export type { CodeTemplate, DeepCodeRules };
