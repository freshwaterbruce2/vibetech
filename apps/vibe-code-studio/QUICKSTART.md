# 🚀 Vibe Code Studio - Quick Start Guide

## ✅ Fixed Issues (2025-11-07)

1. **Electron Binary**: Installed and working
2. **API Key Validation**: Now gracefully handles missing API keys
3. **Database Date Conversion**: Fixed `toISOString()` errors

## 🔑 API Key Configuration

Vibe Code Studio uses DeepSeek AI for intelligent code assistance. To enable AI features:

### Option 1: Environment Variables (Recommended for Development)

Create a `.env` file in the project root:

```bash
REACT_APP_DEEPSEEK_API_KEY=your_api_key_here
REACT_APP_DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
REACT_APP_DEEPSEEK_MODEL=deepseek-chat
```

### Option 2: In-App Settings (Recommended for Production)

1. Launch Vibe Code Studio
2. Open Settings (Ctrl+,)
3. Navigate to AI Provider settings
4. Enter your DeepSeek API key
5. The key will be securely stored using the system keychain

### Get Your API Key

1. Visit: https://platform.deepseek.com/api_keys
2. Sign up or log in
3. Create a new API key
4. Copy and paste it into your configuration

## 🎯 Running the Application

### Development Mode

```powershell
# Start the development server
npm run dev
```

This will:
- Build the Electron main process
- Build the preload scripts
- Start the Vite dev server on http://localhost:5174
- Launch the Electron application

### Production Build

```powershell
# Build for production
npm run build:electron

# Or create distributable
npm run package
```

## 🔧 Troubleshooting

### Issue: "Electron uninstall" Error

**Solution**: Run `npm rebuild electron` to download the Electron binary.

### Issue: "Invalid DeepSeek API key format"

**Solution**:
- The app will now start without an API key (AI features disabled)
- Configure your API key in Settings once the app is running
- Or add it to your `.env` file before starting

### Issue: Database Date Errors

**Solution**: Fixed in the latest version. The database now properly handles date conversions.

### Issue: Port 5174 Already in Use

**Solution**:
```powershell
# Find and kill the process using port 5174
netstat -ano | findstr :5174
taskkill /PID <PID> /F
```

## 🌉 Integration with NOVA Agent

Vibe Code Studio can communicate with NOVA Agent via the IPC Bridge:

1. **Start IPC Bridge** (if not already running):
   ```powershell
   cd C:\dev\backend\ipc-bridge
   npm start
   ```

2. **Start Vibe Code Studio**:
   ```powershell
   cd C:\dev\projects\active\desktop-apps\deepcode-editor
   npm run dev
   ```

3. **Start NOVA Agent**:
   ```powershell
   cd C:\dev\projects\active\desktop-apps\nova-agent-current
   cargo tauri dev
   ```

Both applications will automatically connect to the IPC Bridge on port 5004.

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Electron Binary | ✅ Installed | 209 MB, version 38.4.0 |
| Dev Server | ✅ Running | Port 5174 |
| API Key Validation | ✅ Fixed | Graceful degradation |
| Database Service | ✅ Fixed | Date conversion working |
| IPC Bridge | ✅ Ready | Port 5004 |
| NOVA Integration | ⏸️ Ready | Awaiting NOVA startup |

## 🎨 Features

- **Monaco Editor**: Full VS Code editing experience
- **AI Code Completion**: Powered by DeepSeek
- **Multi-Agent System**: Specialized agents for different tasks
- **Git Integration**: Built-in version control
- **File System**: Virtual file tree with search
- **Command Palette**: Quick access to all features (Ctrl+Shift+P)
- **Learning System**: Tracks patterns and mistakes
- **NOVA Integration**: Seamless communication with NOVA Agent

## 📝 Next Steps

1. ✅ Configure your DeepSeek API key
2. ✅ Open a workspace folder
3. ✅ Start coding with AI assistance
4. ⏸️ Launch NOVA Agent for full integration

Enjoy coding with Vibe Code Studio! 🎉
