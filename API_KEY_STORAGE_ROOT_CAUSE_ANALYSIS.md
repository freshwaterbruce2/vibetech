# API Key Storage - Root Cause Analysis

**Date:** November 7, 2025
**Issue:** Vibe Code Studio cannot save API keys, but NOVA Agent can

---

## 🔍 Problem Summary

**NOVA Agent:** ✅ API keys save and persist correctly
**Vibe Code Studio:** ❌ API keys don't save or persist after app restart

---

## 🎯 ROOT CAUSE IDENTIFIED

### Critical Configuration Conflict

**File:** `electron-builder.json` vs `package.json`

```json
// electron-builder.json (line 6)
"asar": true,    // ❌ PROBLEM!

// package.json (line 140)
"asar": false,   // ✅ CORRECT
```

**Impact:** `electron-builder.json` overrides `package.json`, packaging the app with ASAR enabled.

### Why This Breaks API Key Storage

When `asar: true`:
1. App resources are packaged into `app.asar` (read-only archive)
2. Runtime file writes may fail or behave unexpectedly
3. `secure-storage.json` should write to userData, but may encounter issues

---

## 📊 Comparison: NOVA vs Vibe

### NOVA Agent (Working) ✅

**Storage Method:**
```rust
// Simple .env file reading
deepseek_api_key: env::var("DEEPSEEK_API_KEY")
    .unwrap_or_else(|_| "".to_string())
```

**Storage Locations:**
1. `.env` file in project root
2. `settings.json` in `%APPDATA%\nova-agent\`

**Why It Works:**
- Direct environment variable reading (no complex storage)
- Simple JSON file in AppData (always writable)
- Rust/Tauri handles file permissions correctly

### Vibe Code Studio (Broken) ❌

**Storage Method:**
```typescript
// Complex secure storage via IPC
await this.electronStorage.set(storageKey, JSON.stringify(storedKey));
```

**Storage Location:**
- `secure-storage.json` in `app.getPath('userData')`
- Example: `C:\Users\{user}\AppData\Roaming\vibe-code-studio\secure-storage.json`

**Why It Fails:**
1. **ASAR Conflict** - Config mismatch between `electron-builder.json` and `package.json`
2. **Complex Encryption** - Multiple layers (encrypt → store → verify)
3. **IPC Race Conditions** - Async storage calls may not complete before app closes
4. **Missing Error Handling** - Fails silently in production

---

## 🔧 Solutions (In Priority Order)

### Solution 1: Fix ASAR Configuration ⭐ RECOMMENDED

```json
// electron-builder.json (CHANGE THIS)
{
  "asar": false,  // ✅ Match package.json
  // ...rest of config
}
```

**Why This Works:**
- Allows normal file I/O operations
- No read-only archive restrictions
- Simpler debugging
- Consistent with package.json

**Trade-offs:**
- Slightly larger package size
- Source code visible (not obfuscated)

### Solution 2: Use Electron SafeStorage API ⭐⭐ BEST PRACTICE

Replace custom storage with Electron's built-in `safeStorage`:

```typescript
// electron/main.ts
import { safeStorage } from 'electron';

ipcMain.handle('storage:set', async (event, key, value) => {
  const encrypted = safeStorage.encryptString(value);
  await fs.writeFile(
    path.join(app.getPath('userData'), 'secure-storage.dat'),
    encrypted
  );
  return { success: true };
});

ipcMain.handle('storage:get', async (event, key) => {
  const data = await fs.readFile(
    path.join(app.getPath('userData'), 'secure-storage.dat')
  );
  const decrypted = safeStorage.decryptString(data);
  return { success: true, value: decrypted };
});
```

**Benefits:**
- Uses OS-level encryption (Windows Data Protection API)
- No custom encryption code
- More secure
- Works with ASAR enabled

### Solution 3: Use electron-store Package ⭐⭐⭐ EASIEST

Install and use `electron-store`:

```powershell
npm install electron-store
```

```typescript
// electron/main.ts
import Store from 'electron-store';

const store = new Store({
  name: 'secure-storage',
  encryptionKey: 'your-encryption-key'
});

ipcMain.handle('storage:set', async (event, key, value) => {
  store.set(key, value);
  return { success: true };
});

ipcMain.handle('storage:get', async (event, key) => {
  const value = store.get(key);
  return { success: true, value };
});
```

**Benefits:**
- Battle-tested library (used by VS Code, Atom, etc.)
- Built-in encryption
- Automatic file handling
- Works with ASAR enabled
- Handles all edge cases

### Solution 4: Simplify Like NOVA Agent ⭐ SIMPLE

Just use .env file like NOVA Agent:

```typescript
// electron/main.ts
import * as dotenv from 'dotenv';
dotenv.config();

ipcMain.handle('storage:get', async (event, key) => {
  return {
    success: true,
    value: process.env[`VITE_${key.toUpperCase()}`]
  };
});
```

**Benefits:**
- Super simple
- No encryption complexity
- Proven to work (NOVA Agent uses this)
- Easy to debug

**Trade-offs:**
- Keys stored in plain text
- Not as secure

---

## 🐛 Additional Issues Found

### 1. ASAR Configuration Mismatch

**Files Affected:**
- `electron-builder.json` (asar: true)
- `package.json` (asar: false)

**Fix:** Make them consistent

### 2. Silent Failures in SecureApiKeyManager

**Problem:** When `electronStorage.set()` fails, it returns `false` but doesn't tell the user WHY

**Location:** `SecureApiKeyManager.ts:173-176`

**Fix:** Add better error messages and logging

### 3. Missing Verification

**Problem:** No verification that storage actually worked after saving

**Fix:** Add verification step and retry logic

---

## 📝 Recommended Fix (Step-by-Step)

### Quick Fix (5 minutes)

```powershell
cd C:\dev\projects\active\desktop-apps\deepcode-editor
```

1. **Fix ASAR setting:**
   Edit `electron-builder.json` line 6:
   ```json
   "asar": false,
   ```

2. **Rebuild:**
   ```powershell
   npm run electron:build:win
   ```

3. **Test:**
   - Install new build
   - Open Settings
   - Save API key
   - Restart app
   - Check if key persists

### Better Fix (30 minutes)

Install `electron-store`:
```powershell
npm install electron-store
```

Replace custom storage with electron-store (see Solution 3 above).

---

## ✅ Verification Steps

After applying fix:

1. **Save API Key:**
   ```
   - Open Settings (Ctrl+,)
   - Enter DeepSeek API key
   - Click Save
   - Check console for success message
   ```

2. **Verify File Created:**
   ```powershell
   # Check userData directory
   Get-ChildItem "$env:APPDATA\vibe-code-studio\" -Recurse

   # Should see: secure-storage.json
   ```

3. **Test Persistence:**
   ```
   - Restart Vibe Code Studio
   - Open Settings
   - API key should still be there
   - Try making an AI request
   ```

---

## 🎯 Why NOVA Agent Works

**NOVA Agent's Approach:**
1. Uses `.env` file (simple, proven)
2. Reads environment variables via Rust `dotenv` crate
3. Falls back to `settings.json` in AppData
4. No complex encryption or IPC
5. No ASAR packaging issues

**Lessons Learned:**
- Simpler is often better
- Environment variables are reliable
- Complex encryption adds failure points
- Direct file access > IPC calls

---

## 📋 Action Plan

### Immediate (Today)

1. ✅ Identify root cause (ASAR mismatch) - DONE
2. ⏳ Fix `electron-builder.json` asar setting
3. ⏳ Rebuild Vibe Code Studio
4. ⏳ Test API key persistence

### Short-term (This Week)

1. Consider migrating to `electron-store`
2. Add better error messages
3. Add verification step after saving
4. Document the fix in learning system

### Long-term (Future)

1. Implement Electron safeStorage API
2. Add retry logic for failed saves
3. Add user feedback when save fails
4. Create automated tests for API key storage

---

## 📚 Related Documentation

- **NOVA Agent Setup:** `setup-api-key.ps1`
- **Vibe Storage Implementation:** `electron/main.ts:488-609`
- **SecureApiKeyManager:** `src/utils/SecureApiKeyManager.ts`
- **Electron Builder Config:** `electron-builder.json`

---

## ✅ Summary

**Root Cause:** ASAR configuration mismatch in `electron-builder.json`

**Quick Fix:** Set `"asar": false` in `electron-builder.json`

**Best Fix:** Use `electron-store` package for bulletproof storage

**Alternative:** Simplify to .env file like NOVA Agent

---

**Next Action:** Fix the ASAR setting and rebuild Vibe Code Studio!
