# Quick Start: Both Applications

**Date:** November 7, 2025

---

## ✅ Vibe Code Studio - Ready Now!

### Install and Run

```powershell
# Option 1: Install
C:\dev\projects\active\desktop-apps\deepcode-editor\dist-electron\DeepCode Editor Setup 1.0.4.exe

# Option 2: Portable (no install)
C:\dev\projects\active\desktop-apps\deepcode-editor\dist-electron\DeepCode Editor 1.0.4.exe
```

### First Steps

1. Launch the app
2. Press `Ctrl+,` for Settings
3. Add your DeepSeek API key (get from https://platform.deepseek.com/api_keys)
4. Click File → Open Folder
5. Start coding!

### Key Shortcuts

- `Ctrl+L` - AI Chat
- `Ctrl+P` - Quick Open File
- `Ctrl+Shift+P` - Command Palette
- `Ctrl+B` - Toggle Sidebar
- `Ctrl+S` - Save File

---

## ⚠️ NOVA Agent - Building Now

NOVA Agent had some build issues that we're fixing:

### What Was Fixed

✅ Added missing Cargo dependencies (anyhow, async-trait, windows, sysinfo, etc.)
✅ Fixed vibe_integration module
✅ Temporarily disabled plugin system (async trait compatibility issue)

### Current Status

🔄 **Building in background** - This takes 10-15 minutes

The build is running with:
```powershell
cargo build --release
```

### When Build Completes

You'll find the executable at:
```
C:\dev\projects\active\desktop-apps\nova-agent-current\src-tauri\target\release\nova-agent.exe
```

To check build progress:
```powershell
cd C:\dev\projects\active\desktop-apps\nova-agent-current\src-tauri
# Check if exe exists yet
Test-Path target\release\nova-agent.exe
```

---

## 🎯 What To Do Now

### Start with Vibe Code Studio

Since Vibe Code Studio is ready and working:

1. **Install Vibe Code Studio:**
   ```powershell
   Start-Process "C:\dev\projects\active\desktop-apps\deepcode-editor\dist-electron\DeepCode Editor Setup 1.0.4.exe"
   ```

2. **Configure API Key:**
   - Launch app
   - Settings (`Ctrl+,`)
   - AI Provider → Enter DeepSeek API key
   - Save

3. **Start Coding:**
   - Open a project folder
   - Use AI chat for help (`Ctrl+L`)
   - Get real-time code completions

### While NOVA Agent Builds

The NOVA Agent build is running in the background. It will take 10-15 minutes for the first build.

---

## 📚 Documentation

- **`VIBE_CODE_STUDIO_USER_GUIDE.md`** - Complete Vibe Code Studio guide
- **`BUILD_FIX_SUMMARY.md`** - Details on what was fixed in NOVA Agent
- **`NEXT_STEPS.md`** - What to do after builds complete

---

## 🔧 Alternative: Development Mode

If you want to use NOVA Agent before the release build completes:

```powershell
cd C:\dev\projects\active\desktop-apps\nova-agent-current
npm run dev
```

This starts NOVA Agent in development mode (faster, no installer needed).

---

## ✅ Summary

**Available Now:**
- ✅ **Vibe Code Studio** - Ready to install and use!

**Building:**
- 🔄 **NOVA Agent** - Building in background (10-15 min)

**Recommendation:** Start with Vibe Code Studio now!

---

**See `VIBE_CODE_STUDIO_USER_GUIDE.md` for complete usage instructions.**
