# Streamlit UI Guide - Prompt Engineer

## 🚀 Quick Start

The easiest way to use the Prompt Engineer tool!

### **Windows Users**
```powershell
# Option 1: Double-click the batch file
run_streamlit_ui.bat

# Option 2: PowerShell (recommended)
.\run_streamlit_ui.ps1

# Option 3: Direct command
streamlit run streamlit_ui.py
```

### **Access the Interface**
- Opens automatically in your default browser
- If not, go to: `http://localhost:8501`
- Works in Chrome, Firefox, Safari, Edge

## 🎯 How to Use

### **Step 1: Select Your Project** 
- **Sidebar** → Enter your project path
- Use recent projects dropdown if available
- Example: `C:\dev\projects\my-react-app`

### **Step 2: Configure Analysis**
- **Max Files Slider**: Limit analysis for large projects (10-500 files)
- **Save Context File**: Keep analysis data for later use
- Click **🔍 Analyze Project**

### **Step 3: Choose Templates**
Pick the type of prompt you need:

- **🚀 Add Feature** - For new functionality
- **🔧 Debug Issue** - For fixing problems  
- **♻️ Refactor Code** - For code improvements
- **🧪 Write Tests** - For testing code
- **🏗️ Architecture** - For design discussions

Or click **📋 Generate All Templates**

### **Step 4: Copy & Use**
- Generated prompts appear below
- Click **📋 Copy** button for any prompt
- Paste directly into Claude, ChatGPT, or your AI assistant

## ✨ Features

### **Visual Interface**
- Clean, modern design
- Template cards with icons
- Real-time project analysis
- Expandable prompt sections

### **Smart Project Management**
- Recent projects history (last 10)
- Automatic context saving
- File count and analysis stats
- Progress indicators

### **Easy Copy-Paste Workflow**
- One-click copying
- Formatted markdown prompts
- Ready for AI assistants
- No command line needed

### **Windows Integration**
- Double-click batch launcher
- PowerShell script with dependency checking
- Automatic browser opening
- Clean shutdown with Ctrl+C

## 🛠 Troubleshooting

### **Common Issues**

**Browser doesn't open:**
- Go manually to `http://localhost:8501`
- Try a different browser
- Check Windows firewall settings

**Import errors:**
```powershell
# Install dependencies
.\run_streamlit_ui.ps1 -Install
# Or manually:
pip install -r requirements.txt
```

**Port already in use:**
- Close other Streamlit instances
- Streamlit automatically finds available ports
- Check for other apps using port 8501

**Analysis fails:**
- Check project path exists
- Ensure proper permissions
- Try reducing max files limit
- Check for very large files

### **Performance Tips**

**For Large Projects:**
- Reduce max files (50-100 for very large codebases)
- Close other browser tabs
- Use recent projects for faster access

**For Better Experience:**
- Use full-screen browser mode
- Enable browser notifications
- Keep the interface open for multiple analyses

## 📝 Example Workflow

1. **Start the UI**: `.\run_streamlit_ui.ps1`
2. **Enter project path**: `C:\dev\projects\my-trading-bot`
3. **Set max files**: 150 (for medium project)
4. **Click analyze**: Wait for green success message
5. **Choose template**: Click **🔧 Debug Issue**
6. **Copy prompt**: Click **📋 Copy Debug Issue Prompt**
7. **Use in AI**: Paste into Claude with your specific issue

The AI will now understand your project's architecture, tech stack, and patterns!

## 🔄 Comparison with CLI

### **Streamlit UI Advantages:**
- Visual template selection
- Easy project switching
- One-click copying
- No command line knowledge needed
- Progress feedback
- Recent projects history

### **Command Line Advantages:**
- Faster for power users
- Scriptable/automatable
- Smaller resource usage
- Better for CI/CD integration

**Recommendation:** Use Streamlit UI for daily work, CLI for automation.