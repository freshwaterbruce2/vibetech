# DeepCode Editor - AI Agent Instructions

A modern AI-powered code editor built with React + TypeScript, targeting Cursor IDE alternatives using DeepSeek AI integration.

## 🎯 Architecture Overview

**Hybrid Desktop Application**: Tauri-based (primary) with Electron/web fallbacks
- **Frontend**: React 19 + TypeScript + styled-components
- **Editor**: Monaco Editor (VS Code engine)
- **AI**: DeepSeek API integration (chat, coder, reasoner models)
- **State**: Zustand + React hooks pattern
- **Build**: Vite + strict TypeScript configuration

### Key Design Patterns

**Service Layer Architecture**: Business logic isolated from UI
```typescript
// Services live in src/services/ - never put business logic in components
src/services/ai/UnifiedAIService.ts     // All AI interactions
src/services/FileSystemService.ts       // File operations (Tauri/Electron/browser)
src/services/WorkspaceService.ts        // Project indexing & analysis
```

**Multi-Agent System**: Specialized AI agents for different tasks
```typescript
src/services/specialized-agents/         // Agent implementations
src/services/ai/TaskPlanner.ts          // Breaks down user requests
src/services/ai/ExecutionEngine.ts      // Executes agent tasks
```

**Path Mapping**: Use TypeScript aliases consistently
```typescript
import { AIService } from '@/services/ai/UnifiedAIService'
import { EditorFile } from '@/types'
import { useWorkspace } from '@/hooks/useWorkspace'
```

## 🔧 Critical Developer Workflows

### Development Commands
```bash
pnpm dev                      # Tauri development (primary)
pnpm dev:web                  # Web-only development (port 3006)
pnpm hook:test-watch          # Auto-run tests on changes
pnpm build:production         # Optimized production build
```

**Package Manager**: Uses `pnpm` for faster installs and efficient dependency management

### Pre-commit System
**Automatic checks via Husky + lint-staged**:
- TypeScript type checking (strict mode)
- ESLint with auto-fixing
- Prettier formatting
- Import organization

### Testing Strategy
**Vitest + jsdom environment**:
- Target: >50% coverage (currently ~28%)
- Pattern: `src/__tests__/` mirrors `src/` structure
- Focus: Services first, then critical components

## 🚀 AI Integration Patterns

### Unified Chat Interface (Key Feature)
**Three modes in one sidebar** (`src/components/AIChat.tsx`):
```typescript
type ChatMode = 'chat' | 'agent' | 'composer'
// Chat: Conversational assistance
// Agent: Multi-step autonomous tasks (Ctrl+Shift+A)
// Composer: Multi-file editing workflow
```

### Context-Aware AI
**Project structure detection** for better AI responses:
```typescript
// ProjectStructureDetector handles multiple project types
src/utils/ProjectStructureDetector.ts
// Supports: nodejs, expo, react, backend, monorepo
```

**Workspace indexing** for intelligent suggestions:
```typescript
WorkspaceService.indexWorkspace() // Analyzes entire codebase
// Provides file relationships, dependencies, symbols to AI
```

## 🏗️ Project Structure Conventions

### Component Organization
```
src/components/
├── Editor.tsx              # Monaco wrapper with AI completion
├── AIChat.tsx             # Unified chat interface (core feature)
├── Sidebar.tsx            # File explorer
├── LazyComponents.tsx     # Code-split heavy components
└── ErrorBoundary/         # Modern error handling
```

### Service Dependencies
**FileSystemService**: Handles Tauri/Electron/browser differences
```typescript
// Always use FileSystemService, never direct fs calls
await fileSystemService.readFile(path)  // ✅ Cross-platform
await fs.readFile(path)                 // ❌ Node.js only
```

### File Naming Patterns
- **Components**: PascalCase (`AIChat.tsx`, `ModelSelector.tsx`)
- **Services**: PascalCase (`DeepSeekService.ts`)
- **Hooks**: camelCase with `use` prefix (`useWorkspace.ts`)
- **Types**: PascalCase interfaces (`EditorFile`, `AIMessage`)

## 🔍 Key Integration Points

### Tauri vs Browser Mode
**Conditional platform features**:
```typescript
if (window.__TAURI__) {
  // Use Tauri APIs for file system, dialogs
} else {
  // Fallback to browser APIs or mock services
}
```

### AI Model Switching
**Runtime model selection** (`ModelSelector` component):
- `deepseek-chat` (default)
- `deepseek-coder` (specialized)
- `deepseek-reasoner` (chain-of-thought)

### Error Handling Strategy
**ModernErrorBoundary** with recovery options:
```typescript
// All major UI sections wrapped in error boundaries
// Services return Result<T, Error> patterns where possible
```

## 📋 Development Patterns

### State Management
**Zustand for global state**, React hooks for local:
```typescript
// Global: Editor settings, workspace context
// Local: Component-specific UI state, form data
```

### Async Patterns
**Streaming AI responses**:
```typescript
// Use Server-Sent Events pattern for real-time AI
for await (const chunk of aiService.sendMessageStream()) {
  // Handle incremental responses
}
```

### Build Optimization
**Vite configuration** optimizes for performance:
- Code splitting by vendor (`react-vendor`, `monaco`, `ai-utils`)
- Compression (gzip + brotli)
- Tree shaking enabled

## ⚠️ Critical Constraints

1. **Browser Compatibility**: Always provide fallbacks for Tauri-specific features
2. **AI Token Management**: Respect DeepSeek rate limits and context windows
3. **Performance**: Monaco Editor must stay in separate chunk (large bundle)
4. **Type Safety**: Strict TypeScript mode - no `any` types
5. **Cross-Platform**: File paths must work on Windows/Linux/macOS

## 🚨 Common Pitfalls

- **Don't** put AI service calls directly in components - use services
- **Don't** hardcode file paths like `src/index.ts` - use ProjectStructureDetector
- **Don't** forget error boundaries around async operations
- **Don't** import heavy dependencies in main bundle - use lazy loading
- **Always** handle both Tauri and browser environments

## 📚 Key Files for Context

- `src/App.tsx` - Main orchestrator, service initialization
- `CLAUDE.md` - Detailed AI development guidelines  
- `ARCHITECTURE.md` - In-depth technical documentation
- `package.json` + `pnpm-lock.yaml` - Dependencies and scripts (uses pnpm)
- `vite.config.ts` - Build optimization configuration

Focus on understanding the service layer architecture and AI integration patterns before making changes.