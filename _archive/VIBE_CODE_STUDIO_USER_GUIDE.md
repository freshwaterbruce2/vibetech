# Vibe Code Studio - Complete User Guide

**Version:** 1.0.4
**Date:** November 7, 2025

---

## 🚀 Quick Start

### Step 1: Install Vibe Code Studio

**Option A: Use Existing Installer (Recommended)**
```powershell
# Run the installer
Start-Process "projects\active\desktop-apps\deepcode-editor\dist-electron\DeepCode Editor Setup 1.0.4.exe"
```

**Option B: Run Portable Version**
```powershell
# Run directly (no installation)
.\projects\active\desktop-apps\deepcode-editor\dist-electron\DeepCode Editor 1.0.4.exe
```

**Option C: Development Mode**
```powershell
cd projects\active\desktop-apps\deepcode-editor
pnpm dev
```

---

## 🔑 Step 2: Configure API Key

Vibe Code Studio uses **DeepSeek AI** for intelligent code assistance. You need to configure your API key:

### Method 1: In-App Settings (Easiest)

1. Launch Vibe Code Studio
2. Press `Ctrl+,` (or click Settings icon)
3. Navigate to **AI Provider** section
4. Enter your DeepSeek API key
5. Click **Save**

### Method 2: Environment Variable

Create a `.env` file in the project root:

```env
VITE_DEEPSEEK_API_KEY=your_api_key_here
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
VITE_DEEPSEEK_MODEL=deepseek-chat
```

### Get Your API Key

1. Visit: https://platform.deepseek.com/api_keys
2. Sign up or log in
3. Create a new API key
4. Copy and paste it into Vibe Code Studio

**Note:** The app will start without an API key, but AI features will be disabled until you configure it.

---

## 📂 Step 3: Open a Workspace

### Open a Folder

1. Click **File → Open Folder** (or `Ctrl+K Ctrl+O`)
2. Select your project folder
3. The file tree will appear in the sidebar

### Or Use Welcome Screen

When you first launch, you'll see a welcome screen:
- Click **Open Folder** to browse for a project
- Or drag and drop a folder onto the window

---

## 🎨 Basic Usage

### Editor Features

**Monaco Editor** (same as VS Code):
- Syntax highlighting for 100+ languages
- IntelliSense code completion
- Go to definition (`F12`)
- Find references (`Shift+F12`)
- Multi-cursor editing (`Alt+Click`)
- Code folding
- Minimap

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Command Palette | `Ctrl+Shift+P` |
| Open File | `Ctrl+P` |
| Save File | `Ctrl+S` |
| Save All | `Ctrl+K S` |
| Toggle Sidebar | `Ctrl+B` |
| Toggle AI Chat | `Ctrl+L` |
| Format Document | `Shift+Alt+F` |
| Find in File | `Ctrl+F` |
| Replace in File | `Ctrl+H` |
| Find in Files | `Ctrl+Shift+F` |

### File Management

- **Create File:** Right-click in file tree → New File
- **Create Folder:** Right-click in file tree → New Folder
- **Rename:** Right-click file → Rename (or `F2`)
- **Delete:** Right-click file → Delete (or `Delete` key)
- **Open File:** Double-click file in tree, or `Ctrl+P` to search

---

## 🤖 AI Features

### AI Chat Assistant

1. **Open AI Chat:** Press `Ctrl+L` or click chat icon
2. **Ask Questions:**
   - "Explain this code"
   - "How do I implement X?"
   - "What's wrong with this function?"
   - "Generate a test for this"
3. **Get Code Suggestions:** The AI understands your entire codebase context

### AI Code Completion

- **Automatic:** As you type, AI suggests completions
- **Trigger Manually:** Press `Ctrl+Space` for suggestions
- **Accept Suggestion:** Press `Tab` or `Enter`

### AI Commands (Command Palette)

Press `Ctrl+Shift+P` and type:

- **AI: Explain Code** - Get explanation of selected code
- **AI: Generate Tests** - Create unit tests
- **AI: Refactor** - Improve code structure
- **AI: Fix Bugs** - Find and fix issues
- **AI: Optimize** - Performance improvements
- **AI: Add Comments** - Document code
- **AI: Generate Component** - Create React/Vue components

### Specialized Agents

Vibe Code Studio has specialized AI agents:

- **Backend Engineer Agent** - Server-side code, APIs, databases
- **Frontend Engineer Agent** - UI, components, styling
- **Technical Lead Agent** - Architecture, best practices, code review

Select an agent in the AI chat panel for focused assistance.

---

## 🌉 Integration with NOVA Agent

### Setup IPC Bridge

1. **Start IPC Bridge Server:**
   ```powershell
   cd backend\ipc-bridge
   npm start
   ```
   You should see: `✅ IPC Bridge Server listening on ws://localhost:5004`

2. **Launch NOVA Agent:**
   ```powershell
   cd projects\active\desktop-apps\nova-agent-current
   pnpm dev
   ```

3. **Vibe Code Studio** will automatically connect to the IPC Bridge

### Features Enabled by Integration

- **Launch Files from NOVA:** NOVA can open files in Vibe Code Studio
- **Shared Learning System:** Mistakes and knowledge sync between apps
- **Context Sharing:** NOVA can send context to Vibe
- **Activity Sync:** Coding activity tracked across both apps

### Learning Panel

1. Click the **Learning** button in the status bar (bottom right)
2. View mistakes and knowledge from both NOVA and Vibe
3. See platform-specific suggestions
4. Track patterns and improvements

---

## 📊 Key Features

### 1. Multi-File Editing

- **Split View:** `Ctrl+\` to split editor
- **Tab Groups:** Drag tabs to create groups
- **Close All:** `Ctrl+K W` to close all tabs

### 2. Git Integration

- **Git Panel:** Click Git icon in sidebar
- **View Changes:** See modified files
- **Stage Changes:** Click `+` next to files
- **Commit:** Enter message and commit
- **Branch Management:** Switch branches in status bar

### 3. Search & Replace

- **Find in File:** `Ctrl+F`
- **Find in Files:** `Ctrl+Shift+F` (searches entire workspace)
- **Replace:** `Ctrl+H` (single file) or `Ctrl+Shift+H` (all files)
- **Regex Mode:** Click `.*` icon for regex search

### 4. Command Palette

Press `Ctrl+Shift+P` for quick access to:
- All commands
- File operations
- AI commands
- Settings
- Extensions (if any)

### 5. Settings

Press `Ctrl+,` to open settings:
- **Editor:** Font, theme, word wrap, etc.
- **AI Provider:** API keys, model selection
- **File Associations:** Customize file types
- **Keyboard Shortcuts:** Customize key bindings

---

## 🎯 Common Workflows

### Starting a New Project

1. Launch Vibe Code Studio
2. Click **File → New Window** (or `Ctrl+Shift+N`)
3. Click **Open Folder** and create/select project folder
4. Start coding!

### Working with Existing Code

1. Open your project folder
2. Use `Ctrl+P` to quickly open files
3. Use `Ctrl+Shift+F` to search across codebase
4. Use AI chat (`Ctrl+L`) for help understanding code

### Debugging

1. Set breakpoints by clicking left of line numbers
2. Press `F5` to start debugging
3. Use debug panel to inspect variables
4. Step through code with `F10` (step over) or `F11` (step into)

### AI-Assisted Coding

1. Select code you want to modify
2. Open AI chat (`Ctrl+L`)
3. Ask: "Refactor this to use async/await" or "Add error handling"
4. Review and apply suggestions
5. Test the changes

---

## 🔧 Troubleshooting

### App Won't Start

**Solution:**
```powershell
# Check if port 5174 is in use
netstat -ano | findstr :5174

# Kill the process if needed
taskkill /PID <PID> /F

# Try again
pnpm dev
```

### AI Features Not Working

**Check:**
1. Is API key configured? (Settings → AI Provider)
2. Is API key valid? (Test connection in settings)
3. Check console for errors (`Ctrl+Shift+I`)

### Database Errors

**Solution:** The database should auto-create. If errors occur:
```powershell
# Ensure D:\databases\ exists
New-Item -ItemType Directory -Path "D:\databases" -Force
```

### File Tree Not Showing

**Solution:**
1. Press `Ctrl+B` to toggle sidebar
2. Click folder icon in sidebar
3. Or: View → Explorer (`Ctrl+Shift+E`)

### Slow Performance

**Solutions:**
1. Close unused tabs
2. Disable AI completion if not needed
3. Restart the app
4. Check if large files are open (close them)

---

## 📝 Next Steps

### After Installation

1. ✅ **Configure API Key** - Enable AI features
2. ✅ **Open a Project** - Start coding
3. ✅ **Try AI Chat** - Ask questions about your code
4. ✅ **Set Up NOVA Integration** - Connect with NOVA Agent

### Learning More

- **Keyboard Shortcuts:** Press `Ctrl+K Ctrl+S` to see all shortcuts
- **Command Palette:** `Ctrl+Shift+P` to discover features
- **Settings:** `Ctrl+,` to customize your experience

### Advanced Features

- **Multi-Cursor Editing:** `Alt+Click` to add cursors
- **Code Folding:** Click `-` next to line numbers
- **Minimap:** Toggle in View menu
- **Zen Mode:** `Ctrl+K Z` for distraction-free coding

---

## 🎉 Tips & Tricks

### Productivity Tips

1. **Quick File Navigation:** `Ctrl+P` then type filename
2. **Go to Symbol:** `Ctrl+Shift+O` to jump to functions/classes
3. **Command History:** `Ctrl+Shift+P` remembers your recent commands
4. **Multi-Edit:** Select word, press `Ctrl+D` to select next occurrence
5. **Column Selection:** `Alt+Shift+Drag` for column selection

### AI Tips

1. **Be Specific:** "Add error handling to this function" vs "fix this"
2. **Provide Context:** Select relevant code before asking
3. **Iterate:** Ask follow-up questions to refine results
4. **Use Agents:** Select appropriate agent for better results

### Integration Tips

1. **Keep IPC Bridge Running:** Start it before launching apps
2. **Check Connection:** Look for connection status in status bar
3. **Sync Learning:** Mistakes logged in one app appear in both
4. **Launch from NOVA:** Use NOVA to open files in Vibe

---

## 📚 Additional Resources

### Documentation Files

- `QUICKSTART.md` - Quick start guide
- `WINDOWS_QUICKSTART.md` - Windows-specific guide
- `README.md` - Full documentation
- `INTEGRATION_GUIDE.md` - NOVA Agent integration

### Support

- Check console for errors: `Ctrl+Shift+I`
- Review logs in `D:\databases\` (if configured)
- Check IPC Bridge logs if integration issues

---

## ✅ Summary

**You're ready to use Vibe Code Studio!**

1. ✅ Install or run the app
2. ✅ Configure your DeepSeek API key
3. ✅ Open a project folder
4. ✅ Start coding with AI assistance
5. ✅ Connect with NOVA Agent (optional)

**Happy Coding!** 🚀
