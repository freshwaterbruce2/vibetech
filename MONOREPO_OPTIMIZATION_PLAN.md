# Monorepo Optimization Plan

## Current Status: 50% Monorepo Benefits Utilized

### ✅ What's Working (3/6)
1. Unified tooling (ESLint, TypeScript, pnpm)
2. Nx caching configured
3. Single source of truth

### ⚠️ Needs Improvement (2/6)
4. Shared code - packages exist but underutilized
5. Atomic commits - possible but not optimized

### ❌ Missing (1/6)
6. Cross-project refactoring - no shared utilities

---

## Phase 1: Share Common Code (2-3 hours)

### Step 1: Audit Duplicate Code
Find code duplicated across projects:
```bash
# Find common patterns
grep -r "SecureApiKeyManager" projects/*/src/
grep -r "logger" projects/*/src/
grep -r "storage" projects/*/src/
```

### Step 2: Create Shared Utilities Package
```bash
mkdir -p packages/shared-utils/src
cd packages/shared-utils
pnpm init

# Add to package.json:
{
  "name": "@vibetech/shared-utils",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  }
}
```

### Step 3: Move Common Utilities
**Target utilities to share:**
- `SecureApiKeyManager` (deepcode-editor/taskmaster both need this)
- Logger utilities
- Storage helpers
- API client base classes
- Common TypeScript types

### Step 4: Update Projects to Use Shared Package
```bash
# In deepcode-editor/package.json:
{
  "dependencies": {
    "@vibetech/shared-utils": "workspace:*"
  }
}

# Update imports:
- import { SecureApiKeyManager } from './utils/SecureApiKeyManager'
+ import { SecureApiKeyManager } from '@vibetech/shared-utils'
```

---

## Phase 2: Maximize Nx Caching (30 minutes)

### Current Issue: Not all projects have Nx targets

**Add project.json to unconfigured projects:**

```bash
# For deepcode-editor
cat > projects/active/desktop-apps/deepcode-editor/project.json << EOF
{
  "name": "deepcode-editor",
  "targets": {
    "dev": {
      "command": "vite",
      "cache": false
    },
    "build": {
      "command": "vite build",
      "outputs": ["{projectRoot}/dist"],
      "cache": true
    },
    "test": {
      "command": "vitest run",
      "cache": true
    }
  }
}
EOF
```

**Benefits:**
- 80-90% faster repeated builds
- Only rebuild changed projects
- Share build cache across team

---

## Phase 3: Atomic Commits Strategy (15 minutes)

### Current Problem
175 modified files across projects - hard to track related changes

### Solution: Feature Branch Workflow
```bash
# Example: Add AI provider to multiple projects
git checkout -b feature/shared-ai-provider

# Make changes across projects:
# 1. Add to packages/shared-utils/src/ai/
# 2. Update deepcode-editor to use it
# 3. Update taskmaster to use it
# 4. Update digital-content-builder to use it

# Single atomic commit:
git add .
git commit -m "feat: add shared AI provider to @vibetech/shared-utils

- Created BaseAIProvider class in shared-utils
- Migrated deepcode-editor to use shared provider
- Migrated taskmaster to use shared provider
- Migrated digital-content-builder to use shared provider

All projects now share AI configuration and error handling."
```

**Benefits:**
- Changes across projects stay together
- Easy to rollback entire feature
- Clear history of cross-project work

---

## Phase 4: Cross-Project Refactoring (Ongoing)

### Examples of Opportunities

**1. Duplicate API Key Management**
```
deepcode-editor/src/utils/SecureApiKeyManager.ts (518 lines)
taskmaster/src/lib/ai/provider.ts (similar logic)
```
→ Move to `@vibetech/shared-utils/security`

**2. Duplicate Logger**
```
backend/config/logger.js
digital-content-builder/server.js (console.log)
```
→ Create `@vibetech/logger` package

**3. Duplicate Type Definitions**
```
deepcode-editor/src/types/electron.d.ts
taskmaster/src/types/... (similar)
```
→ Extend from `@nova/types` or create `@vibetech/types`

**4. Duplicate UI Components**
```
Each project has own Button, Input, Card
```
→ Expand `@vibetech/ui` package (but respect luxury designs like booking-platform)

---

## Quick Wins (Start Here)

### Win 1: Use Existing @vibetech/ui Package (30 min)
```bash
# Add to projects that DON'T have custom luxury design:
cd projects/active/web-apps/digital-content-builder
pnpm add @vibetech/ui@workspace:*

# Replace local components with shared:
- import { Button } from './components/Button'
+ import { Button } from '@vibetech/ui'
```

### Win 2: Share Nova Packages with Desktop Apps (45 min)
```bash
# deepcode-editor needs database:
cd projects/active/desktop-apps/deepcode-editor
pnpm add @nova/database@workspace:*
pnpm add @nova/types@workspace:*

# Update imports:
- import { ActivityDatabase } from './services/database'
+ import { ActivityDatabase } from '@nova/database'
```

### Win 3: Create Shared Config Package (30 min)
```bash
mkdir -p packages/config/src
cd packages/config

# Create package.json:
{
  "name": "@vibetech/config",
  "main": "src/index.ts",
  "exports": {
    "./eslint": "./eslint.config.js",
    "./typescript": "./tsconfig.json"
  }
}

# Projects import:
import config from '@vibetech/config/eslint'
```

---

## Expected Impact

### Before (Current State)
- ⚠️ 50% monorepo benefits used
- 🔴 Duplicate code across projects
- 🔴 Manual coordination between projects
- 🔴 Inconsistent patterns

### After (Optimized State)
- ✅ 95%+ monorepo benefits used
- ✅ Shared code via workspace packages
- ✅ Atomic commits across projects
- ✅ Easy refactoring with global find/replace
- ✅ 80-90% faster builds via Nx caching
- ✅ Consistent patterns enforced

---

## Implementation Timeline

### Week 1: Foundation (5 hours)
- [ ] Create @vibetech/shared-utils package
- [ ] Move SecureApiKeyManager to shared-utils
- [ ] Update deepcode-editor and taskmaster to use it
- [ ] Add Nx targets to all projects

### Week 2: Expansion (4 hours)
- [ ] Create @vibetech/logger package
- [ ] Move common types to @vibetech/types
- [ ] Update all projects to use shared logger

### Week 3: Optimization (3 hours)
- [ ] Desktop apps use @nova/* packages
- [ ] Web apps use @vibetech/ui (where appropriate)
- [ ] Document shared package patterns in CLAUDE.md

### Week 4: Maintenance (Ongoing)
- [ ] Before creating new utility, check if it should be shared
- [ ] Regular refactoring sessions to identify duplicate code
- [ ] Use atomic commits for cross-project features

---

## Success Metrics

**Code Duplication:**
- Current: ~30% duplicate code across projects
- Target: <10% duplicate code

**Build Performance:**
- Current: Full rebuild = ~3-5 minutes
- Target: Affected-only builds = 30-60 seconds (80%+ improvement)

**Development Speed:**
- Current: Fix bug in one project, manually port to others
- Target: Fix once in shared package, all projects benefit

**Type Safety:**
- Current: Inconsistent types across projects
- Target: Single source of truth for shared types

---

## Notes

**Respect Project-Specific Code:**
- business-booking-platform luxury design system (keep local)
- crypto-enhanced trading algorithms (keep isolated for safety)
- vibe-tutor mobile-specific components (keep local)

**Share Aggressively:**
- Authentication utilities
- API client base classes
- Common React hooks
- TypeScript utilities
- Logging infrastructure
- Error handling patterns

**When in Doubt:**
If code appears in 3+ projects → make it shared
If code is project-specific competitive advantage → keep local
