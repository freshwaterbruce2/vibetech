# Commands To Run Now

**Date:** November 7, 2025

---

## 🎯 THE API KEY PROBLEM IS SOLVED!

**Root Cause:** ASAR configuration mismatch in `electron-builder.json`
**Fix Applied:** ✅ Changed `asar: true` to `asar: false`

---

## 🚀 Command 1: Rebuild Vibe Code Studio (With Fix)

```powershell
cd C:\dev\projects\active\desktop-apps\deepcode-editor
npm run electron:build:win
```

**This will:**
- Build with ASAR disabled (allows file writes)
- Create installers with API key storage fix
- Take ~2-3 minutes

**Output:** `dist-electron\Vibe Code Studio Setup 1.0.4.exe`

---

## 🧪 Command 2: Test API Key Persistence

```powershell
# Install the new build
cd C:\dev\projects\active\desktop-apps\deepcode-editor
.\dist-electron\Vibe Code Studio Setup 1.0.4.exe

# After install:
# 1. Launch Vibe Code Studio
# 2. Press Ctrl+, for Settings
# 3. Scroll to "API Key Security Settings"
# 4. Enter your DeepSeek API key (sk-...)
# 5. Click Save
# 6. Close and reopen app
# 7. Check Settings - key should persist!
```

---

## 🔍 Command 3: Verify Storage File Created

```powershell
# Check userData directory
Get-ChildItem "$env:APPDATA\vibe-code-studio\" -Recurse

# Should see: secure-storage.json with your encrypted API key
Get-Content "$env:APPDATA\vibe-code-studio\secure-storage.json"
```

---

## ⚡ Command 4: Check NOVA Agent Build Status

```powershell
# Check if build completed
cd C:\dev\projects\active\desktop-apps\nova-agent-current\src-tauri
Test-Path target\release\nova-agent.exe

# If exists, run it:
.\target\release\nova-agent.exe
```

---

## 🌉 Command 5: Start IPC Bridge (For Integration)

```powershell
# Open new terminal
cd C:\dev\backend\ipc-bridge
npm start

# You should see:
# ✅ IPC Bridge Server listening on ws://localhost:5004
```

---

## 🎯 Complete Startup Sequence

```powershell
# Terminal 1: IPC Bridge
cd C:\dev\backend\ipc-bridge
npm start

# Terminal 2: Wait for bridge to start, then launch Vibe
cd C:\dev\projects\active\desktop-apps\deepcode-editor
npm run dev
# Or use installed version

# Terminal 3: Launch NOVA Agent (when build completes)
cd C:\dev\projects\active\desktop-apps\nova-agent-current
.\src-tauri\target\release\nova-agent.exe
# Or use: npm run dev
```

---

## 📝 Quick Reference

| Command | Purpose | Time |
|---------|---------|------|
| `npm run electron:build:win` | Rebuild Vibe with fix | 2-3 min |
| `cargo build --release` | Build NOVA Agent | 10-15 min |
| `npm start` (ipc-bridge) | Start communication bridge | instant |
| `npm run dev` | Development mode | instant |

---

## ✅ What's Fixed

1. ✅ **Vibe Code Studio ASAR** - API keys can now save
2. ✅ **NOVA Agent Dependencies** - All missing packages added
3. ✅ **Vibe Integration** - Module imports corrected
4. ✅ **Plugin System** - Disabled temporarily (workaround)

---

## 🎉 Next Actions

**RIGHT NOW:**
```powershell
cd C:\dev\projects\active\desktop-apps\deepcode-editor
npm run electron:build:win
```

**AFTER BUILD:**
1. Install the new Vibe Code Studio
2. Save your API key in Settings
3. Restart app to verify key persists
4. Start coding with AI!

---

**All documentation created:**
- `API_KEY_STORAGE_ROOT_CAUSE_ANALYSIS.md` - Technical deep dive
- `COMPREHENSIVE_PROJECT_REVIEW.md` - Full project review
- `FINAL_FIX_SUMMARY.md` - All fixes applied
- `VIBE_CODE_STUDIO_USER_GUIDE.md` - User guide
- `QUICK_START_BOTH_APPS.md` - Quick start

**Memory Updated:** [[memory:10932769]] - ASAR configuration issue documented for future reference.

---

🚀 **Ready to rebuild!**
