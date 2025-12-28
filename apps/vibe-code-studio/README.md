# Vibe Code Studio

> **Note**: This is a workspace reference directory. The actual Vibe Code Studio application is located at `projects/active/desktop-apps/deepcode-editor`.

## Quick Start

```bash
# Navigate to the actual project directory
cd projects/active/desktop-apps/deepcode-editor

# Install dependencies (uses pnpm)
pnpm install

# Start development server
pnpm dev

# Or run web-only mode
pnpm dev:web
```

## Package Manager

This project uses **pnpm** exclusively. Do NOT use `npm` or `yarn`.

```bash
# ✅ Correct
pnpm install
pnpm add <package>
pnpm run dev

# ❌ Wrong
npm install
yarn add <package>
```

## Documentation

- See `projects/active/desktop-apps/deepcode-editor/README.md` for full documentation
- See `.github/copilot-instructions.md` for AI agent guidelines
- See `projects/active/desktop-apps/deepcode-editor/CLAUDE.md` for detailed development guide

## Architecture

Vibe Code Studio is a hybrid desktop application built with:
- **Frontend**: React 19 + TypeScript + styled-components
- **Editor**: Monaco Editor (VS Code engine)
- **AI**: DeepSeek API integration with multi-agent system
- **Desktop**: Tauri (primary) with Electron fallback
- **Build**: Vite with production optimizations

## Agent Modes

The application features three specialized agent modes:
1. **Chat Mode**: Conversational AI assistance
2. **Agent Mode**: Autonomous multi-step task execution (Ctrl+Shift+A)
3. **Composer Mode**: Multi-file editing workflows

## Development

All development should be done in the main project directory:
```bash
cd ../../projects/active/desktop-apps/deepcode-editor
```

This `apps/vibe-code-studio` directory exists for:
- Copilot/AI agent instruction files
- Workspace organization
- Documentation references
