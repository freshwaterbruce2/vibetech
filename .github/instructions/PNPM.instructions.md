---
applyTo: '**'
packageManager: pnpm
---

## Package Manager

This project uses **pnpm** as the package manager.

### Commands
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

### Important
**Always use `pnpm` commands.** Never use `npm` or `yarn` in this project.

