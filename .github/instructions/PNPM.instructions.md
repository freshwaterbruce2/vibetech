---
applyTo: '**'
packageManager: pnpm
---

## Package Manager

This project uses **pnpm** as the package manager.

**IMPORTANT**: Always use `pnpm` commands, never `npm` or `yarn`.

### Common Commands
- Install dependencies: `pnpm install`
- Add a package: `pnpm add <package>`
- Add dev dependency: `pnpm add -D <package>`
- Remove a package: `pnpm remove <package>`
- Run scripts: `pnpm run <script>` or `pnpm <script>`
- Update dependencies: `pnpm update`

### Workspace Commands (Monorepo)
- Install all workspace dependencies: `pnpm install`
- Run script in specific workspace: `pnpm --filter <workspace> <script>`
- Add dependency to workspace: `pnpm --filter <workspace> add <package>`
- Run command in all workspaces: `pnpm -r <command>`

### Why pnpm?
- 59.5% disk space savings via content-addressable storage with hard links
- Faster installs than npm/yarn
- Strict dependency management prevents phantom dependencies
- Better monorepo support
