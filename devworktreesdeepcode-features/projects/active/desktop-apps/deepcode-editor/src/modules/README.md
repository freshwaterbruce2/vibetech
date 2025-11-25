# Modular Architecture

This directory contains the modular architecture implementation for DeepCode Editor.

## Module Structure

Each module follows a consistent structure:

```
module-name/
├── components/     # React components specific to this module
├── services/       # Business logic and API services
├── hooks/          # React hooks for state and logic
├── types/          # TypeScript interfaces and types
└── index.ts        # Module public API and configuration
```

## Core Modules

### 1. Editor Module (`/editor`)

- **Purpose**: Core code editing functionality
- **Components**: EditorCore, EditorToolbar, FileTabs
- **Services**: EditorService (file operations, syntax detection)
- **Exports**: EditorCore component, useEditorState hook

### 2. AI Assistant Module (`/ai-assistant`)

- **Purpose**: AI-powered code completion and chat
- **Components**: AIChat, CodeCompletion, SuggestionPanel
- **Services**: DeepSeekService, PromptBuilder
- **Dependencies**: Editor module

### 3. Version Control Module (`/version-control`)

- **Purpose**: Git integration and version control
- **Components**: GitPanel, CommitDialog, BranchSelector
- **Services**: GitService
- **Dependencies**: Editor, Workspace modules

### 4. Workspace Module (`/workspace`)

- **Purpose**: Project management and file explorer
- **Components**: FileExplorer, ProjectSettings
- **Services**: WorkspaceService, FileSystemService
- **Exports**: File tree, project context

### 5. Shared Module (`/shared`)

- **Purpose**: Common utilities and types
- **Contents**: Shared types, utilities, hooks
- **No dependencies**: Used by all other modules

## Module Communication

Modules communicate through well-defined interfaces:

```typescript
// Example: Editor module interface
export interface EditorModuleInterface {
  openFile: (path: string) => Promise<void>;
  closeFile: (path: string) => void;
  saveFile: (path: string) => Promise<void>;
  getActiveFile: () => EditorFile | null;
  getOpenFiles: () => EditorFile[];
}
```

## Module Registry

The `ModuleRegistry` manages module lifecycle and dependencies:

```typescript
import ModuleRegistry from '../ModuleRegistry';

// Register module
ModuleRegistry.registerModule({
  name: 'editor',
  version: '1.0.0',
  dependencies: ['workspace'],
  exports: ['EditorCore', 'useEditorState'],
});

// Set module interface
ModuleRegistry.setModuleInterface('editor', editorInterface);

// Get module interface
const editor = ModuleRegistry.getModuleInterface('editor');
```

## Benefits

1. **Separation of Concerns**: Each module handles one domain
2. **Scalability**: Easy to add new features as modules
3. **Testability**: Modules can be tested in isolation
4. **Team Collaboration**: Teams can work on separate modules
5. **Lazy Loading**: Modules can be loaded on-demand
6. **Clear Dependencies**: Explicit module dependencies

## Migration Strategy

1. Start with core modules (Editor, Workspace)
2. Gradually move existing code into modules
3. Update imports to use module APIs
4. Remove old structure once migration is complete

## Best Practices

1. Keep modules focused on a single domain
2. Define clear interfaces for cross-module communication
3. Minimize dependencies between modules
4. Use the shared module for common utilities
5. Document module APIs in the index.ts file
