# @vibetech/types

Shared TypeScript type definitions for VibeTech monorepo projects.

## Installation

```bash
pnpm add @vibetech/types@workspace:*
```

## Modules

### Tasks (`@vibetech/types/tasks`)

Background task queue system with status tracking, priorities, and progress monitoring.

**Types:**
- `TaskStatus` - Enum: queued, running, paused, completed, failed, canceled
- `TaskPriority` - Enum: LOW, NORMAL, HIGH, CRITICAL
- `TaskType` - Enum: code_analysis, file_indexing, ai_completion, multi_file_edit, etc.
- `BackgroundTask` - Complete task definition with metadata
- `TaskProgress` - Progress tracking with percentage
- `TaskResult` - Task execution result with success/error info
- `TaskExecutor` - Interface for task execution handlers
- `TaskQueueOptions` - Queue configuration
- `TaskNotification` - Task notification events
- `TaskFilter` - Task filtering criteria
- `TaskStats` - Aggregate task statistics

**Usage:**
```typescript
import { BackgroundTask, TaskStatus, TaskPriority } from '@vibetech/types/tasks';

const task: BackgroundTask = {
  id: 'task-123',
  type: 'code_analysis',
  name: 'Analyze codebase',
  priority: TaskPriority.HIGH,
  status: TaskStatus.QUEUED,
  progress: { current: 0, total: 100, percentage: 0 },
  createdAt: new Date(),
  cancelable: true,
  pausable: true,
  retryCount: 0,
  maxRetries: 3
};
```

### Error Fixing (`@vibetech/types/errorfix`)

Error detection, stack trace parsing, and fix suggestion types.

**Types:**
- `DetectedError` - Error with location and severity
- `ErrorFix` - Fix suggestion with diff and confidence
- `StackTrace` - Stack trace with parsed frames
- `StackFrame` - Individual stack frame with file/line/column

**Usage:**
```typescript
import { DetectedError, ErrorFix } from '@vibetech/types/errorfix';

const error: DetectedError = {
  id: 'err-456',
  type: 'typescript',
  severity: 'error',
  message: 'Type string is not assignable to type number',
  file: 'src/utils.ts',
  line: 42,
  column: 10,
  code: 'TS2322'
};

const fix: ErrorFix = {
  errorId: 'err-456',
  description: 'Change variable type to number',
  originalCode: 'const value: string = 42;',
  fixedCode: 'const value: number = 42;',
  diff: '- const value: string = 42;\n+ const value: number = 42;',
  confidence: 'high',
  explanation: 'The value is a number, not a string'
};
```

### Multi-File Editing (`@vibetech/types/multifile`)

Multi-file editing plans, file change tracking, and dependency analysis.

**Types:**
- `FileChange` - Individual file change with diff
- `MultiFileEditPlan` - Complete editing plan with impact assessment
- `MultiFileEditResult` - Execution result with success/failure tracking
- `DependencyNode` - File dependency information
- `DependencyGraph` - Project-wide dependency graph

**Usage:**
```typescript
import { FileChange, MultiFileEditPlan } from '@vibetech/types/multifile';

const change: FileChange = {
  path: 'src/utils.ts',
  originalContent: 'export const foo = 1;',
  newContent: 'export const foo = 2;',
  diff: '- export const foo = 1;\n+ export const foo = 2;',
  changeType: 'modify',
  reason: 'Update constant value'
};

const plan: MultiFileEditPlan = {
  id: 'plan-789',
  description: 'Refactor constants',
  files: [change],
  dependencies: ['src/index.ts', 'src/app.ts'],
  estimatedImpact: 'low',
  createdAt: new Date()
};
```

## Why These Types?

These type definitions were extracted from `deepcode-editor` as they represent truly generic patterns that can be reused across multiple projects:

- **Task System**: Any app with background processing (builds, tests, AI operations)
- **Error Handling**: Any app with error detection and auto-fixing capabilities
- **File Operations**: Any editor or file manipulation tool

## Projects Using This Package

- `deepcode-editor` - AI code editor (original source)
- Add your project here when you integrate this package

## Development

```bash
# Build types
pnpm run build

# Clean build output
pnpm run clean
```

## Version History

- **1.0.0** (2025-10-26) - Initial release with tasks, errorfix, and multifile types extracted from deepcode-editor
