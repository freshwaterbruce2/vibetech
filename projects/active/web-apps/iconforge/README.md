# IconForge - AI-Powered Icon Creation Platform

**Status**: ✅ Phase 1 MVP Complete - Fully Functional
**Version**: 1.0.0
**Launch Date**: October 2025

## Quick Access

- **Live App**: http://localhost:5174 (when running)
- **Database**: `D:\databases\database.db` (unified workspace database)

## What is IconForge?

IconForge is a fully functional web-based icon editor that enables designers and developers to create, customize, and export production-ready icons. Built with React 19, TypeScript, and Fabric.js, it provides an intuitive, user-friendly interface for rapid icon creation.

## Current Features (Phase 1 MVP - Complete)

### Canvas Editor
- Fabric.js 6.7-powered canvas with 512×512 workspace
- Real-time rendering with smooth performance
- Automatic shape selection after placement
- Intuitive drag, resize, and rotate controls

### Shape Tools (6 Total)
- Circle - Perfect circles with customizable colors
- Rectangle - Rounded rectangles with configurable radius
- Triangle - Equilateral triangles
- Star - 5-pointed stars
- Polygon - Hexagons (6-sided)
- Arrow - Right-pointing arrows with clean design

### Properties Panel
- Position controls (X, Y coordinates)
- Size controls (Width, Height)
- Rotation slider (0-360°)
- Opacity slider (0-100%)
- Layer ordering (Front, Back, Forward, Backward)
- Color pickers for fill and stroke

### Color Picker System
- 23 Material Design preset colors
- Recent colors (stores last 10 used)
- Native color input with live preview
- Separate fill and stroke color selection
- Keyboard shortcuts (C for fill, S for stroke)

### Undo/Redo System
- History stack (30 states maximum)
- Visual button indicators
- Toast notifications for actions
- Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)

### Export System
- SVG export (vector graphics)
- PNG export with 6 size options (16, 32, 64, 128, 256, 512)
- Batch export (all PNG sizes at once)
- Automatic file naming with timestamps
- Export dialog with format selection

### Layer Management
- Real-time layer list
- Visibility toggle
- Object deletion
- Layer selection
- Object count display

### User Onboarding
- Welcome overlay on first visit
- Quick Start Guide (4 steps)
- Keyboard shortcuts reference
- Empty state instructions on canvas
- Help button for guide re-access
- Visual hints throughout interface

### Keyboard Shortcuts
- **Ctrl+Z** - Undo
- **Ctrl+Y** / **Ctrl+Shift+Z** - Redo
- **Ctrl+E** - Export
- **C** - Change fill color (when object selected)
- **S** - Change stroke color (when object selected)
- **Delete** / **Backspace** - Delete selected object

## Technology Stack

### Frontend (Current Implementation)
- React 19.2.0 + TypeScript 5.9
- Vite 7.6.3 (build tool)
- Fabric.js 6.7.1 (canvas editing)
- Tailwind CSS 3.4.18 (styling)
- Radix UI (component primitives)

### Planned Backend
- Fastify 5 (2x faster than Express)
- SQLite via Prisma 6
- Socket.io 4.8 + Yjs 13.6 (real-time collaboration)
- OpenAI DALL-E 3 (AI generation)

## Getting Started

### Prerequisites
- Node.js 18+ installed
- pnpm 9.15.0+ installed

### Installation
```bash
cd C:/dev/projects/active/web-apps/iconforge
pnpm install
```

### Development
```bash
pnpm dev
```

Open http://localhost:5174 in your browser.

### First-Time Usage
1. Welcome overlay appears with Quick Start Guide
2. Close overlay to see canvas with empty state instructions
3. Click a shape tool in the left toolbar
4. Click on canvas to place shape
5. Shape is automatically selected - resize, rotate, or move it
6. Use Properties Panel on right to customize
7. Click Export button or press Ctrl+E to save

## Project Structure

```
iconforge/
├── src/
│   ├── components/
│   │   ├── CanvasEditor.tsx      # Main canvas with Fabric.js
│   │   ├── Toolbar.tsx            # Shape tool selector
│   │   ├── PropertiesPanel.tsx   # Object property editor
│   │   ├── LayerPanel.tsx         # Layer management
│   │   ├── ColorPicker.tsx        # Color selection modal
│   │   ├── ExportDialog.tsx       # Export options
│   │   ├── WelcomeOverlay.tsx     # First-time user guide
│   │   ├── Toast.tsx              # Notification system
│   │   └── Layout.tsx             # App layout shell
│   ├── hooks/
│   │   └── useHistory.ts          # Undo/redo logic
│   ├── App.tsx                    # Main app component
│   └── main.tsx                   # Entry point
├── docs/                          # Technical documentation
├── server/                        # Backend (not yet implemented)
├── README.md                      # This file
├── QUICKSTART.md                  # Setup guide
├── USER_GUIDE.md                  # Complete usage guide
└── TECHNICAL_ARCHITECTURE.md      # Architecture docs
```

## Component Architecture

### Data Flow
```
App.tsx (State Management)
├── Layout (UI Shell)
│   ├── Header (Undo/Redo/Export/Help)
│   └── Content Area
│       ├── Toolbar (Tool Selection)
│       ├── CanvasEditor (Fabric.js Canvas)
│       ├── PropertiesPanel (Object Editing)
│       └── LayerPanel (Layer Management)
├── ColorPicker (Modal)
├── ExportDialog (Modal)
├── WelcomeOverlay (Modal)
└── Toast (Notifications)
```

### Canvas State Management
- Canvas instance shared via props
- History managed by useHistory hook
- Tool state controlled by App.tsx
- Automatic tool switching after shape placement

## Integration with Workspace

### Unified Database
IconForge uses the workspace database at `D:\databases\database.db` with `iconforge_` table prefixes.

### Agent Assignment
Assigned to **webapp-expert** agent specializing in React, TypeScript, and performance optimization.

### Memory System
Workspace memory system tracks development progress and learnings.

## Commands

```bash
# Development
pnpm dev                    # Start dev server (port 5174)
pnpm build                  # Production build
pnpm preview                # Preview production build

# Quality
pnpm lint                   # ESLint check
pnpm lint:fix               # Auto-fix issues
pnpm typecheck              # TypeScript check

# Testing
pnpm test                   # Run Playwright tests
pnpm test:ui                # Test UI mode
```

## Performance

- Canvas rendering: 60 FPS target
- Initial load: < 2 seconds
- Shape creation: Instant
- Undo/Redo: < 100ms
- Export: < 1 second

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Known Limitations

### Phase 1 MVP Scope
- No text tool (planned for Phase 2)
- No line tool implementation (planned for Phase 2)
- No AI generation yet (planned for Phase 3)
- No real-time collaboration (planned for Phase 4)
- No authentication (planned for Phase 3)
- No project persistence (local only)
- No component export (planned for Phase 3)

### Technical
- Canvas size fixed at 512×512
- Maximum 30 undo history states
- Recent colors limited to 10
- Local storage only (no cloud sync)

## Future Roadmap

### Phase 2 (Next)
- Text tool with font selection
- Line tool with arrow heads
- More shape tools (pentagon, octagon)
- Custom shape creation
- Grid and snap-to-grid
- Rulers and guides

### Phase 3 (AI Integration)
- DALL-E 3 natural language generation
- Style transfer
- Icon library with search
- Template system
- User accounts with Clerk
- Project cloud storage

### Phase 4 (Collaboration)
- Real-time collaborative editing
- Comments and annotations
- Version history
- Team workspaces
- Design system integration

## Troubleshooting

### Port Already in Use
If port 5174 is occupied:
1. Check running processes: `netstat -ano | findstr :5174`
2. Kill process or change port in `vite.config.ts`

### Canvas Not Rendering
1. Clear browser cache
2. Check console for errors
3. Ensure Fabric.js loaded correctly
4. Restart dev server

### Shapes Not Appearing
1. Make sure you clicked a shape tool first (not Select)
2. Click anywhere on the white canvas area
3. Check if shape is behind another object (use Layer Panel)

## Contributing

### Code Standards
- Full TypeScript type coverage
- ESLint compliance
- Component documentation
- Anti-duplication checks
- Performance profiling for canvas operations

### Before Committing
1. Run `pnpm lint:fix`
2. Run `pnpm typecheck`
3. Test all features manually
4. Update documentation if needed

## Support

**Documentation:**
- USER_GUIDE.md - Complete feature guide
- QUICKSTART.md - Setup instructions
- TECHNICAL_ARCHITECTURE.md - System design
- docs/ - Technical deep dives

**In-App Help:**
- Click "❓ Help" button in header
- See welcome overlay for Quick Start Guide

## License

Proprietary - Part of the workspace monorepo

---

**IconForge Phase 1 MVP - Feature Complete and User-Friendly** 🎨✅

Built with React 19, TypeScript, and Fabric.js | Running on http://localhost:5174
