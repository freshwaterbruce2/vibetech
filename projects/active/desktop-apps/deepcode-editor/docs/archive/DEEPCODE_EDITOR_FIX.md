# DeepCode Editor - Complete Fix for Database & UnifiedAIService

## Root Problem

**Better-sqlite3 CANNOT be imported in Electron's renderer process.** It's a native Node.js module that only works in the main process.

Current error:
```
Failed to resolve import "better-sqlite3" from "src/services/DatabaseService.ts"
UnifiedAIService.ts:75 Uncaught TypeError: storedProviders is not iterable
```

## What's Been Done

1. ✅ Installed `better-sqlite3` as dependency (pnpm add better-sqlite3)
2. ✅ Created `electron/database-handler.ts` - handles all database ops in main process

## What Still Needs to Be Done

### 1. Update `electron/main.ts`

Add the import at the top:
```typescript
import * as dbHandler from './database-handler';
```

Initialize database in `app.whenReady()`:
```typescript
app.whenReady().then(() => {
  // Initialize database
  const dbInit = dbHandler.initializeDatabase();
  if (!dbInit.success) {
    console.error('[Electron] Database initialization failed:', dbInit.error);
  }

  createWindow();
  // ... rest of code
});
```

Close database on quit:
```typescript
app.on('window-all-closed', () => {
  dbHandler.closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

Add IPC handlers before the final console.log statements:
```typescript
/**
 * IPC Handlers - Database Operations
 */

// Execute database query
ipcMain.handle('db:query', async (event, sql, params = []) => {
  try {
    const result = dbHandler.executeQuery(sql, params);
    return result;
  } catch (error) {
    console.error('[Electron] Database query error:', error);
    return { success: false, error: error.message };
  }
});

// Initialize database
ipcMain.handle('db:initialize', async () => {
  try {
    const result = dbHandler.initializeDatabase();
    return result;
  } catch (error) {
    console.error('[Electron] Database init error:', error);
    return { success: false, error: error.message };
  }
});
```

### 2. Update `electron/preload.ts`

Add database API to the window.electron object (around line 111, after storage section):
```typescript
  // Database operations
  db: {
    query: async (sql, params = []) => {
      return await ipcRenderer.invoke('db:query', sql, params);
    },
    initialize: async () => {
      return await ipcRenderer.invoke('db:initialize');
    },
  },
```

### 3. Update `src/services/DatabaseService.ts`

Remove the better-sqlite3 import and replace database operations with IPC calls:

**Remove these lines (around line 60-70):**
```typescript
let retryWithFallback = false;
try {
  const module = await import("better-sqlite3");
  const Database = module.default || module;
  // ... all the database initialization code
```

**Replace with:**
```typescript
// Use Electron IPC for database operations
if (typeof window !== 'undefined' && window.electron?.db) {
  const result = await window.electron.db.initialize();
  if (!result.success) {
    logger.error('[DatabaseService] Database initialization failed:', result.error);
    logger.debug('[DatabaseService] Falling back to localStorage');
    return; // Fall through to localStorage
  }
  logger.info('[DatabaseService] Initialized successfully via Electron IPC');
  return;
}

// Fallback to localStorage if not in Electron
logger.debug('[DatabaseService] Using localStorage fallback (not in Electron)');
```

**Replace all database query methods** like `saveChatMessage`, `saveCodeSnippet`, etc. with:
```typescript
private async executeQuery(sql: string, params: any[]): Promise<any> {
  if (typeof window !== 'undefined' && window.electron?.db) {
    const result = await window.electron.db.query(sql, params);
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } else {
    // localStorage fallback
    throw new Error('Database not available');
  }
}
```

### 4. Fix UnifiedAIService.ts

The `getStoredProviders()` method returns a Promise, but it's being called synchronously.

**Line 32 - Constructor:**
```typescript
// BEFORE:
const storedProviders = this.keyManager.getStoredProviders();

// AFTER:
const storedProviders = []; // Will be loaded async by initializeProvidersFromStorage()
```

**Line 72 - initializeProvidersFromStorage:**
```typescript
// BEFORE:
const storedProviders = this.keyManager.getStoredProviders();

// AFTER:
const storedProviders = await this.keyManager.getStoredProviders();
```

## Quick Fix Script

Stop all processes first:
```powershell
taskkill /F /IM electron.exe /T
taskkill /F /IM node.exe /T
```

Then apply the fixes above to:
1. `electron/main.ts`
2. `electron/preload.ts`
3. `src/services/DatabaseService.ts`
4. `src/services/ai/UnifiedAIService.ts`

## Verification

After fixes, run:
```bash
cd C:/dev/projects/active/desktop-apps/deepcode-editor
pnpm run dev
```

The app should start without errors. Check console for:
```
[Electron] Main process initialized
[Database] Initialized at: D:\databases\database.db
[DatabaseService] Initialized successfully via Electron IPC
```

## Architecture Summary

```
┌─────────────────────────────────────────┐
│   Renderer Process (Browser/React)     │
│                                         │
│  DatabaseService.ts                     │
│  └─> window.electron.db.query()        │
│                                         │
│  UnifiedAIService.ts (FIXED)            │
│  └─> await getStoredProviders()         │
└─────────────────────────────────────────┘
              │  IPC Channel
              ↓
┌─────────────────────────────────────────┐
│     Main Process (Node.js/Electron)     │
│                                         │
│  main.ts                                │
│  ├─> ipcMain.handle('db:query')        │
│  └─> database-handler.ts                │
│       └─> better-sqlite3 ✓             │
└─────────────────────────────────────────┘
```

## Files Created
- ✅ `electron/database-handler.ts` - Complete database handler

## Files to Modify
- ⏳ `electron/main.ts` - Add IPC handlers
- ⏳ `electron/preload.ts` - Expose database API
- ⏳ `src/services/DatabaseService.ts` - Use IPC instead of direct import
- ⏳ `src/services/ai/UnifiedAIService.ts` - Fix async/sync mismatch
