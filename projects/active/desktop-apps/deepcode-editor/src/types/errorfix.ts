/**
 * Auto-Fix Error Types
 */

export interface DetectedError {
  id: string;
  type: 'typescript' | 'eslint' | 'runtime';
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line: number;
  column: number;
  code?: string;
  source?: string;
}

export interface ErrorFix {
  errorId: string;
  description: string;
  originalCode: string;
  fixedCode: string;
  diff: string;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface StackTrace {
  message: string;
  stack: StackFrame[];
  type: string;
}

export interface StackFrame {
  file: string;
  line: number;
  column: number;
  function: string;
}
