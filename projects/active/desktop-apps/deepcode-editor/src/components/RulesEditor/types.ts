/**
 * RulesEditor Types
 * Type definitions for the Rules Editor component
 */
import type { ParsedRules, Rule } from '../../services/RulesParser';

export interface RulesEditorProps {
  workspaceRoot: string;
  onSave?: (content: string, filename: string) => Promise<void>;
  onClose?: () => void;
}

export type EditorMode = 'edit' | 'preview' | 'test';

export type RulesFilename = '.deepcoderules' | '.cursorrules';

export interface RulesEditorState {
  content: string;
  filename: RulesFilename;
  parsedRules: ParsedRules | null;
  parseError: string | null;
  selectedTemplate: string;
  testFilePath: string;
  matchingRules: Rule[];
  mode: EditorMode;
}

export type { ParsedRules, Rule };
