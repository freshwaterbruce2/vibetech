# Changelog

All notable changes to IconForge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-13

### Added - Phase 1 MVP Complete

#### Canvas Editor
- Fabric.js 6.7.1 integration with 512×512 workspace
- Real-time canvas rendering at 60 FPS target
- Smooth drag, resize, and rotate controls
- Empty state instructions for first-time users
- Status bar with object count and active tool display
- Automatic shape selection after placement
- Anti-duplicate shape creation mechanism

#### Shape Tools
- **Circle Tool** - Perfect circles with 50px default radius
- **Rectangle Tool** - Rounded rectangles (100×80px, 8px radius)
- **Triangle Tool** - Equilateral triangles (100×100px)
- **Star Tool** - 5-pointed stars with dual-radius design
- **Polygon Tool** - Hexagons (6-sided, 50px radius)
- **Arrow Tool** - Right-pointing arrows with clean design
- **Select Tool** - Click to select, drag to move/resize/rotate
- Automatic tool switching to Select after shape placement
- Helper functions for star and polygon point generation

#### Properties Panel
- Position controls (X, Y coordinates with pixel precision)
- Size controls (Width, Height with real-time updates)
- Rotation slider (0-360° with visual feedback)
- Opacity slider (0-100% with preview)
- Layer order controls:
  - Bring to Front (⬆️)
  - Send to Back (⬇️)
  - Bring Forward (↑)
  - Send Backward (↓)
- Color picker buttons for Fill and Stroke
- Empty state message ("Select an object")
- Real-time property synchronization

#### Color Picker System
- Modal color picker with backdrop
- Native HTML color input with live preview
- Hex color input field for exact values
- 23 Material Design preset colors
- Recent colors grid (stores last 10 colors)
- LocalStorage persistence for recent colors
- Separate Fill (C) and Stroke (S) modes
- Keyboard shortcut hints displayed
- Auto-close on color selection

#### Undo/Redo System
- History stack with 30-state maximum
- State serialization using Fabric.js toJSON()
- Undo button with disabled state indication
- Redo button with disabled state indication
- Toast notifications for user feedback
- Keyboard shortcuts:
  - Ctrl+Z (Undo)
  - Ctrl+Y (Redo)
  - Ctrl+Shift+Z (Redo alternative)
- Automatic state saving on:
  - Object added
  - Object removed
  - Object modified
  - Property changed
- Initial state capture on canvas creation
- Prevents state saves during undo/redo operations

#### Export System
- Export dialog with format selection (PNG/SVG)
- PNG export with 6 size options:
  - 16×16px
  - 32×32px
  - 64×64px
  - 128×128px
  - 256×256px
  - 512×512px
- SVG export (vector graphics)
- Batch export ("Export All Sizes" button)
- Automatic file naming with timestamps
- Export preview (format-specific)
- Quality control (PNG: 100% quality)
- Proper canvas scaling for PNG sizes
- 200ms delay between batch downloads
- Error handling with user-friendly alerts

#### Layer Management
- Real-time layer list with reverse stacking order
- Layer type display (circle, rectangle, etc.)
- Visibility toggle (👁️ / 👁️‍🗨️)
- Layer selection (click to select on canvas)
- Delete layer button (🗑️)
- Selected layer highlight (blue background)
- Empty state message ("No layers yet")
- Layer count display in status bar
- Automatic updates on object add/remove/modify
- Selection sync with canvas events

#### User Onboarding
- Welcome overlay on first visit
- Quick Start Guide with 4 numbered steps:
  1. Select a shape tool
  2. Click on canvas to add shape
  3. Customize your shape
  4. Export your icon
- Keyboard shortcuts reference card (6 shortcuts)
- "Get Started" button to close overlay
- LocalStorage persistence (shows once)
- Help button (❓) in header to re-show guide
- Empty canvas state with visual instructions
- Pointing hand emoji directing to toolbar
- Example shape icons (Circle, Rectangle, Star)
- Clear step-by-step text instructions

#### Keyboard Shortcuts
- **Ctrl+Z** - Undo last action
- **Ctrl+Y** - Redo action
- **Ctrl+Shift+Z** - Redo action (alternative)
- **Ctrl+E** - Open export dialog
- **Delete / Backspace** - Delete selected object
- **C** - Open fill color picker (when object selected)
- **S** - Open stroke color picker (when object selected)
- Input field detection (disables shortcuts while typing)
- Object selection check for C/S shortcuts
- Toast notifications for delete action

#### UI Components
- Layout component with header and content area
- Toolbar with tool icons and labels (20px wide)
- Improved tool buttons with hover effects and scale animation
- Active tool highlighting (blue background + shadow)
- Tool labels under icons for clarity
- Toast notification system with fade-in animation
- 2-second auto-dismiss
- Bottom-center positioning
- Responsive design with Tailwind CSS 3.4.18
- shadcn/ui component patterns

#### Technical Infrastructure
- React 19.2.0 with TypeScript 5.9
- Vite 7.6.3 build system
- Fabric.js 6.7.1 for canvas operations
- Tailwind CSS 3.4.18 (locked version)
- ESLint + TypeScript configuration
- Hot Module Replacement (HMR)
- Component-based architecture
- Custom hooks:
  - useHistory (undo/redo logic)
- Ref-based canvas management
- Event listener cleanup
- LocalStorage utilities
- Performance optimization with refs

#### Documentation
- README.md - Complete project overview
- USER_GUIDE.md - Comprehensive usage guide (11 sections)
- QUICKSTART.md - 5-minute setup guide
- CHANGELOG.md - This file
- TECHNICAL_ARCHITECTURE.md - System design
- In-code TypeScript documentation
- Component prop documentation
- Helper function documentation

### Changed
- Toolbar width increased from 16px to 20px for better readability
- Tool buttons now show labels under icons
- Canvas state management moved to App.tsx root
- Tool automatically switches to Select after placing shape
- Properties Panel updates in real-time
- Status bar highlights active tool in blue

### Fixed
- Multiple shapes being created simultaneously (debounce mechanism)
- Tool not switching after shape placement
- Canvas ref sharing between components
- Delete key not working
- Color picker not showing current object colors
- Layer panel not updating on object changes
- Undo/Redo not working properly
- Export dialog timeout issues

### Security
- Input sanitization in color hex field
- LocalStorage key namespacing (iconforge_ prefix)
- No external API calls (frontend-only)
- Secure color validation

### Performance
- Debounced shape creation (100ms)
- History state serialization optimized
- Canvas rendering throttled to 60 FPS
- Event listener proper cleanup
- Ref-based state to prevent unnecessary re-renders
- Lazy loading for modal components

### Known Limitations
- Canvas size fixed at 512×512px
- Maximum 30 undo history states
- Recent colors limited to 10
- No project persistence (local only)
- No cloud storage
- No multi-canvas support
- LocalStorage only (no database)

### Dependencies
- react@19.2.0
- typescript@5.9.2
- fabric@6.7.1
- vite@7.6.3
- tailwindcss@3.4.18
- @radix-ui/* (various UI primitives)
- Total: 87 npm packages

## [Unreleased] - Future Phases

### Planned for Phase 2
- Text tool with font selection
- Line tool with arrow heads
- More shape tools (pentagon, octagon)
- Custom path drawing
- Grid and snap-to-grid
- Rulers and measurement guides
- More export formats (ICO, ICNS)
- Image import capability
- Gradient fills
- Pattern fills

### Planned for Phase 3
- DALL-E 3 AI icon generation
- Icon library with search
- Template system
- User authentication (Clerk)
- Project cloud storage
- Component export (React, Vue, HTML)
- Style transfer
- Icon optimization tools
- Accessibility checker

### Planned for Phase 4
- Real-time collaboration (Socket.io + Yjs)
- Team workspaces
- Version history
- Comments and annotations
- Design system integration
- Component library export
- API access for automation
- Plugin system

---

## Version History Summary

- **1.0.0** (2025-10-13) - Phase 1 MVP Complete - Fully Functional Icon Editor
  - 6 shape tools
  - Complete properties panel
  - Color picker system
  - Undo/Redo (30 states)
  - Export to PNG/SVG
  - Layer management
  - User onboarding
  - Keyboard shortcuts

---

## Migration Guide

### From Planning to 1.0.0

No migration needed - this is the first release.

### Future Migration Notes

When backend is added (Phase 3):
- Projects will migrate from localStorage to cloud database
- User accounts will be required for cloud features
- API keys needed for AI generation

---

## Support

For questions or issues:
- Read USER_GUIDE.md for complete feature documentation
- Check QUICKSTART.md for setup help
- Review TECHNICAL_ARCHITECTURE.md for system design
- Click "❓ Help" button in app for Quick Start Guide

---

**IconForge 1.0.0 - Phase 1 MVP Complete** 🎨✅

Built with React 19, TypeScript, and Fabric.js
