# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 MCP-FIRST DEVELOPMENT APPROACH WITH 2025 BEST PRACTICES

**IMPORTANT**: At the start of EVERY session, Claude MUST:

1. Run `node .claude/session-init.js` to analyze project state (if exists)
2. Review the generated recommendations and validation reports
3. Use MCP servers throughout the session
4. Check `.claude/search-queries.json` and use WebSearch MCP for latest patterns
5. Run `npm run hook:validate-patterns` to ensure 2025 compliance

## 📊 Current Project Status

- **Architecture**: Transitioning to modular multi-agent system
- **Test Coverage**: 27 test files for 95 source files (~28% file coverage)
- **Recent Changes**: Production-ready features, removed mock data, fixed TypeScript errors
- **Pre-commit Hooks**: Automated TypeScript checking, linting, and formatting

## Development Commands

### Windows Development Environment
```powershell
# Verify application is working
.\verify-app-working.ps1

# Install dependencies and run verification
npm install
```

### Core Development

- `npm run dev` - Start full development environment (web + electron)
- `npm run dev:web` - Start web development server only (port 3001)
- `npm run dev:electron` - Start Electron app (requires web server running)

### Build & Package

- `npm run build` - Build TypeScript and create production bundle
- `npm run build:electron` - Build and package Electron app
- `npm run package` - Create distributable package
- `npm run dist` - Create distribution packages

### Code Quality

- `npm run lint` - Run ESLint with TypeScript support
- `npm test` - Run Vitest test suite
- `npm run preview` - Preview production build

### Development Hooks (USE THESE!)

- `npm run hook:test-watch` - Auto-run tests on file changes
- `npm run hook:format-watch` - Auto-format on save
- `npm run hook:pre-commit` - Run pre-commit checks manually
- `npm run hook:screenshot` - Capture UI screenshots
- `npm run hook:performance` - Monitor performance metrics
- `npm run hook:docs` - Generate documentation
- `npm run hook:validate-patterns` - Check for outdated patterns and generate search queries
- `npm run hook:validate-tech` - Validate tech stack against 2025 standards
- `npm run hook:memory` - Take memory snapshot and analyze usage
- `npm run hook:memory-watch` - Real-time memory monitoring during development

### Pre-commit Hooks (Automated)

When committing code, the following checks run automatically:

- TypeScript type checking (fails fast on errors)
- ESLint with auto-fix for imports and code style
- Prettier formatting
- Console.log detection (warning only)
- Lint-staged for targeted file processing

### Single Test

- `npx vitest run <test-file>` - Run specific test file
- `npx vitest watch` - Run tests in watch mode

## 🤖 MCP Integration Requirements

### BEFORE modifying any code:

1. Use `@filesystem:file:///path` to check current state
2. Analyze dependencies and imports
3. Look for existing patterns

### AFTER UI changes:

1. Run `/mcp__puppeteer__screenshot` to capture state
2. Check performance impact
3. Verify accessibility

### BEFORE commits:

1. Check git status
2. Run linting and tests
3. Use meaningful commit messages

## Architecture Overview

This is an AI-powered code editor built as an Electron application with React frontend, designed as a cost-effective alternative to Cursor IDE using DeepSeek AI.

### Core Stack

- **Frontend**: React 18 + TypeScript + styled-components
- **Editor**: Monaco Editor (VS Code engine)
- **Desktop**: Electron 30
- **Build**: Vite + TypeScript
- **Testing**: Vitest
- **AI**: DeepSeek API integration

### Project Structure

- `/src/components/` - React UI components (Editor, AIChat, Sidebar, etc.)
- `/src/services/` - Core business logic and API integrations
  - `ai/` - AI integration services (AIClient, StreamingAIService, PromptBuilder)
  - `specialized-agents/` - Multi-agent system components
  - `FileSystemService.ts` - File operations (browser and Electron)
  - `GitService.ts` - Git integration
  - `SessionManager.ts` - User session and preferences
  - `AutoUpdateService.ts` - Application updates
  - `CodebaseAnalyzer.ts` - Code analysis and indexing
  - `AutonomousAgent.ts` - Autonomous coding capabilities
- `/src/hooks/` - React hooks (useWorkspace for project management)
- `/src/types/` - TypeScript interfaces and types
- `/src/__tests__/` - Test files organized by component/service
- `/electron/` - Electron main process and preload scripts
- `/dist/` - Built application files
- `/hooks/` - Development automation scripts
- `/.claude/` - Claude-specific session data and workflows
- `/.husky/` - Git hooks configuration

### Key Components

**App.tsx**: Main application orchestrator managing file operations, AI chat, and workspace state

**AICodeEditor.tsx**: Enhanced Monaco editor with AI capabilities and multi-agent support

**Editor.tsx**: Monaco editor wrapper with AI completion, find/replace, and multi-file support

**CommandPalette.tsx**: Quick command access (Ctrl+Shift+P)

**GitPanel.tsx**: Git operations interface with staging, commits, and history

**VirtualFileTree.tsx**: Performant file tree with virtual scrolling

**WelcomeScreen.tsx**: Onboarding and recent projects

**ErrorBoundary/ModernErrorBoundary.tsx**: Error handling with recovery options

### Multi-Agent System

**AgentOrchestrator.ts**: Coordinates multiple specialized agents for complex tasks

**BaseSpecializedAgent.ts**: Base class for specialized agents with standardized interfaces

**MultiAgentReview.ts**: Collaborative code review system with multiple agent perspectives

### AI Integration Architecture

- **Context-Aware AI**: Uses workspace indexing to understand project structure
- **Multi-file Context**: Provides related files context for intelligent suggestions
- **Code Completion**: Real-time AI-powered completions via Monaco provider
- **Conversation Memory**: Maintains chat history with workspace context
- **Streaming Responses**: Real-time AI response streaming for better UX

### Configuration

- TypeScript with strict mode and path mapping (`@/*` → `src/*`)
- Vite dev server on port 3001
- ESLint with TypeScript and React rules
- Electron builder for cross-platform packaging

### Environment Setup

Requires DeepSeek API key in environment:

```bash
REACT_APP_DEEPSEEK_API_KEY=your_key_here
REACT_APP_DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

### Development Workflow

1. Start with `npm run dev` for full development
2. Use `npm run hook:test-watch` for automatic testing
3. Use `npm run hook:format-watch` for code formatting
4. Use `npm run lint` before commits
5. Test with `npm test`
6. Build desktop app with `npm run build:electron`

### Important Instructions

- ALWAYS use MCP servers for file operations and testing
- Run session initialization at start of each session (when available)
- Check for missing tests before adding features (current coverage: ~28%)
- Monitor performance after UI changes
- Use automated hooks during development
- Follow existing patterns and conventions
- Utilize pre-commit hooks for code quality
- Test multi-agent features thoroughly
- Ensure TypeScript types are properly defined

## 📋 Session Checklist

When starting work:

- [ ] Run `node .claude/session-init.js` (if exists)
- [ ] Review recommendations and current project state
- [ ] Start relevant hooks (test-watch, format-watch)
- [ ] Check git status
- [ ] Pull latest changes if working with remote

During development:

- [ ] Use filesystem MCP before file changes
- [ ] Run puppeteer after UI changes
- [ ] Commit frequently with clear messages
- [ ] Keep tests updated (aim for >50% coverage)
- [ ] Monitor performance with hook:performance
- [ ] Let pre-commit hooks validate your changes

Before ending:

- [ ] Run all tests (`npm test`)
- [ ] Check linting (`npm run lint`)
- [ ] Commit all changes (pre-commit hooks will validate)
- [ ] Document any TODOs
- [ ] Update session-data if significant progress made

## 🔧 Testing Requirements

### Priority Testing Areas:

1. Multi-agent system components (AgentOrchestrator, specialized agents)
2. AI integration services (AIClient, StreamingAIService)
3. Core editor functionality (AICodeEditor, Editor)
4. File operations and Git integration
5. Error handling and recovery

### Test Coverage Goals:

- Minimum: 50% overall coverage
- Critical paths: 80% coverage
- New features: Must include tests before merge
