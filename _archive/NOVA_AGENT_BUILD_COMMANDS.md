# NOVA Agent - Build Commands

**Version:** 1.5.0
**Date:** November 7, 2025

---

## 🚀 Quick Build (Production)

### Full Production Build with Installers

```powershell
cd projects\active\desktop-apps\nova-agent-current
pnpm build
```

**This will:**
- Build frontend (Vite)
- Compile Rust backend (Cargo)
- Create MSI installer
- Create NSIS installer
- Create portable EXE

**Build Time:** ~5-10 minutes (first build may take 15-20 minutes)

**Output Location:**
- MSI: `src-tauri\target\release\bundle\msi\NOVA Agent_1.5.0_x64_en-US.msi`
- NSIS: `src-tauri\target\release\bundle\nsis\NOVA Agent_1.5.0_x64-setup.exe`
- EXE: `src-tauri\target\release\nova-agent.exe`

---

## 🔧 Alternative Build Commands

### Development Build (No Installers)

```powershell
cd projects\active\desktop-apps\nova-agent-current
pnpm dev
```

**This will:**
- Start dev server
- Launch app in development mode
- Hot reload enabled

### Frontend Only Build

```powershell
cd projects\active\desktop-apps\nova-agent-current
pnpm build:frontend
```

**This will:**
- Build only the React frontend
- Output to `dist/` folder
- No Rust compilation

### Clean Build (Fresh Start)

```powershell
cd projects\active\desktop-apps\nova-agent-current
pnpm clean
pnpm build
```

**This will:**
- Remove all build artifacts
- Rebuild from scratch
- Takes longer but ensures clean build

---

## 📦 Install After Build

### Install MSI (Recommended)

```powershell
Start-Process "projects\active\desktop-apps\nova-agent-current\src-tauri\target\release\bundle\msi\NOVA Agent_1.5.0_x64_en-US.msi"
```

### Install NSIS

```powershell
Start-Process "projects\active\desktop-apps\nova-agent-current\src-tauri\target\release\bundle\nsis\NOVA Agent_1.5.0_x64-setup.exe"
```

### Run Portable (No Install)

```powershell
.\projects\active\desktop-apps\nova-agent-current\src-tauri\target\release\nova-agent.exe
```

---

## ✅ Verify Build

### Check Build Outputs

```powershell
# Check if installers exist
Get-ChildItem "projects\active\desktop-apps\nova-agent-current\src-tauri\target\release\bundle" -Recurse -File

# Check executable
Test-Path "projects\active\desktop-apps\nova-agent-current\src-tauri\target\release\nova-agent.exe"
```

### Check Version

```powershell
# Check version in package.json
Get-Content "projects\active\desktop-apps\nova-agent-current\package.json" | Select-String "version"

# Check version in Cargo.toml
Get-Content "projects\active\desktop-apps\nova-agent-current\src-tauri\Cargo.toml" | Select-String "version"
```

---

## 🛠️ Prerequisites Check

### Before Building

```powershell
# Check Node.js version (need 18+)
node --version

# Check Rust version (need latest stable)
rustc --version

# Check Cargo version
cargo --version

# Check pnpm
pnpm --version

# Install dependencies if needed
cd projects\active\desktop-apps\nova-agent-current
pnpm install
```

---

## 🐛 Troubleshooting

### Build Fails - Missing Dependencies

```powershell
cd projects\active\desktop-apps\nova-agent-current
pnpm install
pnpm build
```

### Build Fails - Rust Issues

```powershell
# Update Rust
rustup update stable

# Clean Rust build
cd projects\active\desktop-apps\nova-agent-current\src-tauri
cargo clean
cd ..
pnpm build
```

### Build Fails - Frontend Issues

```powershell
cd projects\active\desktop-apps\nova-agent-current
pnpm clean
pnpm install
pnpm build
```

### Build Takes Too Long

```powershell
# First build always takes longer (15-20 min)
# Subsequent builds are faster (5-10 min)

# To speed up, skip frontend build if unchanged:
cd projects\active\desktop-apps\nova-agent-current\src-tauri
cargo build --release
```

---

## 📋 Complete Build Workflow

### Step-by-Step

```powershell
# 1. Navigate to project
cd projects\active\desktop-apps\nova-agent-current

# 2. Install dependencies (if needed)
pnpm install

# 3. Build production version
pnpm build

# 4. Wait for build to complete (~5-10 minutes)

# 5. Verify outputs
Get-ChildItem "src-tauri\target\release\bundle" -Recurse -File

# 6. Install (choose one)
# MSI:
Start-Process "src-tauri\target\release\bundle\msi\NOVA Agent_1.5.0_x64_en-US.msi"

# NSIS:
Start-Process "src-tauri\target\release\bundle\nsis\NOVA Agent_1.5.0_x64-setup.exe"

# Portable:
.\src-tauri\target\release\nova-agent.exe
```

---

## 🎯 One-Line Commands

### Quick Build

```powershell
cd projects\active\desktop-apps\nova-agent-current && pnpm build
```

### Build and Install MSI

```powershell
cd projects\active\desktop-apps\nova-agent-current && pnpm build && Start-Process "src-tauri\target\release\bundle\msi\NOVA Agent_1.5.0_x64_en-US.msi"
```

### Clean Build

```powershell
cd projects\active\desktop-apps\nova-agent-current && pnpm clean && pnpm build
```

---

## 📝 Notes

- **First Build:** Takes 15-20 minutes (downloads dependencies, compiles Rust)
- **Subsequent Builds:** 5-10 minutes (incremental compilation)
- **Build Size:** ~6-8 MB for executable, ~4-5 MB for installers
- **Output:** All files in `src-tauri\target\release\`

---

## ✅ Summary

**Main Command:**
```powershell
cd projects\active\desktop-apps\nova-agent-current
pnpm build
```

**That's it!** The build process will create all installers automatically.
