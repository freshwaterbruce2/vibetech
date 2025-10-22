# Desktop Commander v2.0 - Installation Fix

## The Issue

You have a **directory structure problem**. The archive contains a `desktop-commander` folder, so after extracting you need to navigate **into** that folder.

## ✅ Correct Installation Steps

```powershell
# 1. Start fresh - navigate to where you want to extract
cd C:\dev\active-projects

# 2. Create a clean directory
mkdir desktop-commander-app
cd desktop-commander-app

# 3. Extract desktop-commander-v2-final.tar.gz HERE
# After extraction, you should see:
# C:\dev\active-projects\desktop-commander-app\desktop-commander\

# 4. Navigate INTO the extracted folder
cd desktop-commander

# 5. Verify you're in the right place
ls
# You should see: package.json, src/, src-tauri/, etc.

# 6. Allow scripts for this session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# 7. Install dependencies
npm install

# 8. Launch!
npm run tauri:dev
```

## 📁 Expected Directory Structure

```
C:\dev\active-projects\
└── desktop-commander-app\          ← You extract here
    └── desktop-commander\          ← Then cd into this
        ├── package.json
        ├── tsconfig.json
        ├── src\
        │   ├── components\
        │   └── lib\
        ├── src-tauri\
        │   ├── Cargo.toml
        │   └── src\
        └── README.md
```

## 🔴 What Went Wrong

You were in: `C:\dev\active-projects\desktop-commander-v2-fixed`

But the `package.json` is actually at: `C:\dev\active-projects\desktop-commander-v2-fixed\desktop-commander\package.json`

So you need: `cd desktop-commander` after extracting!

## 🆕 New Fixed Archive

[Download: desktop-commander-v2-final.tar.gz](computer:///mnt/user-data/outputs/desktop-commander-v2-final.tar.gz)

This includes:
- ✅ Tauri v2 compatibility
- ✅ `.npmrc` to prevent workspace issues
- ✅ All 5 enhanced features

## Alternative: Manual Commands

If you're already in the wrong directory:

```powershell
# Find where package.json actually is
Get-ChildItem -Recurse -Filter "package.json" | Select-Object FullName

# Then cd to that directory
cd "path\to\desktop-commander"

# And run
npm install
npm run tauri:dev
```

## Still Getting "workspace" Error?

If you still see the workspace error, there might be a `pnpm-workspace.yaml` or workspace configuration in a parent directory. Try:

```powershell
# Check for workspace configs
Get-ChildItem -Path C:\dev\active-projects -Recurse -Include "pnpm-workspace.yaml","package.json" | Select-Object FullName

# If you find workspace configs, either:
# 1. Extract to a completely different location (like C:\temp\desktop-commander)
# OR
# 2. Add this to package.json:
"workspaces": []
```

## Clean Start (Nuclear Option)

```powershell
# Go to a completely fresh location
cd C:\temp
mkdir desktop-commander-test
cd desktop-commander-test

# Extract desktop-commander-v2-final.tar.gz here
# cd into the extracted folder
cd desktop-commander

# Install
npm install
npm run tauri:dev
```

## Verify Installation

After `npm install` succeeds, you should see:
- `node_modules\` folder
- `package-lock.json` file

Then `npm run tauri:dev` should start compiling.

---

**Need help?** The issue is almost always being in the wrong directory. Make sure you're in the folder that contains `package.json`!
