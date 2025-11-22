# Feature Modules - Development Guidelines

**Vibe Code Studio** follows a strict Modular Architecture. This directory (`src/modules`) is the home for all major application features.

## Rules for New Features
1.  **Self-Contained**: A module must own its Components, Services, Hooks, and Types.
2.  **Public API**: The `index.ts` is the ONLY entry point. Do not import internal files of a module from outside.
3.  **Registration**: Modules must register themselves with the `ModuleRegistry` (if applicable) to expose capabilities to the host app.

## Existing Modules
- **`editor`**: Core Monaco/CodeMirror logic.
- **`ai-assistant`**: Chat, Completions, and Agent interactions.
- **`version-control`**: Git integration.
- **`workspace`**: File tree and project management.

## Migration Note
We are actively migrating monolithic code from `src/components` and `src/services` into these modules.