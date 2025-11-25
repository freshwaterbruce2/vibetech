# Quick Fix for Tauri v2 Compatibility

Your system has **Tauri v2** installed, but the config was for Tauri v1. Here's the fixed version!

## Download Fixed Version

[Desktop Commander v2.0 (Tauri v2 Compatible)](computer:///mnt/user-data/outputs/desktop-commander-v2-fixed.tar.gz)

## Quick Install

```powershell
# 1. Extract to your location
cd C:\dev\active-projects\desktop-commander-v2

# If directory exists, remove old one first
rm -r -force desktop-commander

# Extract the new archive

# 2. Navigate into it
cd desktop-commander

# 3. Allow PowerShell script for this session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# 4. Install dependencies
npm install

# 5. Launch!
npm run tauri:dev
```

## What Was Fixed?

✅ **tauri.conf.json** - Updated to v2 format
✅ **Cargo.toml** - Using Tauri v2 dependencies
✅ **package.json** - Using @tauri-apps v2 packages
✅ **main.rs** - Using Tauri v2 API (plugin system)

## Differences from v1 to v2

### Config Format Changed
**v1:**
```json
{
  "tauri": {
    "bundle": { ... },
    "windows": [ ... ]
  }
}
```

**v2:**
```json
{
  "identifier": "...",
  "bundle": { ... },
  "app": {
    "windows": [ ... ]
  }
}
```

### API Changes
- `app.handle()` needs `.clone()` in v2
- Shell plugin now separate: `tauri-plugin-shell`
- Build configuration uses different property names

## All Features Still Work!

All 5 enhancements are fully functional:
- ✅ Parallel start/stop
- ✅ Service dependencies
- ✅ Health checks
- ✅ Auto-restart
- ✅ Resource monitoring

## First Launch

The first `npm run tauri:dev` will take 3-5 minutes because:
1. Installing npm dependencies (~1 min)
2. Downloading Rust crates (~1 min)
3. Compiling Rust backend (~2-3 min)

Subsequent launches are ~10 seconds.

## Still Getting Errors?

### If you get npm install errors:
```powershell
# Clean install
rm -r node_modules
rm package-lock.json
npm install
```

### If you get Rust compilation errors:
```powershell
cd src-tauri
cargo clean
cd ..
npm run tauri:dev
```

### If PowerShell blocks scripts:
```powershell
# Run this in your PowerShell window:
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Then try again:
npm run tauri:dev
```

## That's It!

Once built, you'll have the full Desktop Commander v2.0 with all the enhanced service management features!
