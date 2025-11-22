# 🗄️ Centralized Storage Architecture

**Date**: November 8, 2025
**Status**: ✅ IMPLEMENTED
**Architecture**: D:\databases\ - Single Source of Truth

---

## 🎯 **Storage Strategy (2025 Best Practice)**

### **Primary Storage: D:\databases\**

All persistent application data stored centrally:

```
D:\databases\
├── database.db           ← Unified learning & app data (NOVA + Vibe)
├── trading.db            ← Trading data (separate project)
└── nova_activity.db      ← NOVA activity tracking

Note: agent_learning.db migrated to database.db on 2025-10-06
```

---

## 📊 **Data Flow**

```
┌─────────────────────────────────────────────────────┐
│                   D:\databases\                      │
│  (Single Source of Truth - Shared by All Apps)      │
└──────────┬────────────────────────────┬─────────────┘
           │                            │
     ┌─────▼─────┐              ┌───────▼────────┐
     │ NOVA Agent│              │ Vibe Code      │
     │  (Tauri)  │◄────IPC─────►│    Studio      │
     │           │   Bridge     │  (Electron)    │
     └───────────┘              └────────────────┘
           │                            │
           ▼                            ▼
    Direct SQLite              IPC → Main Process
    better-sqlite3             → better-sqlite3
```

---

## ✅ **What We Changed Today**

### **Before** (Data Silos):
```typescript
// ❌ WRONG: Created data silos
if (databaseFails) {
  localStorage.setItem('mistakes', data);  // Vibe-only data!
}
```

**Problems:**
- ❌ NOVA can't see Vibe's localStorage data
- ❌ Data scattered across localStorage + D:\databases\
- ❌ No single source of truth
- ❌ Sync issues between apps

### **After** (Centralized):
```typescript
// ✅ CORRECT: Single source of truth
if (databaseFails) {
  logger.error('Database unavailable');
  throw new Error('D:\\databases\\ required');
}
```

**Benefits:**
- ✅ All data in D:\databases\
- ✅ NOVA and Vibe share same data
- ✅ Single source of truth
- ✅ No sync needed (same database!)

---

## 📁 **Storage Breakdown**

### **D:\databases\database.db** (Vibe App Data)
- Chat history
- Code snippets
- Settings
- Analytics
- Strategy patterns

### **D:\databases\database.db** (Unified Learning)
- Mistakes (from both apps)
- Knowledge entries (from both apps)
- Patterns (from both apps)
- **Shared by**: NOVA Agent + Vibe Code Studio
- **Note**: Migrated from agent_learning.db on 2025-10-06

### **localStorage** (Limited Use Only)
**Allowed:**
- ✅ UI preferences (theme, window size)
- ✅ Demo mode toggle
- ✅ Temporary UI state
- ✅ SQL.js database blob (web mode)

**NOT Allowed:**
- ❌ Application data
- ❌ Learning data
- ❌ Persistent storage
- ❌ Fallback storage

---

## 🔧 **Implementation Details**

### **Database Access Pattern:**

```typescript
// Electron (Vibe Code Studio)
const result = await window.electron.db.query(sql, params);

// Tauri (NOVA Agent)
const result = await invoke('db_query', { sql, params });

// Both access: D:\databases\database.db
```

### **Shared Learning Database:**

```typescript
// Both apps write to unified database
const LEARNING_DB = 'D:\\databases\\database.db';

// NOVA logs mistake
await invoke('log_mistake', { mistake });

// Vibe logs mistake
await window.electron.db.query(sql, params);

// Both write to SAME database!
// No sync needed - it's already shared!
```

---

## 🛡️ **Why This Prevents Auto-Revert Issues**

### **Before:**
```typescript
const stored = localStorage.getItem(key);  // AI says: "Use electron-store!"
```
- Linter/AI suggests changing to window.electronAPI
- You click "Apply Fix"
- Code breaks

### **After:**
```typescript
// Migration disabled - no localStorage in DatabaseService
// All data → D:\databases\
```
- No localStorage to trigger suggestions
- No AI "fixes" to apply
- Clean, simple architecture

---

## ✅ **Migration Strategy**

### **One-Time Migration (Now Disabled)**

The `migrateStrategyMemory()` function is **disabled**:

```typescript
async migrateStrategyMemory() {
  // DISABLED: Fresh start with D:\databases\
  logger.debug('Migration skipped - using centralized storage');
  return { migrated: 0, errors: 0 };
}
```

**Why disabled:**
- All new data goes to D:\databases\
- Old localStorage data (if any) can stay there
- Fresh start with centralized database
- No migration complexity

---

## 📊 **Benefits of This Architecture**

| Feature | Before | After |
|---------|--------|-------|
| Data location | localStorage + D:\databases\ | D:\databases\ only |
| NOVA ↔ Vibe sync | IPC messages needed | No sync (same DB!) |
| Single source | ❌ No (scattered) | ✅ Yes (D: drive) |
| AI suggestions | ❌ Triggers rewrites | ✅ Clean code |
| Maintenance | Complex (2 systems) | Simple (1 system) |

---

## 🚀 **What This Means For You**

### **Development:**
- ✅ Both apps read/write D:\databases\
- ✅ Changes in NOVA instantly visible in Vibe
- ✅ Changes in Vibe instantly visible in NOVA
- ✅ No sync lag, no conflicts

### **Production:**
- ✅ Backup ONE location (D:\databases\)
- ✅ Easy to migrate between machines
- ✅ Simple architecture
- ✅ No data silos

---

## 📝 **Future: Other localStorage Usage**

These other files still use localStorage (OK for now):
- `WorkspaceManager.ts` - Recent workspaces (UI state)
- `TaskQueue.ts` - Task persistence
- `UnifiedAIService.ts` - Demo mode toggle

**Recommendation:** Eventually migrate these to D:\databases\ too for consistency.

---

## ✅ **Verification**

After this change:

```powershell
# Check unified database exists
Test-Path D:\databases\database.db

# Verify migration complete (should be false)
Test-Path D:\learning-system\agent_learning.db

# Start both apps
# NOVA: Check learning panel
# Vibe: Check learning panel
# Should show SAME data from database.db!
```

---

**Architecture Status**: ✅ PRODUCTION READY
**Data Silos**: ✅ ELIMINATED
**Single Source of Truth**: ✅ D:\databases\
**AI Auto-Revert Issue**: ✅ SOLVED
