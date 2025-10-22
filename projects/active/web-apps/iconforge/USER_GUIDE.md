# IconForge User Guide

Complete guide to using IconForge - the user-friendly icon creation tool.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Creating Your First Icon](#creating-your-first-icon)
3. [Shape Tools](#shape-tools)
4. [Editing Shapes](#editing-shapes)
5. [Using the Properties Panel](#using-the-properties-panel)
6. [Color Management](#color-management)
7. [Layer Management](#layer-management)
8. [Undo/Redo](#undoredo)
9. [Exporting Icons](#exporting-icons)
10. [Keyboard Shortcuts](#keyboard-shortcuts)
11. [Tips & Tricks](#tips--tricks)

---

## Getting Started

### Launching IconForge

1. Open your browser to http://localhost:5174
2. Welcome overlay appears automatically on first visit
3. Read the Quick Start Guide (4 steps)
4. Click "Get Started" to begin

### Interface Overview

**Header** (Top)
- **Help Button** (❓) - Re-show welcome guide
- **Undo/Redo Buttons** - Step backward/forward in history
- **Export Button** - Save your icon

**Left Sidebar** - Tool selector with 9 tools
**Center Area** - 512×512 canvas workspace
**Right Sidebar** - Properties Panel and Layers Panel

---

## Creating Your First Icon

### Step-by-Step

1. **Select a Shape Tool**
   - Click any shape icon in the left toolbar
   - Tool name highlights in blue
   - Status bar shows "Tool: [shape name]"

2. **Place the Shape**
   - Click anywhere on the white canvas
   - Shape appears at click location
   - Tool automatically switches to "Select"
   - Shape is immediately selected (blue handles visible)

3. **Customize**
   - Drag shape to move it
   - Drag corners to resize
   - Drag rotation handle (top) to rotate
   - Use Properties Panel for precise control

4. **Export**
   - Click "Export" button in header (or press Ctrl+E)
   - Choose format (PNG or SVG)
   - Select size (for PNG: 16-512px)
   - Click "Export PNG" or "Export SVG"

**Congratulations!** You've created your first icon.

---

## Shape Tools

### Available Shapes

#### Circle (⭕)
- Perfect circles
- Default: 50px radius
- Blue fill with darker blue stroke

#### Rectangle (▭)
- Rounded rectangles
- Default: 100×80px with 8px corner radius
- Green fill with darker green stroke

#### Triangle (△)
- Equilateral triangles
- Default: 100×100px
- Orange fill with darker orange stroke

#### Star (⭐)
- 5-pointed stars
- Default: 50px outer radius, 25px inner radius
- Yellow fill with darker yellow stroke

#### Polygon (⬡)
- Hexagons (6-sided)
- Default: 50px radius
- Purple fill with darker purple stroke

#### Arrow (→)
- Right-pointing arrows
- Default: 80×80px
- Pink fill with darker pink stroke

#### Select (↖️)
- Click to activate selection mode
- Click shapes to select them
- Drag to move, resize, or rotate
- Auto-activates after placing any shape

#### Line (/)
- Not yet implemented (coming in Phase 2)

#### Text (T)
- Not yet implemented (coming in Phase 2)

---

## Editing Shapes

### Selection

**Click to Select:**
- Click any shape with Select tool active
- Blue handles appear around shape
- Properties Panel shows shape details
- Layer Panel highlights selected layer

### Moving

**Drag to Move:**
- Click and hold on shape (not handles)
- Drag to new position
- Properties Panel shows X/Y coordinates
- Release to place

### Resizing

**Drag Corners:**
- Grab any corner handle
- Drag outward to enlarge
- Drag inward to shrink
- Shift+Drag to maintain aspect ratio (optional)

**Properties Panel:**
- Enter exact Width and Height values
- Updates in real-time

### Rotating

**Drag Rotation Handle:**
- Grab circular handle at top of shape
- Drag clockwise or counter-clockwise
- Current angle shown in Properties Panel

**Properties Panel:**
- Use rotation slider (0-360°)
- Or enter exact degree value

### Deleting

**Delete Key:**
- Select shape
- Press Delete or Backspace
- Shape removed immediately
- Toast notification confirms deletion

**Layer Panel:**
- Click trash icon (🗑️) next to layer
- Shape removed from canvas

---

## Using the Properties Panel

Located on the right side of the screen. Shows "Select an object" when nothing is selected.

### Position Section

**X Coordinate**
- Horizontal position from left edge
- Enter exact pixel value
- Updates as you drag shape

**Y Coordinate**
- Vertical position from top edge
- Enter exact pixel value
- Updates as you drag shape

### Size Section

**Width**
- Shape width in pixels
- Enter exact value
- Updates as you resize

**Height**
- Shape height in pixels
- Enter exact value
- Updates as you resize

### Rotation Section

**Slider**
- Drag to rotate (0-360°)
- Current angle displayed above slider
- Updates as you drag rotation handle

### Opacity Section

**Slider**
- Drag to adjust transparency (0-100%)
- 0% = fully transparent
- 100% = fully opaque
- Useful for layering effects

### Colors Section

**Fill Button**
- Click to open fill color picker
- Keyboard shortcut: C
- Shows current fill color preview

**Stroke Button**
- Click to open stroke color picker
- Keyboard shortcut: S
- Shows current stroke color preview

### Layer Order Section

**⬆️ Front** - Move to very top layer
**⬇️ Back** - Move to very bottom layer
**↑ Forward** - Move up one layer
**↓ Backward** - Move down one layer

---

## Color Management

### Opening Color Picker

**Methods:**
1. Click Fill or Stroke button in Properties Panel
2. Press C (fill) or S (stroke) with shape selected

### Color Picker Interface

**Color Input**
- Large color square for visual picking
- Hex input field for exact colors
- Updates in real-time on shape

**Recent Colors**
- Shows last 10 colors used
- Click to reapply quickly
- Stored in browser localStorage
- Persists across sessions

**Preset Colors**
- 23 Material Design colors
- Organized in grid
- Click to apply instantly
- Professional color palette

**Keyboard Shortcut Hint**
- Shows C or S shortcut at bottom

### Tips

- Use presets for consistent design
- Recent colors for color schemes
- Hex input for brand colors (#RRGGBB format)

---

## Layer Management

Located in the right sidebar, below Properties Panel.

### Layer List

**Shows:**
- All objects on canvas
- Object type (circle, rectangle, etc.)
- Top layer first (reverse stacking order)
- Selected layer highlighted in blue

**Empty State:**
- "No layers yet" message
- "Click a tool to add shapes" instruction

### Layer Controls

**Visibility Toggle (👁️)**
- Click to hide/show layer
- Hidden layers: 👁️‍🗨️ icon
- Layer stays in place, just invisible
- Use for complex designs

**Layer Selection**
- Click anywhere on layer row
- Object becomes selected on canvas
- Properties Panel updates
- Blue highlight shows selection

**Delete (🗑️)**
- Click trash icon
- Object removed from canvas
- Cannot be undone (use Undo instead)

### Layer Count

Status bar shows: "Objects: [number]"
- Tracks total objects on canvas
- Updates in real-time
- Useful for complexity management

---

## Undo/Redo

### Using Undo

**Undo Button:**
- Click "↶ Undo" in header
- Steps back one action
- Disabled when no history
- Grayed out when unavailable

**Keyboard:**
- Press Ctrl+Z
- Fastest method
- Works anywhere in app

**Toast Notification:**
- "Undone" message appears
- Confirms action
- Auto-dismisses after 2 seconds

### Using Redo

**Redo Button:**
- Click "↷ Redo" in header
- Steps forward one action
- Disabled when at newest state

**Keyboard:**
- Press Ctrl+Y
- Or Ctrl+Shift+Z (alternative)
- Works anywhere in app

**Toast Notification:**
- "Redone" message appears

### History Limits

- **Maximum**: 30 states stored
- **Older states**: Automatically removed
- **New actions**: Clear redo history
- **Performance**: Minimal memory impact

### What's Tracked

- Object added
- Object removed
- Object modified (move, resize, rotate)
- Property changes (color, opacity)
- Layer order changes

---

## Exporting Icons

### Opening Export Dialog

**Methods:**
1. Click "Export" button in header (blue button)
2. Press Ctrl+E keyboard shortcut

### Export Dialog

**Format Selection:**
- **PNG** - Raster image (pixels)
  - Best for: Web, apps, UI design
  - Size options: 16, 32, 64, 128, 256, 512px
  - Transparent background supported

- **SVG** - Vector image (scalable)
  - Best for: Logos, icons, print
  - Infinite scaling without quality loss
  - Smaller file size

### PNG Export

**Single Size:**
1. Select PNG format
2. Click desired size (e.g., 256×256)
3. Size button highlights in blue
4. Click "Export PNG"
5. File downloads automatically

**All Sizes (Batch Export):**
1. Select PNG format
2. Click "Export All Sizes" button
3. All 6 sizes download sequentially
4. 200ms delay between downloads
5. Perfect for multi-platform apps

**File Naming:**
- Pattern: `icon-[size]x[size]-[timestamp].png`
- Example: `icon-256x256-1729712400000.png`
- Timestamp prevents overwrites

### SVG Export

1. Select SVG format
2. Click "Export SVG"
3. File downloads as `icon-[timestamp].svg`
4. Opens in vector editors (Illustrator, Figma, etc.)
5. Scales infinitely without pixelation

### Export Tips

- Export multiple sizes for responsive design
- Use SVG for logos and branding
- Use PNG for UI mockups and presentations
- Export frequently to save progress (no auto-save yet)

---

## Keyboard Shortcuts

### Essential Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+Z** | Undo last action |
| **Ctrl+Y** | Redo action |
| **Ctrl+Shift+Z** | Redo action (alternative) |
| **Ctrl+E** | Open export dialog |
| **Delete** | Delete selected object |
| **Backspace** | Delete selected object |
| **C** | Open fill color picker |
| **S** | Open stroke color picker |

### Shortcuts Don't Work?

**Common reasons:**
- Typing in input field (shortcuts disabled)
- No object selected (C and S only)
- Browser extension intercepting
- Focus not on canvas

**Solutions:**
- Click on canvas area
- Select an object first
- Close active dialogs
- Use mouse buttons as backup

---

## Tips & Tricks

### Workflow Optimization

1. **Quick Creation Flow**
   - Select tool → Click canvas → Tool auto-switches to Select
   - No need to manually switch back
   - Immediate editing capability

2. **Use Recent Colors**
   - Build color palette as you work
   - Recent colors stored automatically
   - Quick access to your scheme

3. **Layer Organization**
   - Use visibility toggle for complex designs
   - Hide background while editing foreground
   - Bring to Front/Send to Back for quick reordering

4. **Keyboard-First Workflow**
   - C/S for colors
   - Ctrl+Z/Y for undo/redo
   - Ctrl+E for export
   - Delete for removing objects

### Design Best Practices

1. **Start Simple**
   - Begin with basic shapes
   - Combine shapes for complexity
   - Use overlap for interesting effects

2. **Use Consistent Colors**
   - Pick 2-3 main colors
   - Use opacity for variations
   - Refer to Material Design presets

3. **Mind the Size**
   - Canvas is 512×512
   - Design for smallest export size (16px)
   - Test visibility at target size

4. **Layer Management**
   - Keep layer count reasonable (< 20)
   - Name patterns help (all blue = background)
   - Use front/back for depth

### Common Patterns

**Icon with Background:**
1. Create large circle for background
2. Send to Back
3. Add foreground shape
4. Adjust colors with opacity

**Layered Effect:**
1. Create multiple overlapping shapes
2. Adjust opacity (50-70%)
3. Use layer order controls
4. Play with colors

**Badge/Counter:**
1. Create base icon
2. Add small circle in corner
3. Bring circle to Front
4. Use contrasting color

### Performance Tips

- Keep object count under 50 for smooth performance
- Export frequently (no auto-save)
- Clear history occasionally (refresh page)
- Use batch export for multiple sizes

### Accessibility

- All buttons have tooltips
- Keyboard shortcuts available
- High contrast UI
- Clear visual feedback
- Screen reader support (basic)

---

## Troubleshooting

### Shape Won't Appear

**Check:**
- Is correct tool selected? (Shows in status bar)
- Did you click on white canvas area?
- Is shape behind another object? (Check Layers Panel)
- Try undo and place again

### Can't Resize Shape

**Check:**
- Is shape selected? (Blue handles visible)
- Did tool switch back to Select?
- Try clicking shape again to select it
- Check if shape is locked (not implemented yet)

### Colors Not Changing

**Check:**
- Is object selected first?
- Did color picker open?
- Try clicking Fill/Stroke button again
- Check if recent colors section is empty

### Export Not Working

**Check:**
- Do you have at least one shape?
- Is export dialog open?
- Did you select PNG or SVG?
- Check browser download settings
- Allow downloads from localhost

### Keyboard Shortcuts Not Responding

**Check:**
- Focus on canvas (click canvas area)
- Not typing in input field
- No dialog open (close color picker/export)
- Try mouse alternative

---

## Getting Help

### In-App Help

**Help Button (❓)**
- Click at any time
- Re-shows Welcome Overlay
- Quick Start Guide refresher
- Keyboard shortcuts reference

### Documentation

- **README.md** - Complete overview
- **QUICKSTART.md** - Setup instructions
- **TECHNICAL_ARCHITECTURE.md** - System design
- **docs/** - Technical guides

### Welcome Overlay

**Shows automatically:**
- First time you visit IconForge
- Stored in browser localStorage
- Won't show again unless cleared

**Re-show manually:**
- Click Help button in header
- Clear localStorage (developer tools)
- Use incognito/private window

---

## What's Next?

### Coming in Phase 2

- Text tool with font selection
- Line tool with customizable thickness
- More shapes (pentagon, octagon, custom paths)
- Grid and snap-to-grid
- Rulers and measurement guides
- More export formats (ICO, ICNS)

### Coming in Phase 3

- AI icon generation (DALL-E 3)
- Icon library with search
- Template system
- User accounts and cloud save
- Component export (React, Vue, HTML)

### Coming in Phase 4

- Real-time collaboration
- Team workspaces
- Version history
- Comments and annotations
- Design system integration

---

**Ready to create amazing icons!** 🎨

Built with React 19, TypeScript, and Fabric.js | Version 1.0.0
