# 🧹 Clean and Rebuild - Integration Fixed Version

**Date**: November 8, 2025
**Purpose**: Clean old builds and rebuild with integration fixes
**Status**: Ready to execute

---

## 🎯 Why Clean First?

- Remove old compiled code
- Clear cached modules
- Ensure fresh TypeScript compilation
- Prevent old bugs from persisting
- Get accurate error messages

---

## 🧹 Step 1: Clean Everything

### NOVA Agent

```powershell
cd C:\dev\projects\active\desktop-apps\nova-agent-current

# Clean Rust build artifacts
cargo clean

# Clean frontend build artifacts
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules/.vite" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

# Clean Tauri target (optional - slow to rebuild)
# Remove-Item -Path "src-tauri/target" -Recurse -Force -ErrorAction SilentlyContinue

# Reinstall dependencies (optional)
# pnpm install --force
```

### Vibe Code Studio

```powershell
cd C:\dev\projects\active\desktop-apps\deepcode-editor

# Clean build artifacts
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "dist-electron" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules/.vite" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

# Clear Vite cache
Remove-Item -Path ".vite" -Recurse -Force -ErrorAction SilentlyContinue

# Reinstall dependencies (optional)
# npm install --force
```

---

## 🏗️ Step 2: Rebuild Fresh

### Terminal 1: IPC Bridge (Keep Running)

```powershell
cd C:\dev\backend\ipc-bridge
npm start
```

**Leave this running!**

---

### Terminal 2: NOVA Agent (Fresh Dev Build)

```powershell
cd C:\dev\projects\active\desktop-apps\nova-agent-current

# Start fresh dev server
pnpm run dev
```

**Expected**:
- Vite builds frontend (~5-10 seconds)
- Cargo builds Rust backend (~30-60 seconds first time)
- App launches
- Toast: "Connected to IPC Bridge" ✅

---

### Terminal 3: Vibe Code Studio (Fresh Dev Build)

```powershell
cd C:\dev\projects\active\desktop-apps\deepcode-editor

# Start fresh dev server
npm run dev
```

**Expected**:
- Vite builds frontend (~5-10 seconds)
- Electron launches
- No "EventEmitter" error
- Notification: "Connected to IPC Bridge" ✅

---

## ⚡ Quick Clean & Rebuild Script

### All-in-One Command

```powershell
# NOVA Clean
cd C:\dev\projects\active\desktop-apps\nova-agent-current
Remove-Item -Path "dist","node_modules/.vite" -Recurse -Force -ErrorAction SilentlyContinue
cargo clean

# Vibe Clean
cd C:\dev\projects\active\desktop-apps\deepcode-editor
Remove-Item -Path "dist","dist-electron","node_modules/.vite",".vite" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "✅ Clean complete! Now run dev servers in separate terminals."
```

---

## 🎯 What This Fixes

### NOVA
- ✅ Infinite loop in FileBrowser (fixed with proper Zustand selectors)
- ✅ Non-blocking IPC initialization
- ✅ Clean compilation

### Vibe
- ✅ EventEmitter import error (fixed with SimpleEventEmitter)
- ✅ Non-blocking IPC initialization
- ✅ No stuck loading

---

## 🚀 Rebuild Order

### Recommended Sequence

1. **Stop all running dev servers** (Ctrl+C in all terminals)
2. **Run clean commands** (above)
3. **Start IPC Bridge** first
4. **Start NOVA** second
5. **Start Vibe** third
6. **Verify connections** (both should show connected)

---

## ✅ Success Criteria

After clean rebuild, you should see:

### NOVA Agent
- [x] Compiles without errors
- [x] App launches (not stuck)
- [x] Toast: "Connected to IPC Bridge"
- [x] Console: `✅ Connected to IPC Bridge`
- [x] No infinite loop errors
- [x] UI fully responsive

### Vibe Code Studio
- [x] Compiles without errors
- [x] App launches (not stuck)
- [x] No EventEmitter import error
- [x] Notification: "Connected to IPC Bridge"
- [x] Console: `[IPC] ✓ Connected to IPC Bridge`
- [x] Status bar shows "IPC 🟢"

---

## 🐛 Issues Fixed in This Build

1. **NOVA FileBrowser infinite loop** ✅
   - Cause: Destructuring useIPCStore caused re-renders
   - Fix: Use Zustand selectors directly

2. **Vibe EventEmitter import error** ✅
   - Cause: Wrong import syntax for ES modules
   - Fix: Custom SimpleEventEmitter class

3. **Blocking IPC initialization** ✅
   - Cause: `await` blocked React render
   - Fix: Non-blocking promises

---

## 📝 Clean Build Checklist

Before starting dev servers:

- [ ] Stop all dev servers (Ctrl+C)
- [ ] Clean NOVA dist and .vite cache
- [ ] Clean Vibe dist and .vite cache
- [ ] Run `cargo clean` in NOVA
- [ ] IPC Bridge ready on port 5004
- [ ] Start NOVA dev server
- [ ] Start Vibe dev server
- [ ] Verify no errors in terminals
- [ ] Verify both apps load completely
- [ ] Verify connection toasts appear

---

## 🔄 Quick Restart Commands

Copy-paste ready:

```powershell
# Kill all dev servers first (Ctrl+C in each terminal)

# Terminal 1: IPC Bridge
cd C:\dev\backend\ipc-bridge
npm start

# Terminal 2: NOVA (after cleaning)
cd C:\dev\projects\active\desktop-apps\nova-agent-current
pnpm run dev

# Terminal 3: Vibe (after cleaning)
cd C:\dev\projects\active\desktop-apps\deepcode-editor
npm run dev
```

---

**Ready to clean and rebuild?** The fixes are in place, just need fresh compilation! 🚀
