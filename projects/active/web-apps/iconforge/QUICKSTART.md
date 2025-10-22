# IconForge - Quick Start Guide

> **Last Updated**: October 2025
> **Current Status**: Phase 1 MVP Complete - Frontend Only
> **Time to Launch**: < 5 minutes
> **Prerequisites**: Node.js 18+, pnpm 9+

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running IconForge](#running-iconforge)
4. [First-Time Usage](#first-time-usage)
5. [Verify Installation](#verify-installation)
6. [Next Steps](#next-steps)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

```bash
# Check versions
node --version    # Should be v18.0.0 or higher
pnpm --version    # Should be 9.0.0 or higher
```

### Install Required Tools (if needed)

**Node.js 18+:**
- Windows: Download from https://nodejs.org/
- Mac/Linux: Use nvm
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  nvm install 18
  nvm use 18
  ```

**pnpm:**
```bash
npm install -g pnpm@9.15.0
```

---

## Installation

### 1. Navigate to IconForge Directory

```bash
cd C:/dev/projects/active/web-apps/iconforge
```

### 2. Install Dependencies

```bash
pnpm install
```

**What gets installed:**
- React 19.2.0
- TypeScript 5.9
- Fabric.js 6.7.1
- Tailwind CSS 3.4.18
- Vite 7.6.3
- 87 total packages

**Installation time:** ~2-3 minutes (depending on internet speed)

---

## Running IconForge

### Start Development Server

```bash
pnpm dev
```

**Expected output:**
```
VITE v7.6.3  ready in 340 ms

➜  Local:   http://localhost:5174/
➜  Network: use --host to expose
```

### Open in Browser

Navigate to: **http://localhost:5174**

**The app loads with:**
1. Welcome overlay (first time only)
2. Canvas editor with empty state instructions
3. Tool toolbar on left
4. Properties and Layers panels on right

---

## First-Time Usage

### Welcome Overlay

On first visit, you'll see the Welcome Overlay with:
- Quick Start Guide (4 steps)
- Keyboard shortcuts reference
- "Get Started" button

**Close the overlay** to begin using IconForge.

### Create Your First Icon

1. **Select a Shape Tool** (left toolbar)
   - Click Circle (⭕), Rectangle (▭), or Star (⭐)
   - Tool name highlights in blue

2. **Place the Shape**
   - Click anywhere on the white canvas
   - Shape appears instantly
   - Tool auto-switches to Select

3. **Customize**
   - Shape is automatically selected (blue handles)
   - Drag to move, resize, or rotate
   - Use Properties Panel (right side) for precise control

4. **Export**
   - Click "Export" button in header
   - Choose PNG or SVG
   - Select size (for PNG)
   - Click "Export PNG" or "Export SVG"

**Congratulations!** You've created your first icon.

---

## Verify Installation

### Check That Everything Works

**Canvas Rendering:**
- [ ] Canvas displays (512×512 white area)
- [ ] Empty state message visible
- [ ] Status bar shows "Objects: 0"

**Tool Selection:**
- [ ] Click Circle tool
- [ ] Tool highlights in blue
- [ ] Status bar shows "Tool: circle"

**Shape Creation:**
- [ ] Click on canvas
- [ ] Circle appears
- [ ] Tool switches to "select"
- [ ] Blue handles appear around circle

**Properties Panel:**
- [ ] Properties Panel shows shape details
- [ ] Position, Size, Rotation sliders work
- [ ] Fill/Stroke buttons clickable

**Export:**
- [ ] Click Export button
- [ ] Dialog opens
- [ ] PNG/SVG selection works
- [ ] Export button downloads file

### All Checks Pass?

✅ **IconForge is ready to use!**

### Something Not Working?

See [Troubleshooting](#troubleshooting) below.

---

## Next Steps

### Learn the Features

**Read the documentation:**
- **USER_GUIDE.md** - Complete feature guide
- **README.md** - Overview and features
- **TECHNICAL_ARCHITECTURE.md** - System design

### Try Advanced Features

1. **Undo/Redo**
   - Create multiple shapes
   - Press Ctrl+Z to undo
   - Press Ctrl+Y to redo

2. **Color Picker**
   - Select a shape
   - Press C for fill color
   - Press S for stroke color
   - Choose from presets or recent colors

3. **Layer Management**
   - Create multiple shapes
   - Use Layer Panel to reorder
   - Toggle visibility
   - Delete layers

4. **Export Options**
   - Try PNG at different sizes
   - Export as SVG for vector graphics
   - Use "Export All Sizes" for batch export

### Explore Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+E | Export |
| C | Fill color picker |
| S | Stroke color picker |
| Delete | Delete selected |

---

## Troubleshooting

### Port 5174 Already in Use

**Error:** `Port 5174 is already in use`

**Solution 1: Kill existing process**
```bash
# Windows
netstat -ano | findstr :5174
taskkill /PID [PID_NUMBER] /F

# Mac/Linux
lsof -ti:5174 | xargs kill -9
```

**Solution 2: Change port**
1. Edit `vite.config.ts`
2. Change `server.port` to different number (e.g., 5175)
3. Restart dev server

### Canvas Not Appearing

**Symptoms:**
- Blank white screen
- Console errors about Fabric.js

**Solutions:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Try different browser
4. Check console for errors

**If error persists:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
pnpm dev
```

### Shapes Not Creating

**Symptoms:**
- Click on canvas but nothing happens
- Tool doesn't highlight

**Solutions:**
1. Make sure you clicked a shape tool first (not Select)
2. Click on the white canvas area (not gray background)
3. Check if shape is created but outside visible area (use Ctrl+Z)
4. Refresh browser (F5)

### Properties Panel Empty

**Symptoms:**
- "Select an object" message
- Shape appears selected but panel is empty

**Solutions:**
1. Click directly on the shape
2. Wait 1 second for state to update
3. Try selecting from Layer Panel instead
4. Refresh browser if issue persists

### Export Not Working

**Symptoms:**
- Export button does nothing
- File doesn't download

**Solutions:**
1. Check browser's download settings
2. Allow downloads from localhost
3. Try different format (PNG vs SVG)
4. Check browser console for errors
5. Make sure at least one shape exists on canvas

### Welcome Overlay Won't Appear

**To re-show:**
1. Click "❓ Help" button in header
2. Or clear localStorage:
   - Open Developer Tools (F12)
   - Go to Application → Local Storage
   - Delete `iconforge_welcome_seen` key
   - Refresh page

### Installation Fails

**Error:** `Cannot find module 'fabric'` or similar

**Solution:**
```bash
# Clear cache and reinstall
pnpm store prune
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install --force
```

### TypeScript Errors

**Error:** Red squiggly lines in code

**Solution:**
```bash
# Regenerate type definitions
pnpm typecheck

# If errors persist, restart VS Code
```

---

## Additional Help

### In-App Help
- Click "❓ Help" button anytime
- Welcome overlay re-appears with Quick Start Guide

### Documentation
- **USER_GUIDE.md** - Complete usage instructions
- **README.md** - Features and overview
- **docs/** - Technical documentation

### Development Server
- **Frontend**: http://localhost:5174
- **Hot reload**: Enabled (changes appear instantly)
- **Console**: Check browser Developer Tools (F12)

---

## What's Not Included (Yet)

IconForge Phase 1 MVP is **frontend-only**. The following features are planned but not yet implemented:

### Not Available:
- ❌ Backend API server
- ❌ Database connectivity
- ❌ User authentication
- ❌ Project saving/loading
- ❌ AI icon generation
- ❌ Real-time collaboration
- ❌ Text tool
- ❌ Line tool
- ❌ Cloud storage

### Coming in Future Phases:
- **Phase 2**: Text tool, Line tool, more shapes, grid system
- **Phase 3**: AI generation, cloud save, user accounts
- **Phase 4**: Real-time collaboration, teams, version history

---

## System Requirements

### Minimum:
- **OS**: Windows 10, macOS 10.15, Ubuntu 20.04
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **RAM**: 4 GB
- **Disk**: 500 MB free space

### Recommended:
- **OS**: Windows 11, macOS 12+, Ubuntu 22.04
- **Browser**: Latest Chrome or Edge
- **RAM**: 8 GB
- **Disk**: 1 GB free space

---

**IconForge is ready to use!** 🎨

Open http://localhost:5174 and start creating icons.
