# Monorepo Atomic Commits Guide

## Overview

Atomic commits enable cross-project features to be developed, tested, and deployed as a single cohesive unit. This guide documents the workflow for maximizing this monorepo benefit.

## Atomic Commit Workflow

### 1. Feature Branch Strategy

**Pattern:** `feature/[project-scope]/[feature-name]`

```bash
# Single project feature
git checkout -b feature/deepcode-editor/ai-improvements

# Cross-project feature (atomic commit opportunity!)
git checkout -b feature/monorepo/shared-logger

# Bug fix across multiple projects
git checkout -b fix/all-projects/security-update
```

### 2. Development Workflow

**Step 1: Plan Cross-Project Impact**
```bash
# Before starting, identify all affected projects
- Which projects will use this feature?
- Which shared packages need updates?
- What's the dependency order?
```

**Step 2: Develop in Dependency Order**
1. Update shared packages first (@vibetech/*)
2. Update consuming projects second
3. Update documentation third

**Step 3: Test Atomically**
```bash
# Test all affected projects together
pnpm nx affected --target=test --base=main
pnpm nx affected --target=build --base=main
```

### 3. Commit Message Format

Use **Conventional Commits** with scope indicating atomic changes:

```bash
# Single project
feat(deepcode-editor): add new AI provider

# Atomic commit (multiple projects)
feat(monorepo): create @vibetech/logger package

BREAKING CHANGE: Replaces console.log with structured logging

Affected projects:
- packages/vibetech-logger (new)
- deepcode-editor (updated)
- backend (updated)
- crypto-enhanced (updated)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 4. Atomic Commit Checklist

Before committing cross-project changes:

- [ ] All shared packages built successfully
- [ ] All consuming projects typecheck passing
- [ ] Nx affected tests pass
- [ ] Breaking changes documented
- [ ] Migration guide included (if needed)
- [ ] CLAUDE.md updated with new patterns

### 5. Pull Request Strategy

**Single PR for Atomic Changes:**
```markdown
# Title: feat(monorepo): shared logging infrastructure

## Summary
Creates @vibetech/logger and integrates across 4 projects.

## Changes
- ✅ New package: @vibetech/logger
- ✅ Updated: deepcode-editor
- ✅ Updated: backend
- ✅ Updated: crypto-enhanced
- ✅ Updated: digital-content-builder

## Test Plan
- [ ] All unit tests pass (pnpm test)
- [ ] Nx affected tests pass
- [ ] Manual testing in each project
- [ ] No breaking changes in existing APIs

## Migration
No migration needed - new functionality only.
```

### 6. Merge Strategy

**Option A: Direct to main (recommended for shared packages)**
```bash
git checkout main
git merge --no-ff feature/monorepo/shared-logger
git push origin main
```

**Option B: Merge every 10 commits (productivity optimization)**
```bash
# After ~10 commits on feature branch
git checkout main
git pull origin main
git merge --no-ff feature/monorepo/shared-logger
git push origin main

# Continue work on same branch
git checkout feature/monorepo/shared-logger
git rebase main
# Keep working...
```

## Real-World Examples

### Example 1: @vibetech/types Package (Quick Win #3)

**Atomic Commit Pattern:**
```bash
feat(monorepo): Quick Win #3 - @vibetech/types

Created @vibetech/types with 187 lines of reusable types.
75% monorepo utilization achieved.

Changes:
- packages/vibetech-types/ (new package)
- deepcode-editor (11 files updated, 187 lines removed)
- TypeScript compilation verified

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Why This Works:**
- Single commit contains package creation + integration
- All changes tested together before commit
- No broken state in git history
- Easy to revert if issues found

### Example 2: @vibetech/hooks Package (Quick Win #4)

**Atomic Commit Pattern:**
```bash
feat(monorepo): Quick Win #4 - @vibetech/hooks

Created @vibetech/hooks with useTheme.
Integrated into business-booking-platform.
85% monorepo utilization achieved.

Changes:
- packages/vibetech-hooks/ (new package)
- business-booking-platform (useTheme re-exported)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Benefits Demonstrated:**
- Theme hook shared across web applications
- Single source of truth for theme management
- Type-safe across package boundaries
- Atomic deployment - no intermediate broken state

## Advanced Patterns

### Pattern 1: Breaking Changes Across Projects

```bash
# Step 1: Create migration guide
docs/migrations/v2-logger-migration.md

# Step 2: Commit in phases
git commit -m "feat(vibetech-logger)!: v2.0.0 with breaking changes

BREAKING CHANGE: Logger.log() renamed to Logger.info()

Migration guide: docs/migrations/v2-logger-migration.md"

# Step 3: Commit migrations
git commit -m "refactor: migrate 4 projects to @vibetech/logger v2

- deepcode-editor: Logger.log → Logger.info
- backend: Logger.log → Logger.info
- crypto-enhanced: Logger.log → Logger.info
- digital-content-builder: Logger.log → Logger.info"
```

### Pattern 2: Feature Flags for Gradual Rollout

```typescript
// shared-config/feature-flags.ts
export const FEATURES = {
  USE_SHARED_LOGGER: process.env.USE_SHARED_LOGGER === 'true',
};

// Commit 1: Add feature flag + new package
// Commit 2: Integrate with flag disabled (safe)
// Commit 3: Enable flag project-by-project
// Commit 4: Remove flag + old code (cleanup)
```

### Pattern 3: Nx Affected for Safety

```bash
# Before committing, verify only expected projects affected
git status
pnpm nx affected:graph

# Ensure tests pass for all affected projects
pnpm nx affected --target=test

# Build verification
pnpm nx affected --target=build
```

## Workflow Automation

### Git Hooks Integration

**Pre-commit Hook:**
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run Nx affected checks before allowing commit
pnpm nx affected --target=lint --uncommitted
pnpm nx affected --target=typecheck --uncommitted
```

**Pre-push Hook:**
```bash
# .husky/pre-push
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests before pushing atomic commits
pnpm nx affected --target=test --base=origin/main
```

### CI/CD Integration

```yaml
# .github/workflows/ci.yml
name: Monorepo CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  affected:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Detect affected projects
        run: |
          pnpm nx affected --target=lint
          pnpm nx affected --target=test
          pnpm nx affected --target=build

      - name: Report affected projects
        run: pnpm nx affected:graph
```

## Best Practices

### ✅ DO:
- Commit shared package + integrations together
- Use Nx affected to verify changes
- Write descriptive commit messages
- Include "Affected projects" list in commit body
- Test atomically before committing
- Use feature flags for risky changes

### ❌ DON'T:
- Commit shared package separately from integrations
- Push broken intermediate states
- Ignore TypeScript errors in affected projects
- Skip testing affected projects
- Commit without running Nx affected checks
- Make breaking changes without migration guides

## Success Metrics

**Atomic Commits Working Well When:**
- ✅ No broken builds in main branch
- ✅ Cross-project features deploy together
- ✅ Easy to revert changes atomically
- ✅ Clear git history showing feature scope
- ✅ Nx affected catches issues before merge
- ✅ CI/CD runs only affected project tests

## Troubleshooting

### Issue: "Nx affected not detecting changes"

**Solution:**
```bash
# Ensure proper base branch
pnpm nx affected --target=test --base=origin/main --head=HEAD

# Verify project graph
pnpm nx graph
```

### Issue: "TypeScript errors in unrelated project"

**Solution:**
```bash
# Rebuild all projects after shared package change
pnpm nx run-many --target=build --all

# Clear Nx cache if needed
pnpm nx reset
```

### Issue: "Merge conflicts on atomic commit"

**Solution:**
```bash
# Rebase feature branch on main
git checkout feature/monorepo/shared-logger
git fetch origin
git rebase origin/main

# Resolve conflicts
# Re-run tests
pnpm nx affected --target=test
```

## Related Documentation

- [Monorepo Quick Wins Summary](./MONOREPO_QUICK_WINS_SUMMARY.md)
- [Monorepo Component Strategy](./MONOREPO_COMPONENT_STRATEGY.md)
- [Cross-Project Refactoring Guide](./MONOREPO_REFACTORING_GUIDE.md)

---

**Last Updated:** 2025-10-26
**Status:** Active - 100% Monorepo Utilization 🎯
