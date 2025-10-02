# Prompt Engineer - Vibe-Tech UI

A stunning, futuristic web interface for the Prompt Engineer tool featuring neon glassmorphism design inspired by Vibe-Tech.org's aesthetic.

![Vibe-Tech Theme](https://img.shields.io/badge/Theme-Neon%20Glassmorphism-00FFFF?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.8+-B933FF?style=for-the-badge)
![Streamlit](https://img.shields.io/badge/Streamlit-1.28+-FF00AA?style=for-the-badge)

## ✨ Features

### 🎨 Beautiful Vibe-Tech Design
- **Neon Glassmorphism UI** - Translucent cards with glowing borders
- **Animated Gradients** - Smooth color transitions (cyan → purple → pink)
- **Futuristic Dark Theme** - Deep space backgrounds with circuit patterns
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Smooth Animations** - Pulse effects, hover states, and transitions

### 🚀 Powerful Functionality
- **Project Analysis** - Scan and analyze any codebase
- **Smart Prompt Generation** - AI-ready prompts for 8+ use cases
- **Real-time Dashboard** - Live metrics and visualizations
- **Export Options** - JSON, Markdown, and comprehensive reports
- **Recent Projects** - Quick access to previously analyzed projects

### 💡 AI Prompt Templates
1. 🚀 **Add Feature** - For new functionality
2. 🔧 **Debug Issue** - For fixing problems
3. ♻️ **Refactor Code** - For code improvements
4. 🧪 **Write Tests** - For testing code
5. 🏗️ **Architecture Review** - For design discussions
6. 📝 **Documentation** - For writing docs
7. 🔒 **Security Audit** - For security reviews
8. ⚡ **Performance Optimization** - For speed improvements

## 🎯 Quick Start

### Method 1: PowerShell (Recommended)
```powershell
.\run_vibe_ui.ps1
```

### Method 2: Batch File
```batch
run_vibe_ui.bat
```

### Method 3: Direct Command
```bash
streamlit run streamlit_vibe_ui.py
```

The UI will automatically open in your default browser at `http://localhost:8501`

## 📖 Usage Guide

### Step 1: Configure Your Project
1. **Enter Project Path** in the sidebar (e.g., `C:\dev\my-project` or `.` for current directory)
2. **Set Max Files** using the slider (10-1000 files)
3. **Choose Analysis Options**:
   - ✅ Include Code Analysis
   - ✅ Include Git History
   - ✅ Include Documentation

### Step 2: Analyze
1. Navigate to the **🔍 Analyze** tab
2. Click **🚀 ANALYZE** button
3. Watch the progress bar as it scans your project
4. View results with beautiful metrics and visualizations

### Step 3: Generate Prompts
1. Switch to the **✨ Generate Prompts** tab
2. Click any template button (e.g., 🚀 Add Feature)
3. Or click **📋 Generate All Templates** for all 8 prompts
4. Copy generated prompts with one click

### Step 4: Explore Dashboard
1. Visit the **📊 Dashboard** tab
2. View project type, complexity, and maturity
3. Check code quality metrics
4. Explore technology stack details

### Step 5: Export Results
1. Go to **⚙️ Advanced** tab
2. Export as JSON, Markdown, or full report
3. Customize theme settings (coming soon)

## 🎨 Design System

### Color Palette (Vibe-Tech)
```css
--c-cyan: #00FFFF     /* Neon Blue - Primary accents */
--c-purple: #B933FF   /* Neon Purple - Secondary accents */
--c-pink: #FF00AA     /* Neon Pink - Tertiary accents */
--c-teal: #00FFCC     /* Neon Teal - Success states */
--bg-start: #05050E   /* Deep space background */
--bg-mid: #0A0A18     /* Mid-tone background */
--bg-end: #0F0F22     /* Lighter background */
```

### Typography
- **Headings**: Bold with neon glow effects
- **Body**: Clean sans-serif with high contrast
- **Code**: Monospace with glassmorphic background

### Components
- **Cards**: Translucent glass with blur effect
- **Buttons**: Gradient backgrounds with glow on hover
- **Inputs**: Glass styling with neon borders
- **Metrics**: Large numbers with animated shadows

## 🔧 Dependencies

The Vibe-Tech UI requires the following Python packages:

```
streamlit>=1.28.0
pathlib
json
datetime
```

Plus the Prompt Engineer core dependencies:
- Project Intelligence Analyzer
- Smart Prompt Generator
- Git analysis tools

## 📊 Screenshots

### Main Analysis View
Beautiful glassmorphic cards displaying project metrics with neon accents.

### Prompt Generation
Template selector with gradient buttons and expandable prompt viewers.

### Dashboard
Real-time visualizations with animated progress bars and quality metrics.

### Advanced Settings
Export options and system information with themed UI elements.

## 🎯 Use Cases

### 1. Code Review Preparation
- Analyze codebase quickly
- Generate architecture review prompts
- Export comprehensive reports

### 2. Feature Development
- Understand project structure
- Generate "Add Feature" prompts
- Get AI-ready context for implementation

### 3. Bug Fixing
- Quick project overview
- Generate "Debug Issue" prompts
- Access git history insights

### 4. Documentation Writing
- Scan project files
- Generate documentation prompts
- Export markdown summaries

### 5. Onboarding New Developers
- Visual project dashboard
- Technology stack overview
- Complexity and maturity metrics

## 🚀 Performance

### Optimized for Speed
- **Lazy Loading** - Components load on demand
- **Caching** - Analysis results cached in session
- **Progress Feedback** - Real-time progress bars
- **Efficient Scanning** - Configurable file limits

### Resource Usage
- **Memory**: ~100-200 MB typical usage
- **CPU**: Spikes during analysis, low idle
- **Network**: None (fully local)
- **Storage**: Analysis results cached temporarily

## 🔒 Security & Privacy

- ✅ **100% Local** - No data sent to external servers
- ✅ **No Telemetry** - Usage stats disabled by default
- ✅ **Safe Analysis** - Read-only file operations
- ✅ **Secure Exports** - Local file system only

## 🛠️ Troubleshooting

### UI Won't Start
```powershell
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Try manual launch
python -m streamlit run streamlit_vibe_ui.py
```

### Styling Issues
- **Clear Browser Cache** - Hard refresh with Ctrl+F5
- **Try Different Browser** - Chrome/Firefox recommended
- **Check Console** - F12 → Console tab for errors

### Analysis Fails
- **Check Path** - Ensure project path exists
- **Reduce Max Files** - Lower the slider value
- **Check Permissions** - Ensure read access to files

### Port Already in Use
```powershell
# Streamlit will auto-select another port
# Or specify custom port:
streamlit run streamlit_vibe_ui.py --server.port 8502
```

## 🎨 Customization

### Theme Variants (Coming Soon)
- Vibe-Tech (Default) - Cyan/Purple/Pink
- Cyber Purple - Deep purple tones
- Neon Blue - Ocean blue aesthetic
- Matrix Green - Classic terminal green

### Configuration Options
Located in sidebar:
- **Max Files** - Adjust analysis scope
- **Analysis Options** - Toggle code/git/docs
- **Export Format** - Choose output format

## 📈 Roadmap

### v1.1 (Next Release)
- [ ] Multiple theme support
- [ ] Dark/Light mode toggle
- [ ] Custom color presets
- [ ] Enhanced charts and graphs

### v1.2 (Future)
- [ ] Project comparison view
- [ ] Historical analysis tracking
- [ ] AI model integration
- [ ] Collaborative features

### v2.0 (Vision)
- [ ] Real-time collaboration
- [ ] Cloud sync (optional)
- [ ] Mobile app
- [ ] VS Code extension

## 🤝 Contributing

We welcome contributions to the Vibe-Tech UI!

### Areas for Improvement
1. **New Prompt Templates** - Add more AI use cases
2. **Enhanced Visualizations** - Better charts and graphs
3. **Performance Optimization** - Faster analysis
4. **Theme Variants** - Additional color schemes
5. **Documentation** - Examples and tutorials

## 📄 License

Same license as the main Prompt Engineer project.

## 💬 Support

Having issues or questions?

1. **Check Troubleshooting** section above
2. **Review Examples** in the UI
3. **Check Logs** - Terminal output for errors
4. **GitHub Issues** - Report bugs or feature requests

## 🌟 Credits

- **Design Inspiration**: Vibe-Tech.org neon glassmorphism aesthetic
- **Framework**: Streamlit for rapid UI development
- **Icons**: Lucide icons via Streamlit
- **Theme**: Custom CSS with Vibe-Tech color palette

---

## 🎉 Enjoy the Vibe-Tech Experience!

This UI transforms the Prompt Engineer from a command-line tool into a beautiful, intuitive web application. The neon glassmorphism design makes project analysis a visually stunning experience.

**Launch it now and see your code in a whole new light!** ✨

```powershell
.\run_vibe_ui.ps1
```

---

**Made with ⚡ by the Vibe-Tech community**
