# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by pnpm workspaces (`pnpm-workspace.yaml`) and Turborepo (`turbo.json`).
- Applications live under `apps/` (e.g., `apps/nova-agent`, `apps/vibe-code-studio`, `apps/desktop-commander-v3`).
- Backend services live under `backend/` (IPC/LSP proxies, workflow engine, search service).
- Shared libraries and configs sit in `packages/` (e.g., `shared-utils`, `shared-config`, `ui`, `nova-*`, `vibetech-*`).
- Scripts and tooling root-level (`scripts/`, `*.ps1`), docs under `docs/`, global configs at repo root.

## Build, Test, and Development Commands
- `pnpm install` — install workspace dependencies; required before any other command.
- `pnpm dev:nova` / `pnpm dev:vibe` — run Nova Agent or Vibe Code Studio in watch/dev mode.
- `pnpm build` — Turborepo orchestrated build across packages; use `pnpm build:all` to rebuild from scratch.
- `pnpm test` — run vitest suites via Turborepo; `pnpm test:all` forces rebuild first.
- `pnpm lint` / `pnpm lint:fix` — lint (and optionally auto-fix) with ESLint. `pnpm format` / `pnpm format:check` run Prettier.
- `pnpm typecheck` — TypeScript project references/strictness pass.
- For package-specific work, scope with `pnpm --filter <package> <command>` (e.g., `pnpm --filter shared-utils test`).

## Coding Style & Naming Conventions
- TypeScript-first; JS allowed for tooling. Prefer functional components/hooks for React code.
- Formatting: Prettier defaults (2-space indent, single quotes per config, trailing commas). Run `pnpm format` before PRs.
- Linting: ESLint flat config with strict security rules (no `eval`, no `localStorage` in Electron contexts), prefer `const`, avoid unused vars (`_` prefix allowed for intentional ignores).
- Naming: kebab-case for folders, PascalCase for components/classes, camelCase for functions/vars; suffix React files with `.tsx`.

## Testing Guidelines
- Framework: Vitest with coverage emitted to `coverage/` (cached by Turborepo).
- Place unit tests alongside sources or under `__tests__/` with `.test.ts[x]` suffix.
- Keep tests deterministic; mock network/process boundaries. For new features, add at least one happy-path and one failure/edge test.
- Run `pnpm test` before commits; ensure coverage not reduced for touched areas.

## Commit & Pull Request Guidelines
- Follow Conventional Commits seen in history: `feat(scope): ...`, `fix(scope): ...`, `chore: ...`, `build: ...`.
- Keep commits scoped and reversible; avoid bundling unrelated refactors with feature work.
- PRs should include: clear summary, linked issue/story ID, testing notes (`pnpm test`, `pnpm lint`), and screenshots for UI changes.
- Update relevant docs/configs when behavior or contracts change; include `changeset` when publishing packages.

## Security & Configuration Tips
- Copy `.env.example` to `.env`; never commit secrets. Use process envs for tokens/keys.
- Avoid direct filesystem/network access in shared packages unless guarded and abstracted.
- Electron/desktop surfaces must avoid `localStorage`; prefer secure storage mechanisms already used in backend/services.

## IPC Bridge Integration (Nova Agent ↔ Vibe Code Studio)
- **WebSocket Bridge:** ws://127.0.0.1:5004 (embedded in Vibe's Electron main process)
- **Shared Database:** D:\databases\agent_learning.db (SQLite with WAL mode for concurrent access)
- **Message Types:** `file:open`, `learning:sync`, `context:update`, `activity:sync`
- **Architecture:** Nova (Rust WebSocket client) → Vibe (Electron WebSocket server) → Renderer (IPC bridge)
- **Learning Sync:** Bidirectional sync of agent_mistakes and agent_knowledge tables
- **Auto-reconnect:** Nova reconnects with exponential backoff (max 10 attempts)
- **See app-specific AGENTS.md files:**
  - `apps/nova-agent/AGENTS.md` - Nova IPC client details
  - `apps/vibe-code-studio/AGENTS.md` - Vibe IPC bridge & frontend integration


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->