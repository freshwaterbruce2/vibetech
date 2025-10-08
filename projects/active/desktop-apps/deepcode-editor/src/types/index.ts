export interface EditorFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isModified: boolean;
  // Test comment - hooks test successful!
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning_content?: string | undefined; // For deepseek-reasoner CoT
  timestamp: Date;
  metadata?:
    | {
        model?: string | undefined;
        tokens?: number | undefined;
        processing_time?: number | undefined;
      }
    | undefined;
}

export interface AIResponse {
  content: string;
  suggestions?: string[];
  actions?: AIAction[];
  metadata?: {
    model: string;
    tokens: number;
    processing_time: number;
  };
}

export interface AIAction {
  type: 'code_completion' | 'code_generation' | 'code_explanation' | 'code_refactor';
  data: AIActionData;
}

export type AIActionData = 
  | CodeCompletionData
  | CodeGenerationData
  | CodeExplanationData
  | CodeRefactorData;

export interface CodeCompletionData {
  code: string;
  position: { line: number; column: number };
}

export interface CodeGenerationData {
  prompt: string;
  code: string;
  language: string;
}

export interface CodeExplanationData {
  code: string;
  explanation: string;
}

export interface CodeRefactorData {
  originalCode: string;
  refactoredCode: string;
  changes: string[];
}

export interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileSystemItem[];
  size?: number;
  modified?: Date;
}

export interface EditorSettings {
  theme: 'dark' | 'light';
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  autoSave: boolean;
  aiAutoComplete: boolean;
  aiSuggestions: boolean;
  aiModel?: 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner';
  showReasoningProcess?: boolean;
  lineNumbers?: boolean;
  folding?: boolean;
  bracketMatching?: boolean;
  autoIndent?: boolean;
  formatOnSave?: boolean;
  rulers?: number[];
  renderWhitespace?: boolean;
  smoothScrolling?: boolean;
  cursorBlinking?: boolean;
}

export interface Project {
  name: string;
  path: string;
  lastOpened: Date;
  files: string[];
}

export interface AICodeCompletion {
  text: string;
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  confidence: number;
}

export interface DeepSeekConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface FileAnalysis {
  path: string;
  name: string;
  extension: string;
  language: string;
  size: number;
  lastModified: Date;
  imports: string[];
  exports: string[];
  symbols: string[];
  dependencies: string[];
  isTestFile: boolean;
  isConfigFile: boolean;
  complexity: number;
  summary: string;
  searchScore?: number;
}

export interface WorkspaceContext {
  rootPath: string;
  totalFiles: number;
  languages: string[];
  testFiles: number;
  projectStructure: Record<string, unknown>;
  dependencies: Record<string, string[]>;
  exports: Record<string, string[]>;
  symbols: Record<string, string[]>;
  lastIndexed: Date;
  summary: string;
}

export interface ContextualFile {
  path: string;
  content: string;
  relevance: number;
  reason: string;
}

export interface AIContextRequest {
  currentFile?: EditorFile | undefined;
  relatedFiles: ContextualFile[];
  workspaceContext: WorkspaceContext;
  userQuery: string;
  conversationHistory: AIMessage[];
}

export interface MultiFileEdit {
  file: string;
  changes: {
    startLine: number;
    endLine: number;
    newContent: string;
  }[];
  reason: string;
}

export interface AICodeGenerationRequest {
  prompt: string;
  context: AIContextRequest;
  targetFile?: string;
  insertionPoint?: {
    line: number;
    column: number;
  };
}

export interface AICodeGenerationResponse {
  code: string;
  language: string;
  explanation: string;
  multiFileEdits?: MultiFileEdit[];
  suggestedTests?: string;
  dependencies?: string[];
}

// Worker message types
export interface WorkerMessage<T = unknown> {
  id: string;
  type: string;
  payload: T;
}

export interface WorkerResponse<T = unknown> {
  id: string;
  type: string;
  result: T;
  error?: string;
}

// Git types
export interface GitCommit {
  hash: string;
  author: string;
  email: string;
  date: string;
  message: string;
}

export interface GitStatus {
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
}

// Error types
export interface AppError {
  message: string;
  code?: string;
  stack?: string;
  details?: unknown;
}

// Monaco Editor types
export interface MonacoPosition {
  lineNumber: number;
  column: number;
}

export interface MonacoRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

// Markdown types
export interface MarkdownParseOptions {
  sanitize?: boolean;
  highlight?: boolean;
  breaks?: boolean;
  gfm?: boolean;
}

export interface TOCItem {
  level: number;
  text: string;
  id: string;
}

export interface ReadingTime {
  minutes: number;
  words: number;
  time: string;
}

export type MarkdownResult = string | TOCItem[] | ReadingTime;

// Code analysis types
export interface CodeAnalysisOptions {
  includeImports?: boolean;
  includeExports?: boolean;
  includeComplexity?: boolean;
}

export interface CodeAnalysisResult {
  imports: string[];
  exports: string[];
  complexity: number;
  issues: CodeIssue[];
}

export interface CodeIssue {
  type: 'error' | 'warning' | 'info';
  line: number;
  column: number;
  message: string;
  rule?: string;
}

// Search types
export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
}

export interface SearchResult {
  file: string;
  line: number;
  column: number;
  match: string;
  preview: string;
}

// Module types
export interface ModuleConfig {
  id: string;
  name: string;
  version: string;
  dependencies?: string[];
  exports?: Record<string, unknown>;
}

// Virtual list types
export interface VirtualListItem {
  id: string | number;
  height?: number;
  data: unknown;
}

// File tree types
export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  expanded?: boolean;
  isLoading?: boolean;
}

// Notification types
export interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}
