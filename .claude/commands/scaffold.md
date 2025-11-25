---
allowed-tools: Bash(pnpm:*), Bash(git:*), Write, Read, Edit, Glob, mcp__nx-mcp__nx_workspace, mcp__filesystem__*
description: Scaffold a new package in the monorepo following existing conventions
argument-hint: <package-name> <type:lib|app|service>
model: sonnet
---

# Scaffold New Package

I will scaffold a new package in the monorepo, following existing conventions. Provide a package name and type.

## Required Arguments

Package Name: ${ARGUMENTS[0]}
Package Type: ${ARGUMENTS[1]} (lib, app, or service)

If arguments missing, respond:
```
ERROR: Missing required arguments

Usage: /scaffold <package-name> <type>

Types:
  lib     - Shared library package (packages/)
  app     - Application (projects/active/web-apps/ or desktop-apps/)
  service - Backend service (backend/ or similar)

Examples:
  /scaffold my-utils lib
  /scaffold my-dashboard app
  /scaffold payment-api service
```

## Step 1: Validate Package Name

Check if package already exists:
```bash
pnpm nx show project ${ARGUMENTS[0]}
```

If exists, abort with error:
```
ERROR: Package '${ARGUMENTS[0]}' already exists in the workspace.

Use a different name or delete the existing project first.
```

## Step 2: Analyze Existing Templates

Use Glob tool to find similar packages:
- For lib: Find existing packages in `packages/`
- For app: Find existing apps in `projects/active/web-apps/` or `projects/active/desktop-apps/`
- For service: Find existing services in `backend/`

Read 2-3 example `package.json`, `tsconfig.json`, and `project.json` files to understand conventions.

Present:
```
════════════════════════════════════════
  TEMPLATE ANALYSIS
════════════════════════════════════════
Package Type: ${ARGUMENTS[1]}
Target Location: [determined path]

Based on existing packages:
- [example-package-1]: [what we'll copy]
- [example-package-2]: [what we'll copy]

Conventions detected:
- Package manager: pnpm
- TypeScript version: [version]
- Build tool: [vite/tsc/etc]
- Test framework: [vitest/jest/etc]
════════════════════════════════════════
```

## Step 3: Determine Target Directory

Based on package type:
- lib → `packages/${ARGUMENTS[0]}/`
- app (web) → `projects/active/web-apps/${ARGUMENTS[0]}/`
- app (desktop) → `projects/active/desktop-apps/${ARGUMENTS[0]}/`
- service → `backend/${ARGUMENTS[0]}/` or `projects/${ARGUMENTS[0]}/`

Confirm directory doesn't exist:
```bash
ls [target-directory] 2>/dev/null || echo "Directory doesn't exist - OK to create"
```

## Step 4: Create Directory Structure

Create the package directory:
```bash
mkdir -p [target-directory]/src
```

Present:
```
✓ Created directory: [target-directory]
✓ Created src/ subdirectory
```

## Step 5: Generate package.json

Using Write tool, create `package.json` following monorepo conventions:

```json
{
  "name": "@[scope]/${ARGUMENTS[0]}",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "workspace:*",
    "vitest": "workspace:*"
  }
}
```

Adjust based on type:
- For lib: Use @nova scope if Nova package, @vibetech if internal
- For app: Add vite, react dependencies
- For service: Add express, node types

Present:
```
✓ Generated package.json with appropriate dependencies
```

## Step 6: Generate tsconfig.json

Create TypeScript configuration:

```json
{
  "extends": "../../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Adjust `extends` path based on nesting level.

Present:
```
✓ Generated tsconfig.json extending workspace config
```

## Step 7: Generate project.json (Nx Configuration)

Create Nx project configuration:

```json
{
  "name": "${ARGUMENTS[0]}",
  "sourceRoot": "[path]/src",
  "projectType": "[library|application]",
  "tags": ["scope:[scope]", "type:[type]"],
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{projectRoot}/dist"],
      "options": {
        "main": "{projectRoot}/src/index.ts",
        "outputPath": "{projectRoot}/dist",
        "tsConfig": "{projectRoot}/tsconfig.json"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint"
    },
    "test": {
      "executor": "@nx/vite:test"
    }
  }
}
```

Adjust based on package type and existing patterns.

Present:
```
✓ Generated project.json with Nx targets
```

## Step 8: Generate README.md

Create documentation:

```markdown
# ${ARGUMENTS[0]}

[Brief description of what this package does]

## Installation

\`\`\`bash
pnpm add @[scope]/${ARGUMENTS[0]}
\`\`\`

## Usage

\`\`\`typescript
import { } from '@[scope]/${ARGUMENTS[0]}';
\`\`\`

## Development

\`\`\`bash
# Build
pnpm nx build ${ARGUMENTS[0]}

# Test
pnpm nx test ${ARGUMENTS[0]}

# Lint
pnpm nx lint ${ARGUMENTS[0]}
\`\`\`

## License

[License type]
```

Present:
```
✓ Generated README.md with usage instructions
```

## Step 9: Generate Stub src/index.ts

Create initial source file:

For lib:
```typescript
/**
 * ${ARGUMENTS[0]} package
 *
 * [Description]
 */

export function example() {
  return 'Hello from ${ARGUMENTS[0]}';
}
```

For app/service:
```typescript
/**
 * ${ARGUMENTS[0]} entry point
 */

console.log('${ARGUMENTS[0]} starting...');

export {};
```

Present:
```
✓ Generated src/index.ts stub
```

## Step 10: Update Workspace Configuration

Add package to workspace if needed:

Check `pnpm-workspace.yaml`:
```bash
cat pnpm-workspace.yaml
```

If package path not already included, add it.

Present:
```
✓ Verified workspace configuration includes new package
```

## Step 11: Install Dependencies

Execute:
```bash
pnpm install
```

Present:
```
✓ Installed dependencies
```

## Step 12: Verify Nx Integration

Execute:
```bash
pnpm nx show project ${ARGUMENTS[0]}
```

Present:
```
════════════════════════════════════════
  NX INTEGRATION VERIFICATION
════════════════════════════════════════
✓ Project registered in Nx workspace
✓ Available targets: [list targets]
✓ Dependencies: [list]
✓ Tags: [list]
════════════════════════════════════════
```

## Step 13: Run Initial Build

Execute:
```bash
pnpm nx build ${ARGUMENTS[0]}
```

Present:
```
✓ Initial build successful
✓ Output: [dist path]
```

## Step 14: Commit to Current Branch

Execute:
```bash
git add [target-directory]
git add pnpm-workspace.yaml
git commit -m "$(cat <<'EOF'
feat: scaffold new ${ARGUMENTS[1]} package ${ARGUMENTS[0]}

- Added package structure
- Configured TypeScript and Nx
- Generated boilerplate files
- Integrated with workspace

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

Present:
```
✓ Changes committed to current branch
```

## Step 15: Final Summary

Present complete summary:
```
════════════════════════════════════════
  SCAFFOLDING COMPLETE
════════════════════════════════════════
Package: ${ARGUMENTS[0]}
Type: ${ARGUMENTS[1]}
Location: [full path]

Files Created:
✓ package.json
✓ tsconfig.json
✓ project.json
✓ README.md
✓ src/index.ts

Nx Integration:
✓ Registered in workspace
✓ Build target configured
✓ Test target configured
✓ Lint target configured

Next Steps:
1. Implement your package logic in src/
2. Add tests in src/*.test.ts
3. Update README.md with usage details
4. Run: pnpm nx build ${ARGUMENTS[0]}

Related Commands:
  pnpm nx build ${ARGUMENTS[0]}      # Build package
  pnpm nx test ${ARGUMENTS[0]}       # Run tests
  pnpm nx lint ${ARGUMENTS[0]}       # Lint code
  /nx:graph                           # View in dependency graph
════════════════════════════════════════
```

## Error Handling

If any step fails:
1. Explain the error
2. Roll back changes (delete created directories)
3. Provide guidance for manual intervention
4. Do not commit partial changes

## Notes

- Follows monorepo conventions automatically
- Integrates with Nx caching system
- Uses workspace-shared dependencies
- Follows naming conventions (@nova/* or @vibetech/*)
- Ready for immediate development
