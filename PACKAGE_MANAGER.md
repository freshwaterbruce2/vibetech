# Package Manager - pnpm

## Overview

This monorepo uses **pnpm** exclusively as its package manager. Do NOT use `npm` or `yarn`.

## Why pnpm?

- **Faster**: Up to 2x faster than npm for installations
- **Efficient**: Hard links instead of copying files, saving disk space
- **Strict**: Better dependency resolution, prevents phantom dependencies
- **Monorepo-friendly**: Native workspace support with better isolation

## Version

This project is locked to **pnpm 9.15.0** (see `packageManager` field in `package.json`).

## Installation

### Install pnpm globally
```bash
# Using npm (ironically)
npm install -g pnpm@9.15.0

# Or using the standalone installer
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Enable Corepack (Recommended)
```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

## Common Commands

### Installing Dependencies
```bash
# ✅ Install all workspace dependencies
pnpm install

# ✅ Install for specific workspace
pnpm --filter @vibetech/backend install

# ❌ DO NOT USE
npm install
yarn install
```

### Adding Dependencies
```bash
# ✅ Add to root workspace
pnpm add <package>

# ✅ Add to specific workspace
pnpm --filter <workspace-name> add <package>

# ✅ Add dev dependency
pnpm add -D <package>

# ❌ DO NOT USE
npm install <package>
yarn add <package>
```

### Removing Dependencies
```bash
# ✅ Remove from workspace
pnpm remove <package>

# ✅ Remove from specific workspace
pnpm --filter <workspace-name> remove <package>

# ❌ DO NOT USE
npm uninstall <package>
yarn remove <package>
```

### Running Scripts
```bash
# ✅ Run script from root
pnpm <script-name>
pnpm run <script-name>

# ✅ Run script in specific workspace
pnpm --filter <workspace-name> <script-name>

# ✅ Run script in all workspaces
pnpm -r <script-name>

# ❌ DO NOT USE
npm run <script-name>
yarn <script-name>
```

### Updating Dependencies
```bash
# ✅ Update all dependencies
pnpm update

# ✅ Update specific package
pnpm update <package>

# ✅ Update to latest (interactive)
pnpm update --interactive --latest

# ❌ DO NOT USE
npm update
yarn upgrade
```

## Workspace Commands

### Working with Workspaces
```bash
# List all workspaces
pnpm ls -r --depth -1

# Run command in specific workspace
pnpm --filter <workspace-name> <command>

# Run command in all workspaces
pnpm -r <command>

# Run command in multiple workspaces
pnpm --filter <workspace-1> --filter <workspace-2> <command>
```

### Common Workspace Patterns
```bash
# Install dependencies for all workspaces
pnpm install

# Build all projects
pnpm run build:all

# Run tests in all projects
pnpm run test:all

# Clean all node_modules
pnpm run workspace:clean

# Reinstall everything
pnpm run workspace:clean && pnpm install
```

## Configuration

### .npmrc
The project includes a `.npmrc` file with pnpm-specific configuration:
- `node-linker=hoisted` - Better compatibility with Nx
- `shamefully-hoist=true` - Ensures dependencies are accessible
- `auto-install-peers=true` - Auto-install peer dependencies
- `strict-peer-dependencies=false` - More flexible peer deps

### pnpm-workspace.yaml
Defines all packages in the monorepo:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'projects/active/desktop-apps/*'
  - 'projects/active/web-apps/*'
  # ... etc
```

## Troubleshooting

### "Cannot find module" errors
```bash
# Clear pnpm cache and reinstall
pnpm store prune
rm -rf node_modules
pnpm install
```

### Peer dependency warnings
These are usually safe to ignore, but if needed:
```bash
# Auto-install peer dependencies (already enabled in .npmrc)
pnpm install --fix-peer-dependencies
```

### Lock file issues
```bash
# Update lock file
pnpm install --no-frozen-lockfile

# Or regenerate from scratch
rm pnpm-lock.yaml
pnpm install
```

### Workspace not found
```bash
# Check workspace name in package.json
cat <workspace-path>/package.json | grep '"name"'

# Use the exact name with --filter
pnpm --filter @vibetech/workspace-name <command>
```

## Migration from npm/yarn

If you previously used npm or yarn:

1. **Remove old artifacts**
   ```bash
   rm -rf node_modules package-lock.json yarn.lock
   ```

2. **Install pnpm**
   ```bash
   npm install -g pnpm@9.15.0
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Update habits**
   - Replace `npm` with `pnpm` in all commands
   - Replace `yarn` with `pnpm` in all commands
   - Update CI/CD scripts to use pnpm

## CI/CD Integration

### GitHub Actions
```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 9.15.0

- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

### Docker
```dockerfile
FROM node:20
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
COPY pnpm-lock.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --offline
```

## Best Practices

1. **Always use pnpm** - Never mix package managers
2. **Commit lock file** - Always commit `pnpm-lock.yaml`
3. **Use --frozen-lockfile in CI** - Ensures reproducible builds
4. **Use workspaces** - Leverage `--filter` for workspace-specific commands
5. **Keep pnpm updated** - But use the version specified in `packageManager` field

## Resources

- [pnpm Documentation](https://pnpm.io/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [pnpm CLI](https://pnpm.io/cli/add)
- [pnpm vs npm vs yarn](https://pnpm.io/benchmarks)

## Quick Reference

| Task | pnpm Command |
|------|-------------|
| Install deps | `pnpm install` |
| Add package | `pnpm add <pkg>` |
| Remove package | `pnpm remove <pkg>` |
| Run script | `pnpm <script>` |
| Update deps | `pnpm update` |
| Clean install | `rm -rf node_modules && pnpm install` |
| Workspace command | `pnpm --filter <workspace> <cmd>` |
| All workspaces | `pnpm -r <cmd>` |

---

**Remember**: When you see `npm` in any documentation, scripts, or commands, replace it with `pnpm`.
