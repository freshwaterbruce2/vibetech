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
