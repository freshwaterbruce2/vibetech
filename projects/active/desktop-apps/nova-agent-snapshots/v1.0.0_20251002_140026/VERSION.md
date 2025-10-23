# NOVA Agent - Version Control

## v1.0.0-STABLE (2025-10-02)
**STATUS: WORKING ✅**

### Configuration
- **DeepSeek Integration**: Direct Rust implementation
- **Mode**: Standalone (no dev server required)
- **Build**: Tauri 2.8.5 + React 19.1.1
- **Database**: SQLite at `C:\dev\projects\nova-data\nova.db`

### Working Components
- ✅ Tauri desktop app with embedded DeepSeek API calls
- ✅ Rust backend calling DeepSeek chat completions
- ✅ Frontend React UI
- ✅ .env configuration loading
- ✅ Standalone executable

### Critical Files (DO NOT MODIFY)
- `src-tauri/src/main.rs` - DeepSeek integration
- `src-tauri/Cargo.toml` - Dependencies (reqwest, dotenv)
- `.env` - API keys
- `src-tauri/tauri.conf.json` - Build config

### Build Commands
```powershell
# Full rebuild
npm run build

# Frontend only
npm run build:frontend

# Run dev mode
npm run dev
```

### Deployment
```powershell
# Standalone executable
.\src-tauri\target\release\nova-agent.exe

# Installer
.\src-tauri\target\release\bundle\nsis\NOVA Agent_1.0.0_x64-setup.exe
```

### Environment Required
- `.env` in project root
- `.env` copied to `src-tauri/target/release/` for standalone

### Known Working State Hash
- Branch: main
- Commit: INITIAL_STABLE
- Tag: v1.0.0-stable
