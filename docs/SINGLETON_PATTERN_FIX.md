# Singleton Pattern Fix

## Issue

The `getInstance()` singleton pattern in both database adapters had a logic bug:

**Problem:** If called multiple times with different config parameters, it silently ignored config passed after the first call and returned the instance with the original configuration.

**Impact:** Violated the principle of least surprise and could cause subtle bugs where different parts of code expect different configurations but get the same instance.

**Affected Files:**
- `packages/db-app/src/index.ts`
- `packages/db-learning/src/index.ts`

## Solution

### Added Warning

Now when `getInstance()` is called with config after an instance already exists, it logs a warning:

```typescript
public static getInstance(config?: AppDatabaseConfig): AppDatabase {
  if (!AppDatabase.instance) {
    AppDatabase.instance = new AppDatabase(config);
  } else if (config) {
    // Warn if trying to reinitialize with different config
    console.warn('[AppDatabase] getInstance() called with config but instance already exists. Config ignored. Use close() first to reinitialize.');
  }
  return AppDatabase.instance;
}
```

### Added Reset Method

Added `resetInstance()` to allow proper reinitialization:

```typescript
public static resetInstance(): void {
  if (AppDatabase.instance) {
    AppDatabase.instance.close();
  }
}
```

## Usage

### Correct Usage

```typescript
// First call - creates instance with config
const db = AppDatabase.getInstance({ path: 'D:\\databases\\database.db' });

// Subsequent calls - no config needed
const sameDb = AppDatabase.getInstance();
```

### Reinitialization

```typescript
// Reset the singleton
AppDatabase.resetInstance();

// Now you can create a new instance with different config
const newDb = AppDatabase.getInstance({ path: 'different.db', verbose: true });
```

## Testing

Comprehensive tests added to verify the fix:

- `packages/db-app/tests/singleton.test.ts`
- `packages/db-learning/tests/singleton.test.ts`

Run tests:

```powershell
pnpm --filter '@vibetech/db-app' test
pnpm --filter '@vibetech/db-learning' test
```

## Test Coverage

Tests verify:
1. ✅ Single instance is returned
2. ✅ Warning is logged when config is ignored
3. ✅ No warning when called without config
4. ✅ Reinitialization works after reset

## Breaking Changes

None - this is a backward-compatible bug fix that only adds warnings.

## Migration Guide

No migration needed. Existing code continues to work, but will now see warnings if it was relying on the buggy behavior.

If you see warnings in your logs:

1. **Remove redundant config** - Only pass config on the first call
2. **Or use resetInstance()** - If you truly need different configs at different times

## Related

- Issue discovered during monorepo integration review
- Similar pattern should be checked in other singleton implementations
