# 🛡️ Protected Code Sections - Critical Bug Fixes

**⚠️ DO NOT MODIFY WITHOUT REVIEW**

These code sections contain critical bug fixes. Changes require careful review.

---

## 🔒 **Files With Critical Fixes**

### 1. `src/stores/useIPCStore.ts`
- **Lines 259-278**: `useIPCConnectionStatus()` with `useMemo`
- **Lines 161-175**: `initializeIPCStore()` with guard flag
- **Lines 286-301**: `useIPCActions()` with `useMemo`
- **Lines 304-319**: `useIPC()` with `useMemo`

### 2. `src/services/IPCClient.ts`
- **Lines 169-176**: `send()` method adds `source: 'vibe'`

### 3. `src/components/IntegrationStatus.tsx`
- **Lines 193-240**: Memoized handlers with `useCallback` and `useMemo`

### 4. `src/services/DatabaseService.ts`
- **Lines 807-837**: `migrateStrategyMemory()` uses `localStorage` (NOT `window.electronAPI`)
- **Lines 1308, 1316, 1366, 1375, 1530, 1552**: Fallback methods use `localStorage`

---

## ✅ **Quick Verification Commands**

After any changes to these files:

```powershell
# Test Vibe loads
cd C:\dev\projects\active\desktop-apps\deepcode-editor
pnpm run dev

# Check for errors:
# ❌ "Maximum update depth exceeded" = useMemo was removed
# ❌ "Cannot read properties of undefined (reading 'store')" = localStorage was changed
# ❌ Duplicate "[IPC Store] Initializing..." = guard was removed
```

---

## 📋 **Before Committing**

Check:
- [ ] No `useMemo` removals in useIPCStore hooks
- [ ] No guard flag removals in `initializeIPCStore`
- [ ] No `localStorage` → `window.electronAPI` changes
- [ ] `source: 'vibe'` still present in IPCClient
- [ ] All styled-components props have `$` prefix

---

**If unsure, refer to**: `CRITICAL_FIXES_DO_NOT_REVERT.md`
