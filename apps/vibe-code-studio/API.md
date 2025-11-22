# DeepCode Editor API Documentation

## Overview

This document provides comprehensive API documentation for DeepCode Editor's services, hooks, and components. It serves as a reference for developers extending or integrating with the editor.

## Table of Contents

1. [Core Services](#core-services)
2. [AI Services](#ai-services)
3. [React Hooks](#react-hooks)
4. [Component APIs](#component-apis)
5. [Module System](#module-system)
6. [Event System](#event-system)
7. [Type Definitions](#type-definitions)

## Core Services

### FileSystemService

Handles all file system operations with support for both browser and Electron environments.

```typescript
interface FileSystemService {
  // Read file content
  readFile(path: string): Promise<string>;

  // Write file content
  writeFile(path: string, content: string): Promise<void>;

  // Delete file
  deleteFile(path: string): Promise<void>;

  // List directory contents
  readDirectory(path: string): Promise<FileInfo[]>;

  // Create directory
  createDirectory(path: string): Promise<void>;

  // Check if path exists
  exists(path: string): Promise<boolean>;

  // Get file stats
  getFileStats(path: string): Promise<FileStats>;

  // Watch for file changes
  watchFile(path: string, callback: (event: FileChangeEvent) => void): () => void;
}
```

#### Usage Example

```typescript
import { fileSystemService } from '@/services/FileSystemService';

// Read a file
const content = await fileSystemService.readFile('/src/App.tsx');

// Watch for changes
const unwatch = fileSystemService.watchFile('/src/App.tsx', (event) => {
  console.log(`File ${event.type}: ${event.path}`);
});
```

### WorkspaceService

Manages workspace indexing and code intelligence features.

```typescript
interface WorkspaceService {
  // Index workspace
  indexWorkspace(rootPath: string): Promise<void>;

  // Get file relationships
  getRelatedFiles(filePath: string): Promise<string[]>;

  // Search symbols
  searchSymbols(query: string): Promise<Symbol[]>;

  // Get file imports
  getFileImports(filePath: string): Promise<Import[]>;

  // Get file exports
  getFileExports(filePath: string): Promise<Export[]>;

  // Find references
  findReferences(filePath: string, position: Position): Promise<Reference[]>;
}
```

### GitService

Provides Git integration for version control operations.

```typescript
interface GitService {
  // Get repository status
  getStatus(): Promise<GitStatus>;

  // Stage files
  stageFiles(paths: string[]): Promise<void>;

  // Unstage files
  unstageFiles(paths: string[]): Promise<void>;

  // Commit changes
  commit(message: string): Promise<void>;

  // Get file diff
  getDiff(path: string): Promise<Diff>;

  // Get commit history
  getHistory(options?: HistoryOptions): Promise<Commit[]>;

  // Checkout branch
  checkout(branch: string): Promise<void>;

  // Create branch
  createBranch(name: string): Promise<void>;
}
```

## AI Services

### DeepSeekService

Core AI integration service for code completion and chat.

```typescript
interface DeepSeekService {
  // Initialize service
  initialize(config: DeepSeekConfig): void;

  // Get code completion
  getCompletion(params: CompletionParams): Promise<CompletionResult>;

  // Stream chat response
  streamChat(params: ChatParams): AsyncGenerator<ChatChunk>;

  // Get code explanation
  explainCode(code: string, language: string): Promise<string>;

  // Generate code
  generateCode(prompt: string, context?: CodeContext): Promise<string>;

  // Fix code issues
  fixCode(code: string, error: string): Promise<string>;
}
```

#### Configuration

```typescript
interface DeepSeekConfig {
  apiKey: string;
  baseUrl?: string;
  model?: 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner';
  temperature?: number;
  maxTokens?: number;
}
```

### MultiAgentReview

Orchestrates multiple AI agents for comprehensive code review.

```typescript
interface MultiAgentReview {
  // Run full review
  reviewCode(params: ReviewParams): Promise<ReviewResult>;

  // Run specific agent
  runAgent(agentType: AgentType, code: string): Promise<AgentResult>;

  // Get agent capabilities
  getAgentCapabilities(): AgentCapability[];

  // Configure agents
  configureAgents(config: AgentConfig): void;
}
```

#### Agent Types

```typescript
type AgentType = 'security' | 'performance' | 'quality' | 'test';

interface ReviewResult {
  summary: string;
  issues: Issue[];
  suggestions: Suggestion[];
  score: number;
  agentResults: Map<AgentType, AgentResult>;
}
```

## React Hooks

### useWorkspace

Provides workspace context and operations.

```typescript
function useWorkspace(): WorkspaceHook {
  return {
    // Workspace state
    rootPath: string
    files: FileNode[]
    isIndexing: boolean

    // Actions
    openFile: (path: string) => Promise<void>
    closeFile: (path: string) => void
    saveFile: (path: string) => Promise<void>
    refreshWorkspace: () => Promise<void>
  }
}
```

### useAI

Manages AI interactions and state.

```typescript
function useAI(): AIHook {
  return {
    // AI state
    isLoading: boolean
    conversation: Message[]

    // Actions
    sendMessage: (message: string) => Promise<void>
    clearConversation: () => void
    regenerateResponse: () => Promise<void>
    stopGeneration: () => void
  }
}
```

### useEditor

Provides editor state and actions.

```typescript
function useEditor(): EditorHook {
  return {
    // Editor state
    activeFile: string | null
    content: string
    language: string
    isDirty: boolean

    // Actions
    updateContent: (content: string) => void
    format: () => Promise<void>
    findReplace: (params: FindReplaceParams) => void
    goToLine: (line: number) => void
  }
}
```

## Component APIs

### Editor Component

Main code editor component with Monaco integration.

```typescript
interface EditorProps {
  // File path
  path?: string;

  // Initial content
  defaultValue?: string;

  // Controlled value
  value?: string;

  // Language mode
  language?: string;

  // Theme
  theme?: 'vs' | 'vs-dark' | 'hc-black';

  // Options
  options?: MonacoOptions;

  // Callbacks
  onChange?: (value: string) => void;
  onMount?: (editor: IStandaloneCodeEditor) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}
```

### AIChat Component

AI assistant chat interface.

```typescript
interface AIChatProps {
  // Initial messages
  initialMessages?: Message[];

  // Model selection
  model?: AIModel;

  // Max height
  maxHeight?: number;

  // Callbacks
  onSendMessage?: (message: string) => void;
  onClearChat?: () => void;
  onModelChange?: (model: AIModel) => void;
}
```

### FileExplorer Component

File tree navigation component.

```typescript
interface FileExplorerProps {
  // Root path
  rootPath: string;

  // Selected file
  selectedPath?: string;

  // Expanded directories
  expandedPaths?: Set<string>;

  // Show hidden files
  showHidden?: boolean;

  // Callbacks
  onFileSelect?: (path: string) => void;
  onFileCreate?: (path: string) => void;
  onFileDelete?: (path: string) => void;
  onFileRename?: (oldPath: string, newPath: string) => void;
}
```

## Module System

### Module Registration

```typescript
interface Module {
  // Module metadata
  name: string;
  version: string;
  description?: string;

  // Dependencies
  dependencies: string[];

  // Exports
  exports: string[];

  // Lifecycle hooks
  initialize?: () => Promise<void>;
  destroy?: () => Promise<void>;
}

// Register a module
ModuleRegistry.registerModule({
  name: 'custom-module',
  version: '1.0.0',
  dependencies: ['editor', 'workspace'],
  exports: ['CustomService', 'CustomComponent'],
  initialize: async () => {
    // Module initialization
  },
});
```

### Module Interface

```typescript
interface ModuleInterface {
  // Get module instance
  getInstance(): any;

  // Check if loaded
  isLoaded(): boolean;

  // Get exports
  getExports(): Map<string, any>;
}
```

## Event System

### Event Emitter

Global event system for inter-component communication.

```typescript
interface EventEmitter {
  // Subscribe to event
  on(event: string, handler: EventHandler): () => void;

  // Subscribe once
  once(event: string, handler: EventHandler): () => void;

  // Emit event
  emit(event: string, data?: any): void;

  // Remove handler
  off(event: string, handler: EventHandler): void;
}
```

### Common Events

```typescript
// File events
'file:open'; // { path: string }
'file:save'; // { path: string }
'file:close'; // { path: string }
'file:change'; // { path: string, content: string }

// Editor events
'editor:focus'; // { path: string }
'editor:blur'; // { path: string }
'editor:format'; // { path: string }

// AI events
'ai:request'; // { prompt: string }
'ai:response'; // { content: string }
'ai:error'; // { error: Error }
```

## Type Definitions

### File Types

```typescript
interface FileInfo {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
}

interface FileNode extends FileInfo {
  children?: FileNode[];
  isExpanded?: boolean;
  isSelected?: boolean;
}
```

### Editor Types

```typescript
interface Position {
  line: number;
  column: number;
}

interface Range {
  start: Position;
  end: Position;
}

interface Selection {
  anchor: Position;
  active: Position;
}
```

### AI Types

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface CompletionParams {
  prompt: string;
  language: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
}
```

## Error Handling

### Service Errors

```typescript
class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public service: string
  ) {
    super(message);
  }
}

// Usage
try {
  await fileSystemService.readFile(path);
} catch (error) {
  if (error instanceof ServiceError) {
    console.error(`${error.service} error: ${error.code}`);
  }
}
```

### Error Recovery

```typescript
interface ErrorRecovery {
  // Retry with exponential backoff
  retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;

  // Circuit breaker pattern
  withCircuitBreaker<T>(fn: () => Promise<T>, options?: CircuitBreakerOptions): Promise<T>;
}
```

## Best Practices

### Service Usage

1. Always handle errors appropriately
2. Use TypeScript types for type safety
3. Dispose of subscriptions and watchers
4. Cache expensive operations
5. Use debouncing for frequent operations

### Component Integration

1. Use hooks for state management
2. Memoize expensive computations
3. Handle loading and error states
4. Provide meaningful error messages
5. Follow accessibility guidelines

### Performance

1. Lazy load heavy components
2. Use virtual scrolling for lists
3. Debounce user input
4. Optimize re-renders
5. Monitor memory usage

## Extending DeepCode Editor

### Creating a Plugin

```typescript
interface Plugin {
  name: string;
  version: string;
  activate(context: PluginContext): void;
  deactivate(): void;
}

class MyPlugin implements Plugin {
  name = 'my-plugin';
  version = '1.0.0';

  activate(context: PluginContext) {
    // Register commands
    context.registerCommand('myPlugin.hello', () => {
      console.log('Hello from plugin!');
    });

    // Add UI elements
    context.addMenuItem({
      id: 'myPlugin.menu',
      label: 'My Plugin',
      command: 'myPlugin.hello',
    });
  }

  deactivate() {
    // Cleanup
  }
}
```

### Custom AI Agent

```typescript
class CustomAgent extends BaseSpecializedAgent {
  name = 'custom-agent';
  capabilities = ['custom-analysis'];

  async analyze(code: string): Promise<AgentResult> {
    // Custom analysis logic
    return {
      agentName: this.name,
      issues: [],
      suggestions: [],
      score: 100,
    };
  }
}

// Register agent
AgentOrchestrator.registerAgent(new CustomAgent());
```

## Conclusion

This API documentation covers the core interfaces and patterns used in DeepCode Editor. For specific implementation details and examples, refer to the source code and unit tests. The APIs are designed to be intuitive, type-safe, and extensible.
