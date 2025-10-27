# Cross-Project Refactoring Guide

## Overview

With 4 shared packages established, the monorepo now enables powerful cross-project refactoring capabilities. This guide documents patterns for safely refactoring code across multiple projects.

## Shared Packages Available

### 1. @vibetech/shared-utils
**Purpose:** Security and encryption utilities

**Exports:**
- `SecureApiKeyManager` - Encrypted API key storage with optional logging

**Projects Using:** deepcode-editor

**When to Use:** Any project needing secure API key management

### 2. @vibetech/ui
**Purpose:** Shared React UI components (shadcn/ui based)

**Exports:**
- `Button` - Primary UI button with variants
- `Card` - Container component with shadows
- `Badge` - Status and label badges
- `Input` - Form input with label/error support

**Projects Using:** business-booking-platform, shipping-pwa, deepcode-editor

**When to Use:** Standard UI components without heavy brand customization

### 3. @vibetech/types
**Purpose:** Shared TypeScript type definitions

**Exports:**
- `tasks.ts` - Background task queue types (106 lines)
- `errorfix.ts` - Error detection and fixing types (39 lines)
- `multifile.ts` - Multi-file editing types (42 lines)

**Projects Using:** deepcode-editor

**When to Use:** Any project with task queues, error handling, or file editing

### 4. @vibetech/hooks
**Purpose:** Shared React hooks

**Exports:**
- `useTheme` - Theme management with system preference detection

**Projects Using:** business-booking-platform

**When to Use:** Any React project needing theme switching

## Refactoring Decision Tree

### Step 1: Identify Duplicate Code

```bash
# Find duplicate functions
pnpm nx run-many --target=lint --all | grep "duplicate"

# Search for common patterns
grep -r "export const useDebounce" projects/
grep -r "export function logger" projects/
grep -r "class ApiClient" projects/
```

### Step 2: Assess Extraction Viability

**Extract to Shared Package When:**
- ✅ Code appears in 3+ projects
- ✅ Logic is generic (not business-specific)
- ✅ No tight coupling to project internals
- ✅ Stable API (not experimental)
- ✅ Reusable across project types (web/desktop/mobile)

**Keep Local When:**
- ❌ Code appears in only 1-2 projects
- ❌ Tightly coupled to business logic
- ❌ Heavy project-specific customization
- ❌ Experimental or frequently changing
- ❌ Project-specific performance optimizations

### Step 3: Choose Package Destination

| Pattern | Package | Example |
|---------|---------|---------|
| Security/Encryption | @vibetech/shared-utils | API key management, crypto |
| React UI Components | @vibetech/ui | buttons, cards, forms |
| TypeScript Types | @vibetech/types | interfaces, enums, type aliases |
| React Hooks | @vibetech/hooks | useDebounce, useFetch, useLocalStorage |
| Business Logic | @vibetech/core (future) | domain models, validators |
| API Clients | @vibetech/api (future) | REST/GraphQL clients |
| Configuration | @vibetech/config (future) | shared configs, constants |

## Refactoring Workflows

### Workflow 1: Extract Utility Function

**Example:** Extracting `formatCurrency` used in 3 projects

**Step 1: Create in Shared Package**
```typescript
// packages/shared-utils/src/formatters.ts
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}
```

**Step 2: Add to Package Exports**
```typescript
// packages/shared-utils/src/index.ts
export * from './formatters.js';
```

**Step 3: Build Package**
```bash
cd packages/shared-utils
pnpm run build
```

**Step 4: Update Projects**
```typescript
// Before
const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

// After
import { formatCurrency } from '@vibetech/shared-utils';
```

**Step 5: Test Atomically**
```bash
pnpm nx affected --target=test --base=main
```

### Workflow 2: Extract React Hook

**Example:** Extracting `useDebounce` from shipping-pwa

**Step 1: Copy Hook to @vibetech/hooks**
```typescript
// packages/vibetech-hooks/src/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

**Step 2: Add Export**
```typescript
// packages/vibetech-hooks/src/index.ts
export * from './useDebounce.js';
```

**Step 3: Build & Integrate**
```bash
cd packages/vibetech-hooks && pnpm run build
cd ../../projects/active/web-apps/shipping-pwa
pnpm install
```

**Step 4: Replace Local Implementation**
```typescript
// shipping-pwa/src/hooks/useDebounce.ts
export { useDebounce } from '@vibetech/hooks/useDebounce';
```

### Workflow 3: Extract TypeScript Types

**Example:** Extracting common API types

**Step 1: Create Types Module**
```typescript
// packages/vibetech-types/src/api.ts
export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  totalPages: number;
  totalItems: number;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
```

**Step 2: Update Consumers**
```typescript
// Before (deepcode-editor)
interface ApiResponse {
  data: any;
  error?: string;
}

// After
import { ApiResponse } from '@vibetech/types/api';
```

### Workflow 4: Extract React Component

**Example:** Moving ErrorBoundary to @vibetech/ui

**Step 1: Analyze Component Dependencies**
```bash
# Check what the component imports
grep -n "import" projects/*/src/components/ErrorBoundary.tsx
```

**Step 2: Extract with Dependencies**
```typescript
// packages/ui/src/components/ErrorBoundary.tsx
import * as React from 'react';
import { Button } from './Button';
import { Card } from './Card';

export class ErrorBoundary extends React.Component {
  // ... implementation
}
```

**Step 3: Update All Projects**
```bash
# Find all ErrorBoundary imports
grep -r "from.*ErrorBoundary" projects/

# Replace with shared version
# Use PowerShell script for batch replacement
```

## Refactoring Safety Checklist

Before extracting code to shared package:

- [ ] Code is used in 3+ projects (or will be soon)
- [ ] No circular dependencies introduced
- [ ] TypeScript compilation passes in all projects
- [ ] All affected tests pass
- [ ] Breaking change migration guide created (if needed)
- [ ] Package version bumped appropriately
- [ ] Documentation updated (README, CLAUDE.md)

## Common Refactoring Patterns

### Pattern 1: Gradual Migration

```typescript
// Step 1: Create shared package
// Step 2: Re-export from local files
export { useDebounce } from '@vibetech/hooks/useDebounce';

// Step 3: Update imports gradually
// Old imports still work, but new code uses shared package

// Step 4: Remove local files after verification
```

### Pattern 2: Feature Flag Approach

```typescript
// shared-config/features.ts
export const USE_SHARED_LOGGER = process.env.USE_SHARED_LOGGER === 'true';

// Gradual rollout per project
if (USE_SHARED_LOGGER) {
  const logger = new SharedLogger();
} else {
  const logger = new LocalLogger(); // fallback
}
```

### Pattern 3: Deprecation Path

```typescript
// Local file that will be deprecated
/**
 * @deprecated Use @vibetech/hooks/useDebounce instead
 * This will be removed in v2.0.0
 */
export { useDebounce } from '@vibetech/hooks/useDebounce';
```

## Advanced Refactoring Scenarios

### Scenario 1: Breaking Change Migration

**Problem:** Shared package API needs to change

**Solution:**
```typescript
// v1 (old API)
export function formatDate(date: Date): string;

// v2 (new API)
export function formatDate(date: Date, options?: FormatOptions): string;

// Migration:
// 1. Add new optional parameter (non-breaking)
// 2. Deprecate old usage in documentation
// 3. Update all projects to use new API
// 4. Remove deprecated behavior in v3
```

### Scenario 2: Monorepo-Wide Rename

**Problem:** Function name is misleading, needs rename

**Solution:**
```bash
# Step 1: Grep for all usages
grep -r "oldFunctionName" projects/

# Step 2: Create PowerShell replacement script
.\tools\rename-function.ps1 -Old "oldFunctionName" -New "newFunctionName"

# Step 3: Run Nx affected tests
pnpm nx affected --target=test --all

# Step 4: Atomic commit with all changes
git commit -m "refactor: rename oldFunctionName -> newFunctionName"
```

### Scenario 3: Extract Business Logic

**Problem:** Business logic duplicated in 3 API projects

**Solution:**
```typescript
// Create @vibetech/core package
// packages/core/src/validators/email.ts
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Integrate into all API projects atomically
```

## Nx Integration for Refactoring

### Visualize Dependencies

```bash
# See what projects depend on what
pnpm nx graph

# Check affected projects before refactoring
pnpm nx affected:graph
```

### Test Affected Projects

```bash
# Test all projects affected by changes
pnpm nx affected --target=test --base=main

# Build all affected projects
pnpm nx affected --target=build --base=main
```

### Lint Across Projects

```bash
# Run ESLint on all affected projects
pnpm nx affected --target=lint --base=main

# Auto-fix where possible
pnpm nx affected --target=lint --fix --base=main
```

## Refactoring Metrics

### Success Indicators
- **Code Duplication:** <10% (currently ~5% after 4 quick wins)
- **Shared Package Usage:** 4+ packages actively used
- **Type Safety:** 100% TypeScript coverage across boundaries
- **Test Coverage:** >80% in shared packages
- **Build Performance:** 80-90% cache hit rate with Nx

### Track Progress
```bash
# Count lines in shared packages
find packages/ -name "*.ts" -not -path "*/node_modules/*" | xargs wc -l

# Count duplicate patterns
pnpm nx run-many --target=lint | grep "duplicate code"

# Measure build cache effectiveness
pnpm nx run-many --target=build --verbose
```

## Future Refactoring Opportunities

Based on code analysis, consider extracting:

### High Priority
1. **@vibetech/logger** - Structured logging (found in 5+ projects)
2. **@vibetech/api** - Base API client (found in 4+ projects)
3. **@vibetech/config** - Shared configuration patterns

### Medium Priority
4. **@vibetech/hooks** expansion - useLocalStorage, useFetch, useMediaQuery
5. **@vibetech/validators** - Common validation logic
6. **@vibetech/test-utils** - Shared testing utilities

### Low Priority
7. **@vibetech/animations** - Framer Motion presets
8. **@vibetech/icons** - Icon wrapper components
9. **@vibetech/layouts** - Layout components

## Related Documentation

- [Monorepo Atomic Commits Guide](./MONOREPO_ATOMIC_COMMITS_GUIDE.md)
- [Monorepo Component Strategy](./MONOREPO_COMPONENT_STRATEGY.md)
- [Monorepo Quick Wins Summary](./MONOREPO_QUICK_WINS_SUMMARY.md)

---

**Last Updated:** 2025-10-26
**Status:** Active - 100% Monorepo Utilization 🎯
