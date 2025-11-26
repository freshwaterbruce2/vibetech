/**
 * Settings Types
 * Type definitions for the Settings component
 */
import type { EditorSettings } from '../../types';

export interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
}

export interface ModelPricing {
  input: string;
  output: string;
  context: string;
}

export type ModelId = 
  | 'gpt-5' | 'gpt-5-mini' | 'gpt-5-nano'
  | 'claude-sonnet-4-5' | 'claude-opus-4-1'
  | 'gemini-2-5-pro' | 'gemini-2-5-flash' | 'gemini-2-5-flash-lite' | 'gemini-2-0-flash'
  | 'deepseek-chat' | 'deepseek-reasoner';

export const MODEL_PRICING: Record<ModelId, ModelPricing> = {
  'gpt-5': { input: '$1.25', output: '$10.00', context: '272K' },
  'gpt-5-mini': { input: '$0.25', output: '$2.00', context: '272K' },
  'gpt-5-nano': { input: '$0.05', output: '$0.40', context: '272K' },
  'claude-sonnet-4-5': { input: '$3.00', output: '$15.00', context: '200K' },
  'claude-opus-4-1': { input: '$20.00', output: '$80.00', context: '200K' },
  'gemini-2-5-pro': { input: '$1.25', output: '$10.00', context: '2M' },
  'gemini-2-5-flash': { input: '$0.30', output: '$1.20', context: '1M' },
  'gemini-2-5-flash-lite': { input: '$0.075', output: '$0.30', context: '1M' },
  'gemini-2-0-flash': { input: '$0.10', output: '$0.40', context: '1M' },
  'deepseek-chat': { input: '$0.028', output: '$0.042', context: '128K' },
  'deepseek-reasoner': { input: '$0.028', output: '$0.042', context: '128K' },
};

export const DEFAULT_SETTINGS: EditorSettings = {
  theme: 'dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  autoSave: true,
  aiAutoComplete: true,
  aiSuggestions: true,
  aiModel: 'deepseek-chat',
  showReasoningProcess: false,
  lineNumbers: true,
  folding: true,
  bracketMatching: true,
  autoIndent: true,
  formatOnSave: true,
  rulers: [80, 120],
  renderWhitespace: false,
  smoothScrolling: true,
  cursorBlinking: true,
};

export const REASONING_MODELS: ModelId[] = [
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
  'claude-sonnet-4-5',
  'claude-opus-4-1',
  'gemini-2-5-pro',
];

export type { EditorSettings };
