# Packaging & Installation Guide: NOVA Agent & Vibe Code Studio

**Date:** November 7, 2025
**Status:** ✅ Both applications are ready to package and install

---

## 📦 Current Status

### ✅ NOVA Agent (nova-agent-current)
- **Status:** ✅ **READY TO PACKAGE**
- **Framework:** Tauri 2.0
- **Version:** 1.5.0
- **Build System:** Cargo + Tauri CLI
- **Installers Available:** MSI, NSIS, Portable EXE

### ✅ Vibe Code Studio (deepcode-editor)
- **Status:** ✅ **READY TO PACKAGE**
- **Framework:** Electron 38.4.0
- **Version:** 1.0.4
- **Build System:** Electron Builder
- **Installers Available:** NSIS, Portable, DMG, AppImage, DEB

---

## 🚀 NOVA Agent - Packaging Instructions

### Prerequisites

```powershell
# Required tools
- Rust (latest stable)
- Node.js 18+
- pnpm or npm
- Windows SDK (for Windows builds)
```

### Build Commands

#### 1. Development Build (for testing)
```powershell
cd projects/active/desktop-apps/nova-agent-current
pnpm install
pnpm dev
```

#### 2. Production Build (creates installers)
```powershell
cd projects/active/desktop-apps/nova-agent-current
pnpm build
```

**Output Location:**
- **MSI Installer:** `src-tauri/target/release/bundle/msi/NOVA Agent_1.5.0_x64_en-US.msi`
- **NSIS Installer:** `src-tauri/target/release/bundle/nsis/NOVA Agent_1.5.0_x64-setup.exe`
- **Portable EXE:** `src-tauri/target/release/nova-agent.exe`

### Installation Options

#### Option 1: MSI Installer (Recommended)
```powershell
# Double-click or run:
.\src-tauri\target\release\bundle\msi\NOVA Agent_1.5.0_x64_en-US.msi

# Or via command line:
msiexec /i "src-tauri\target\release\bundle\msi\NOVA Agent_1.5.0_x64_en-US.msi"
```

**Features:**
- ✅ Windows native installer
- ✅ Automatic uninstall support
- ✅ Start Menu integration
- ✅ Desktop shortcut option
- ✅ Default install: `C:\Program Files\NOVA Agent\`

#### Option 2: NSIS Installer
```powershell
# Double-click:
.\src-tauri\target\release\bundle\nsis\NOVA Agent_1.5.0_x64-setup.exe
```

**Features:**
- ✅ Self-extracting installer
- ✅ Custom install location
- ✅ Desktop shortcut
- ✅ Start Menu shortcut

#### Option 3: Portable Executable
```powershell
# Copy to any folder and run:
copy src-tauri\target\release\nova-agent.exe "C:\MyApps\NOVA Agent\"
```

**Features:**
- ✅ No installation required
- ✅ Run from any location
- ✅ No registry entries
- ✅ Easy to uninstall (just delete folder)

### Post-Installation Setup

After installation, configure API key:

```powershell
# Navigate to install directory
cd "C:\Program Files\NOVA Agent\"

# Run setup script (if included)
.\setup-api-key.ps1
```

**Or manually:**
1. Launch NOVA Agent
2. Go to Settings
3. Enter DeepSeek API key
4. Databases will auto-create at `D:\databases\`

---

## 🎨 Vibe Code Studio - Packaging Instructions

### Prerequisites

```powershell
# Required tools
- Node.js 18+
- pnpm or npm
- Windows SDK (for Windows builds)
```

### Build Commands

#### 1. Development Build (for testing)
```powershell
cd projects/active/desktop-apps/deepcode-editor
pnpm install
pnpm dev
```

#### 2. Production Build (Windows)
```powershell
cd projects/active/desktop-apps/deepcode-editor
pnpm electron:build:win
```

**Output Location:**
- **NSIS Installer:** `dist-electron/Vibe Code Studio-1.0.4-win-x64.exe`
- **Portable:** `dist-electron/Vibe Code Studio-1.0.4-portable.exe`

#### 3. Production Build (All Platforms)
```powershell
pnpm package:all
```

**Outputs:**
- **Windows:** NSIS installer + Portable
- **macOS:** DMG + ZIP
- **Linux:** AppImage + DEB

#### 4. Directory Build (for testing)
```powershell
pnpm package
```

**Output:** Unpacked application in `dist-electron/win-unpacked/`

### Installation Options

#### Option 1: NSIS Installer (Windows)
```powershell
# Double-click:
.\dist-electron\Vibe Code Studio-1.0.4-win-x64.exe
```

**Features:**
- ✅ Custom install location
- ✅ Desktop shortcut
- ✅ Start Menu shortcut
- ✅ File associations (if configured)

#### Option 2: Portable (Windows)
```powershell
# Extract and run:
.\dist-electron\Vibe Code Studio-1.0.4-portable.exe
```

**Features:**
- ✅ No installation required
- ✅ Run from any location
- ✅ No registry entries

#### Option 3: macOS DMG
```powershell
# Double-click DMG file
open "dist-electron/Vibe Code Studio-1.0.4-mac-x64.dmg"
# Drag to Applications folder
```

#### Option 4: Linux AppImage
```bash
# Make executable and run
chmod +x "Vibe Code Studio-1.0.4-linux-x64.AppImage"
./Vibe Code Studio-1.0.4-linux-x64.AppImage
```

---

## 📋 Build Configuration Details

### NOVA Agent Configuration

**File:** `projects/active/desktop-apps/nova-agent-current/src-tauri/tauri.conf.json`

**Key Settings:**
- Product Name: "NOVA Agent"
- Version: 1.5.0
- Bundle ID: `com.nova.agent`
- Windows Targets: MSI, NSIS
- Icon: `icons/icon.ico`

### Vibe Code Studio Configuration

**File:** `projects/active/desktop-apps/deepcode-editor/electron-builder.json`

**Key Settings:**
- Product Name: "Vibe Code Studio"
- Version: 1.0.4
- App ID: `com.vibetech.vibe-code-studio`
- Windows Targets: NSIS, Portable
- macOS Targets: DMG, ZIP
- Linux Targets: AppImage, DEB

---

## 🔧 Build Scripts Reference

### NOVA Agent Scripts

```json
{
  "dev": "tauri dev",                    // Development mode
  "build": "tauri build",                // Production build
  "build:frontend": "vite build"         // Frontend only
}
```

### Vibe Code Studio Scripts

```json
{
  "dev": "electron-vite dev",                           // Development mode
  "build": "electron-vite build",                       // Build only
  "electron:build": "electron-vite build && electron-builder",  // Full build
  "electron:build:win": "... && electron-builder --win",        // Windows only
  "electron:build:mac": "... && electron-builder --mac",        // macOS only
  "electron:build:linux": "... && electron-builder --linux",     // Linux only
  "package": "electron-vite build && electron-builder --dir",   // Unpacked
  "package:all": "... && electron-builder --win --mac --linux"  // All platforms
}
```

---

## ✅ Pre-Build Checklist

### NOVA Agent
- [x] Dependencies installed (`pnpm install`)
- [x] API key configured (optional, can be set post-install)
- [x] Database paths configured (`D:\databases\`)
- [x] Icons present (`src-tauri/icons/icon.ico`)
- [x] Tauri config valid (`tauri.conf.json`)

### Vibe Code Studio
- [x] Dependencies installed (`pnpm install`)
- [x] Electron builder config valid (`electron-builder.json`)
- [x] Icons present (`electron/assets/icon.ico`)
- [x] Build output directory exists (`dist-electron/`)

---

## 🎯 Quick Start Commands

### Build Both Applications

```powershell
# NOVA Agent
cd projects/active/desktop-apps/nova-agent-current
pnpm build

# Vibe Code Studio
cd projects/active/desktop-apps/deepcode-editor
pnpm electron:build:win
```

### Install Both Applications

```powershell
# NOVA Agent (MSI)
Start-Process "projects\active\desktop-apps\nova-agent-current\src-tauri\target\release\bundle\msi\NOVA Agent_1.5.0_x64_en-US.msi"

# Vibe Code Studio (NSIS)
Start-Process "projects\active\desktop-apps\deepcode-editor\dist-electron\Vibe Code Studio-1.0.4-win-x64.exe"
```

---

## 📦 Output File Locations

### NOVA Agent Build Outputs

```
projects/active/desktop-apps/nova-agent-current/
└── src-tauri/
    └── target/
        └── release/
            ├── nova-agent.exe                    # Portable executable
            └── bundle/
                ├── msi/
                │   └── NOVA Agent_1.5.0_x64_en-US.msi
                └── nsis/
                    └── NOVA Agent_1.5.0_x64-setup.exe
```

### Vibe Code Studio Build Outputs

```
projects/active/desktop-apps/deepcode-editor/
└── dist-electron/
    ├── Vibe Code Studio-1.0.4-win-x64.exe       # NSIS installer
    ├── Vibe Code Studio-1.0.4-portable.exe      # Portable
    ├── win-unpacked/                             # Unpacked directory
    ├── mac/                                      # macOS builds
    └── linux-unpacked/                           # Linux builds
```

---

## 🔍 Verification Steps

### After Building NOVA Agent

1. **Check MSI Installer:**
   ```powershell
   Test-Path "src-tauri\target\release\bundle\msi\NOVA Agent_1.5.0_x64_en-US.msi"
   ```

2. **Check Executable:**
   ```powershell
   Test-Path "src-tauri\target\release\nova-agent.exe"
   ```

3. **Test Run:**
   ```powershell
   .\src-tauri\target\release\nova-agent.exe
   ```

### After Building Vibe Code Studio

1. **Check Installer:**
   ```powershell
   Test-Path "dist-electron\Vibe Code Studio-1.0.4-win-x64.exe"
   ```

2. **Check Unpacked:**
   ```powershell
   Test-Path "dist-electron\win-unpacked\Vibe Code Studio.exe"
   ```

3. **Test Run:**
   ```powershell
   .\dist-electron\win-unpacked\Vibe Code Studio.exe
   ```

---

## 🐛 Troubleshooting

### NOVA Agent Build Issues

**Issue:** Rust compilation errors
```powershell
# Solution: Update Rust
rustup update stable
cargo clean
pnpm build
```

**Issue:** Missing Windows SDK
```powershell
# Solution: Install Visual Studio Build Tools
# Or use: rustup target add x86_64-pc-windows-msvc
```

**Issue:** Tauri CLI not found
```powershell
# Solution: Install Tauri CLI
pnpm add -D @tauri-apps/cli
```

### Vibe Code Studio Build Issues

**Issue:** Electron Builder errors
```powershell
# Solution: Clear cache and rebuild
pnpm clean
pnpm install
pnpm electron:build:win
```

**Issue:** Missing icons
```powershell
# Solution: Ensure icons exist
Test-Path "electron/assets/icon.ico"
# If missing, create or download icons
```

**Issue:** Build timeout
```powershell
# Solution: Increase timeout or build in stages
# Build frontend first:
pnpm build
# Then package:
pnpm electron:build:win
```

---

## 📝 Notes

### Code Signing (Optional)

Both applications can be code-signed for distribution:

**NOVA Agent (Tauri):**
- Configure in `tauri.conf.json` → `bundle.windows.certificateThumbprint`

**Vibe Code Studio (Electron):**
- Configure in `electron-builder.json` → `win.certificateFile`

### Auto-Updates (Future)

Both applications support auto-updates:
- **NOVA Agent:** Via Tauri updater
- **Vibe Code Studio:** Via electron-updater

### Distribution

**Recommended Distribution:**
- **NOVA Agent:** MSI installer (Windows standard)
- **Vibe Code Studio:** NSIS installer (Windows) or DMG (macOS)

---

## ✅ Summary

**Both applications are ready to package and install:**

1. ✅ **NOVA Agent** - Build with `pnpm build`, installers in `src-tauri/target/release/bundle/`
2. ✅ **Vibe Code Studio** - Build with `pnpm electron:build:win`, installers in `dist-electron/`

**Both have:**
- ✅ Production-ready build configurations
- ✅ Multiple installer formats
- ✅ Portable executable options
- ✅ Cross-platform support (where applicable)

**Ready to distribute!** 🚀
