# API Key Storage Fix - Test Instructions

## What Was Fixed

**Problem**: API keys were not saving in the production build of Deep Code Editor (Vibe Code Studio), even though it worked fine in development mode.

**Root Cause**: Conflicting electron-builder configurations were causing build inconsistencies:
- `package.json` had an embedded "build" config for "DeepCode Editor"
- `electron-builder.json` had a separate config for "Vibe Code Studio"
- This conflict could cause electron-builder to use the wrong settings

**Solution Applied**:
1. ✅ Removed the conflicting embedded build config from `package.json`
2. ✅ Consolidated all build configuration into `electron-builder.json`
3. ✅ Verified `"asar": false` is set (prevents read-only archive packaging)
4. ✅ Added proper file inclusion rules for `out/` and `dist/` directories
5. ✅ Ensured extraResources includes the built application files

## Testing the Fix

### After Installation:

1. **Launch Deep Code Editor**
   - Find the installed app in `release-builds/` directory
   - Run the .exe file

2. **Test API Key Storage**
   - Open the Settings/Preferences
   - Enter your DeepSeek API key
   - Click Save
   - Close the app completely
   - Reopen the app
   - Check if the API key is still there ✅

3. **Verify Storage Location**
   - The API keys are stored in: `%APPDATA%\Vibe Code Studio\secure-storage.json`
   - On Windows, this is typically: `C:\Users\<YourName>\AppData\Roaming\Vibe Code Studio\`
   - You can check this file exists and contains your encrypted API key

### What to Look For:

**SUCCESS**:
- ✅ API key saves and persists across app restarts
- ✅ The `secure-storage.json` file exists in userData directory
- ✅ No error messages in the console about storage failures

**FAILURE** (If this happens, report back):
- ❌ API key disappears after restarting the app
- ❌ Error messages about "Failed to write" or "Permission denied"
- ❌ Console shows "storage:set FAILED"

## Technical Details

### Why ASAR Disabled is Critical:
- ASAR (`app.asar`) packages the app into a read-only archive
- This prevents runtime file writes, including API key storage
- By setting `"asar": false`, the app files remain unpacked and writable

### Storage Implementation:
- Uses Electron's `app.getPath('userData')` for secure storage location
- Stores encrypted API keys in `secure-storage.json`
- Keys are encrypted using CryptoJS before storage
- IPC bridge provides secure communication between renderer and main process

## Build Commands Reference

```powershell
# Full production build (from C:\dev)
.\BUILD_PRODUCTION.ps1

# Or build just Deep Code Editor
cd C:\dev\projects\active\desktop-apps\deepcode-editor
pnpm run build
pnpm run electron:build:win
```

## Configuration Files Changed

1. **package.json**: Removed conflicting `"build"` section
2. **electron-builder.json**: Now the single source of truth for build config
   - Output: `release-builds/`
   - ASAR: disabled
   - Files: includes `out/` and `dist/`
