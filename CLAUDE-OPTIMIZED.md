---
project_name: "Vibe Tech Monorepo"
version: "2.0.0"
status: "Development"
tech_stack:
  - "React 19"
  - "TypeScript"
  - "Vite 7"
  - "shadcn/ui"
  - "Nx Monorepo"
  - "pnpm"
primary_agent: "claude-code"
port: "5173"
database: "SQLite (D:\databases\database.db)"
---

# Vibe Tech Monorepo - Claude Development Guide

**PRIMARY DIRECTIVE:** Focus on production-ready code using React 19 patterns, TypeScript strict mode, and pnpm workspace management. Always run quality checks before commits.

## 1. Getting Started

**Prerequisites:**

- Node.js 22+ with pnpm 9.15.0
- Python 3.11+ (for crypto trading)
- Git with pre-commit hooks enabled

**Installation:**

```bash
pnpm install              # Install all workspace dependencies
pnpm run setup:hooks      # Configure git hooks
```

**Running the App:**

```bash
pnpm run dev:root         # Start main app (port 5173)
pnpm run dev:all          # Start multiple projects in parallel
```

## 2. Key Commands

**Workspace Level (from root):**

- `dev:root`: Start main development server (port 5173)
- `dev:all`: Start multiple projects in parallel
- `quality`: Full pipeline - lint + typecheck + test + build
- `quality:fix`: Auto-fix linting issues
- `test`: Playwright E2E tests
- `nx graph`: Visualize project dependencies

**Project Level (cd into project directory):**

- `dev`: Start individual project dev server
- `build`: Build individual project
- `test`: Run project-specific tests

## 3. Architecture Overview

- **Frontend:** React 19 + Vite 7 + shadcn/ui components
- **Backend:** Node.js/Express (projects/*/backend/) + SQLite
- **Database:** Unified SQLite (D:\databases\database.db)
- **Monorepo:** Nx-powered with intelligent caching

## 4. File Structure (Key Paths Only)

- `src/`: Main React application source
- `projects/active/`: Active development projects
- `projects/crypto-enhanced/`: Python trading system
- `.claude/`: Claude Code configuration and hooks
- `nx.json`: Nx workspace configuration

## 5. Critical Rules & Patterns

- **Quality Gates:** Always run `pnpm run quality` before commits
- **shadcn/ui Only:** Use shadcn/ui components exclusively for UI primitives
- **TypeScript Strict:** No `any` types - use proper typing
- **Nx Caching:** Leverage `nx` commands for better performance
- **pnpm Workspaces:** Use `pnpm add <pkg> --filter <project>` for project-specific deps

## 6. Token Optimization Instructions for Claude

- **Be Concise:** Provide brief and direct responses.
- **Use `read_file` for context:** Before making changes, use `read_file` to understand the existing code.
- **Use `search_file_content` for discovery:** Use `search_file_content` to find relevant code snippets.
- **Limit `read_file` output:** Use the `limit` parameter with `read_file` to avoid reading large files.
- **Ask for clarification:** If the request is ambiguous, ask for clarification instead of making assumptions.
