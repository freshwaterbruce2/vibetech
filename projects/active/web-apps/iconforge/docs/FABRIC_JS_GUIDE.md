# Fabric.js Implementation Guide for IconForge

> **Last Updated**: October 2025
> **Purpose**: Comprehensive guide for implementing Fabric.js canvas editor in IconForge
> **Target Audience**: Frontend developers working on icon editor

---

## Table of Contents

1. [Why Fabric.js](#why-fabricjs)
2. [Core Concepts](#core-concepts)
3. [Canvas Setup](#canvas-setup)
4. [Shape Tools](#shape-tools)
5. [Selection & Manipulation](#selection--manipulation)
6. [Layers Management](#layers-management)
7. [Export System](#export-system)
8. [Performance Optimization](#performance-optimization)
9. [Integration with React](#integration-with-react)
10. [Best Practices](#best-practices)

---

## Why Fabric.js

Fabric.js was chosen over Konva.js and Paper.js for IconForge because:

✅ **Built-in Object Manipulation**: Click, drag, resize, rotate out-of-the-box
✅ **Native Text Editing**: Inline text editing without custom implementation
✅ **Filters & Effects**: Built-in blur, emboss, gradients
✅ **SVG Support**: Strong import/export capabilities
✅ **Icon Editor Focus**: Designed for graphic design tools
✅ **Mature Ecosystem**: 25.7k GitHub stars, active maintenance

---

## Core Concepts

### 1. Canvas Object

The main container for all visual elements.

```typescript
import { Canvas } from 'fabric';

const canvas = new Canvas('canvas-element', {
  width: 512,
  height: 512,
  backgroundColor: '#ffffff',
  selection: true,          // Allow selection
  selectionColor: 'rgba(59, 130, 246, 0.1)',
  selectionBorderColor: '#3b82f6',
  preserveObjectStacking: true
});
```

### 2. Objects (Shapes, Text, Images)

Everything on the canvas is an object: Circle, Rect, Path, Text, etc.

```typescript
import { Circle, Rect, Triangle, Path, Text } from 'fabric';

// Circle
const circle = new Circle({
  radius: 50,
  fill: '#3b82f6',
  left: 100,
  top: 100,
  originX: 'center',
  originY: 'center'
});

// Rectangle
const rect = new Rect({
  width: 100,
  height: 80,
  fill: '#10b981',
  left: 200,
  top: 100,
  rx: 10,              // Rounded corners
  ry: 10
});

// Triangle
const triangle = new Triangle({
  width: 80,
  height: 80,
  fill: '#f59e0b',
  left: 300,
  top: 100
});

// Text
const text = new Text('Icon', {
  left: 400,
  top: 100,
  fontSize: 24,
  fontFamily: 'Arial',
  fill: '#1f2937'
});

canvas.add(circle, rect, triangle, text);
```

### 3. Selection & Events

Fabric.js handles selection and interaction automatically.

```typescript
// Object selected
canvas.on('selection:created', (e) => {
  const selected = e.selected[0];
  console.log('Selected:', selected.type);
});

// Object modified
canvas.on('object:modified', (e) => {
  const obj = e.target;
  console.log('Modified:', obj.type, obj.left, obj.top);
  saveToHistory(); // Undo/redo
});

// Mouse events
canvas.on('mouse:down', (e) => {
  const pointer = canvas.getPointer(e.e);
  console.log('Clicked at:', pointer.x, pointer.y);
});
```

---

## Canvas Setup

### React Component Structure

```typescript
// src/components/IconEditor.tsx
import { useEffect, useRef, useState } from 'react';
import { Canvas } from 'fabric';

interface IconEditorProps {
  width?: number;
  height?: number;
  onSave?: (data: any) => void;
}

export function IconEditor({ width = 512, height = 512, onSave }: IconEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [activeObject, setActiveObject] = useState<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric canvas
    const fabricCanvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = fabricCanvas;

    // Setup event listeners
    fabricCanvas.on('selection:created', (e) => {
      setActiveObject(e.selected[0]);
    });

    fabricCanvas.on('selection:updated', (e) => {
      setActiveObject(e.selected[0]);
    });

    fabricCanvas.on('selection:cleared', () => {
      setActiveObject(null);
    });

    // Cleanup
    return () => {
      fabricCanvas.dispose();
    };
  }, [width, height]);

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} />
      {activeObject && (
        <div className="mt-4">
          <p>Selected: {activeObject.type}</p>
        </div>
      )}
    </div>
  );
}
```

### Grid & Guidelines

```typescript
function addGrid(canvas: Canvas, gridSize = 20) {
  const width = canvas.width;
  const height = canvas.height;

  // Vertical lines
  for (let i = 0; i <= width; i += gridSize) {
    canvas.add(new Line([i, 0, i, height], {
      stroke: '#e5e7eb',
      strokeWidth: 1,
      selectable: false,
      evented: false
    }));
  }

  // Horizontal lines
  for (let i = 0; i <= height; i += gridSize) {
    canvas.add(new Line([0, i, width, i], {
      stroke: '#e5e7eb',
      strokeWidth: 1,
      selectable: false,
      evented: false
    }));
  }
}

function addGuidelines(canvas: Canvas) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Center lines
  canvas.add(
    new Line([centerX, 0, centerX, canvas.height], {
      stroke: '#3b82f6',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false
    }),
    new Line([0, centerY, canvas.width, centerY], {
      stroke: '#3b82f6',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false
    })
  );
}
```

---

## Shape Tools

### Drawing Mode

```typescript
// src/hooks/useShapeTool.ts
import { Canvas, Circle, Rect, Triangle, Line, Polygon } from 'fabric';
import { useState, useCallback } from 'react';

export type ShapeTool = 'select' | 'circle' | 'rectangle' | 'triangle' | 'polygon' | 'line';

export function useShapeTool(canvas: Canvas | null) {
  const [activeTool, setActiveTool] = useState<ShapeTool>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((e: any) => {
    if (!canvas || activeTool === 'select') return;

    const pointer = canvas.getPointer(e.e);
    setStartPoint(pointer);
    setIsDrawing(true);
    canvas.selection = false; // Disable selection during drawing
  }, [canvas, activeTool]);

  const handleMouseMove = useCallback((e: any) => {
    if (!canvas || !isDrawing || !startPoint) return;

    const pointer = canvas.getPointer(e.e);
    const objects = canvas.getObjects();
    const lastObj = objects[objects.length - 1];

    // Update preview shape
    if (lastObj && lastObj.get('isDrawing')) {
      updateShape(lastObj, startPoint, pointer, activeTool);
      canvas.renderAll();
    }
  }, [canvas, isDrawing, startPoint, activeTool]);

  const handleMouseUp = useCallback((e: any) => {
    if (!canvas || !isDrawing || !startPoint) return;

    const pointer = canvas.getPointer(e.e);
    const shape = createShape(startPoint, pointer, activeTool);

    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
    }

    setIsDrawing(false);
    setStartPoint(null);
    canvas.selection = true;
    canvas.renderAll();
  }, [canvas, isDrawing, startPoint, activeTool]);

  useEffect(() => {
    if (!canvas) return;

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [canvas, handleMouseDown, handleMouseMove, handleMouseUp]);

  return { activeTool, setActiveTool };
}

function createShape(start: any, end: any, tool: ShapeTool) {
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);

  switch (tool) {
    case 'circle':
      return new Circle({
        left,
        top,
        radius: Math.min(width, height) / 2,
        fill: '#3b82f6',
        stroke: '#1e40af',
        strokeWidth: 2
      });

    case 'rectangle':
      return new Rect({
        left,
        top,
        width,
        height,
        fill: '#10b981',
        stroke: '#059669',
        strokeWidth: 2
      });

    case 'triangle':
      return new Triangle({
        left,
        top,
        width,
        height,
        fill: '#f59e0b',
        stroke: '#d97706',
        strokeWidth: 2
      });

    case 'line':
      return new Line([start.x, start.y, end.x, end.y], {
        stroke: '#6366f1',
        strokeWidth: 2
      });

    default:
      return null;
  }
}
```

### Pen Tool (Path Drawing)

```typescript
import { Path } from 'fabric';

class PenTool {
  private canvas: Canvas;
  private currentPath: string[] = [];
  private tempPath: Path | null = null;

  constructor(canvas: Canvas) {
    this.canvas = canvas;
  }

  start(point: { x: number; y: number }) {
    this.currentPath = [`M ${point.x} ${point.y}`];
    this.tempPath = new Path(this.currentPath.join(' '), {
      stroke: '#000000',
      strokeWidth: 2,
      fill: '',
      selectable: false
    });
    this.canvas.add(this.tempPath);
  }

  addPoint(point: { x: number; y: number }) {
    if (!this.tempPath) return;

    this.currentPath.push(`L ${point.x} ${point.y}`);
    this.tempPath.path = this.currentPath.join(' ');
    this.canvas.renderAll();
  }

  finish() {
    if (!this.tempPath) return;

    this.tempPath.set({ selectable: true });
    this.canvas.setActiveObject(this.tempPath);
    this.tempPath = null;
    this.currentPath = [];
  }

  cancel() {
    if (this.tempPath) {
      this.canvas.remove(this.tempPath);
      this.tempPath = null;
      this.currentPath = [];
    }
  }
}
```

---

## Selection & Manipulation

### Multi-Select

```typescript
// Enable multi-selection with Ctrl/Cmd
canvas.on('mouse:down', (e) => {
  if (e.e.ctrlKey || e.e.metaKey) {
    const activeObjects = canvas.getActiveObjects();
    const clickedObject = e.target;

    if (clickedObject) {
      if (activeObjects.includes(clickedObject)) {
        // Remove from selection
        canvas.discardActiveObject();
        const newSelection = activeObjects.filter(obj => obj !== clickedObject);
        canvas.setActiveObject(new ActiveSelection(newSelection, { canvas }));
      } else {
        // Add to selection
        canvas.setActiveObject(new ActiveSelection([...activeObjects, clickedObject], { canvas }));
      }
    }
  }
});
```

### Transform Controls

```typescript
// Customize selection controls
canvas.on('selection:created', (e) => {
  const activeObject = e.selected[0];

  activeObject.set({
    borderColor: '#3b82f6',
    borderScaleFactor: 2,
    cornerColor: '#ffffff',
    cornerStrokeColor: '#3b82f6',
    cornerSize: 12,
    cornerStyle: 'circle',
    transparentCorners: false,
    borderDashArray: [5, 5]
  });

  canvas.renderAll();
});
```

### Alignment Tools

```typescript
function alignObjects(canvas: Canvas, alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length < 2) return;

  const group = new Group(activeObjects);
  const groupBounds = group.getBoundingRect();

  activeObjects.forEach(obj => {
    switch (alignment) {
      case 'left':
        obj.set({ left: groupBounds.left });
        break;
      case 'center':
        obj.set({ left: groupBounds.left + groupBounds.width / 2 - obj.width / 2 });
        break;
      case 'right':
        obj.set({ left: groupBounds.left + groupBounds.width - obj.width });
        break;
      case 'top':
        obj.set({ top: groupBounds.top });
        break;
      case 'middle':
        obj.set({ top: groupBounds.top + groupBounds.height / 2 - obj.height / 2 });
        break;
      case 'bottom':
        obj.set({ top: groupBounds.top + groupBounds.height - obj.height });
        break;
    }
    obj.setCoords();
  });

  canvas.renderAll();
}

// Usage
alignObjects(canvas, 'center');
```

### Distribution

```typescript
function distributeObjects(canvas: Canvas, direction: 'horizontal' | 'vertical') {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length < 3) return;

  const sorted = direction === 'horizontal'
    ? activeObjects.sort((a, b) => a.left - b.left)
    : activeObjects.sort((a, b) => a.top - b.top);

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalSpace = direction === 'horizontal'
    ? last.left - first.left - first.width
    : last.top - first.top - first.height;

  const gap = totalSpace / (sorted.length - 1);

  sorted.forEach((obj, i) => {
    if (i === 0 || i === sorted.length - 1) return;

    if (direction === 'horizontal') {
      obj.set({ left: first.left + first.width + gap * i });
    } else {
      obj.set({ top: first.top + first.height + gap * i });
    }
    obj.setCoords();
  });

  canvas.renderAll();
}
```

---

## Layers Management

### Layer Panel Implementation

```typescript
// src/components/LayerPanel.tsx
import { useEffect, useState } from 'react';
import { Canvas, Object as FabricObject } from 'fabric';

interface LayerPanelProps {
  canvas: Canvas | null;
}

export function LayerPanel({ canvas }: LayerPanelProps) {
  const [layers, setLayers] = useState<FabricObject[]>([]);

  useEffect(() => {
    if (!canvas) return;

    const updateLayers = () => {
      setLayers([...canvas.getObjects()]);
    };

    canvas.on('object:added', updateLayers);
    canvas.on('object:removed', updateLayers);
    canvas.on('object:modified', updateLayers);

    updateLayers();

    return () => {
      canvas.off('object:added', updateLayers);
      canvas.off('object:removed', updateLayers);
      canvas.off('object:modified', updateLayers);
    };
  }, [canvas]);

  const selectLayer = (obj: FabricObject) => {
    if (!canvas) return;
    canvas.setActiveObject(obj);
    canvas.renderAll();
  };

  const toggleVisibility = (obj: FabricObject) => {
    obj.set({ visible: !obj.visible });
    canvas?.renderAll();
  };

  const deleteLayer = (obj: FabricObject) => {
    canvas?.remove(obj);
  };

  const moveLayerUp = (obj: FabricObject) => {
    canvas?.bringForward(obj);
    setLayers([...canvas.getObjects()]);
  };

  const moveLayerDown = (obj: FabricObject) => {
    canvas?.sendBackwards(obj);
    setLayers([...canvas.getObjects()]);
  };

  return (
    <div className="w-64 bg-gray-50 p-4">
      <h3 className="font-semibold mb-4">Layers</h3>
      <div className="space-y-2">
        {layers.map((layer, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 bg-white rounded border hover:border-blue-500 cursor-pointer"
            onClick={() => selectLayer(layer)}
          >
            <button onClick={(e) => { e.stopPropagation(); toggleVisibility(layer); }}>
              {layer.visible ? '👁️' : '👁️‍🗨️'}
            </button>
            <span className="flex-1">{layer.type}</span>
            <button onClick={(e) => { e.stopPropagation(); moveLayerUp(layer); }}>↑</button>
            <button onClick={(e) => { e.stopPropagation(); moveLayerDown(layer); }}>↓</button>
            <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer); }}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Layer Groups

```typescript
import { Group } from 'fabric';

function groupLayers(canvas: Canvas) {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length < 2) return;

  const group = new Group(activeObjects, {
    name: 'Layer Group'
  });

  activeObjects.forEach(obj => canvas.remove(obj));
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.renderAll();
}

function ungroupLayers(canvas: Canvas) {
  const activeObject = canvas.getActiveObject();
  if (!activeObject || activeObject.type !== 'group') return;

  const group = activeObject as Group;
  const items = group.getObjects();

  group.toActiveSelection();
  canvas.remove(group);

  items.forEach(item => canvas.add(item));
  canvas.renderAll();
}
```

---

## Export System

### SVG Export

```typescript
function exportToSVG(canvas: Canvas, optimized = true): string {
  const svg = canvas.toSVG({
    width: canvas.width,
    height: canvas.height,
    viewBox: {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height
    }
  });

  if (optimized) {
    // Use SVGO for optimization (see AI integration guide)
    return optimizeSVG(svg);
  }

  return svg;
}
```

### PNG Export

```typescript
function exportToPNG(canvas: Canvas, scale = 1): string {
  return canvas.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: scale // 2 for @2x, 3 for @3x
  });
}

// Multi-size export
async function exportMultiSize(canvas: Canvas, sizes: number[]): Promise<Record<number, string>> {
  const exports: Record<number, string> = {};

  for (const size of sizes) {
    const scale = size / canvas.width;
    exports[size] = exportToPNG(canvas, scale);
  }

  return exports;
}

// Usage
const pngs = await exportMultiSize(canvas, [16, 32, 64, 128, 256, 512]);
```

### Component Export

```typescript
function exportToReactComponent(canvas: Canvas, componentName: string): string {
  const svg = exportToSVG(canvas);

  return `
import React from 'react';

export function ${componentName}(props: React.SVGProps<SVGSVGElement>) {
  return (
    ${svg}
  );
}
`.trim();
}
```

---

## Performance Optimization

### Object Caching

```typescript
// Cache static objects
canvas.getObjects().forEach(obj => {
  if (!obj.isEditing) {
    obj.set({ objectCaching: true });
  }
});

// Disable caching for active object
canvas.on('selection:created', (e) => {
  e.selected[0].set({ objectCaching: false });
});

canvas.on('selection:cleared', (e) => {
  if (e.deselected[0]) {
    e.deselected[0].set({ objectCaching: true });
  }
});
```

### Render Optimization

```typescript
// Batch updates
canvas.renderOnAddRemove = false; // Disable auto-render

// Add multiple objects
shapes.forEach(shape => canvas.add(shape));

// Render once
canvas.renderAll();
canvas.renderOnAddRemove = true; // Re-enable
```

### Event Optimization

```typescript
// Disable events for non-interactive objects (grid, guidelines)
gridLine.set({
  selectable: false,
  evented: false
});

// Throttle mouse move events
let lastRender = 0;
canvas.on('mouse:move', (e) => {
  const now = Date.now();
  if (now - lastRender < 16) return; // 60 FPS limit

  lastRender = now;
  updateCursor(e);
});
```

---

## Integration with React

### Custom Hook

```typescript
// src/hooks/useFabricCanvas.ts
import { useEffect, useRef, useState } from 'react';
import { Canvas } from 'fabric';

export function useFabricCanvas(width = 512, height = 512) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff'
    });

    fabricRef.current = fabricCanvas;
    setIsReady(true);

    return () => {
      fabricCanvas.dispose();
      fabricRef.current = null;
      setIsReady(false);
    };
  }, [width, height]);

  return { canvasRef, canvas: fabricRef.current, isReady };
}
```

### Zustand Store Integration

```typescript
// src/stores/canvasStore.ts
import { create } from 'zustand';
import { Canvas, Object as FabricObject } from 'fabric';

interface CanvasStore {
  canvas: Canvas | null;
  activeObject: FabricObject | null;
  history: any[];
  historyIndex: number;

  setCanvas: (canvas: Canvas) => void;
  setActiveObject: (obj: FabricObject | null) => void;
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  canvas: null,
  activeObject: null,
  history: [],
  historyIndex: -1,

  setCanvas: (canvas) => {
    set({ canvas });

    canvas.on('selection:created', (e) => {
      set({ activeObject: e.selected[0] });
    });

    canvas.on('selection:updated', (e) => {
      set({ activeObject: e.selected[0] });
    });

    canvas.on('selection:cleared', () => {
      set({ activeObject: null });
    });

    canvas.on('object:modified', () => {
      get().saveHistory();
    });
  },

  setActiveObject: (obj) => set({ activeObject: obj }),

  saveHistory: () => {
    const { canvas, history, historyIndex } = get();
    if (!canvas) return;

    const json = canvas.toJSON();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(json);

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },

  undo: () => {
    const { canvas, history, historyIndex } = get();
    if (!canvas || historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    canvas.loadFromJSON(history[newIndex], () => {
      canvas.renderAll();
      set({ historyIndex: newIndex });
    });
  },

  redo: () => {
    const { canvas, history, historyIndex } = get();
    if (!canvas || historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    canvas.loadFromJSON(history[newIndex], () => {
      canvas.renderAll();
      set({ historyIndex: newIndex });
    });
  }
}));
```

---

## Best Practices

### 1. Memory Management

```typescript
// Dispose canvas when unmounting
useEffect(() => {
  return () => {
    canvas?.dispose();
  };
}, [canvas]);

// Clear large objects
canvas.clear();
canvas.renderAll();
```

### 2. Type Safety

```typescript
// Define custom object types
interface IconObject extends FabricObject {
  id: string;
  category: string;
  metadata: Record<string, any>;
}

// Type guard
function isIconObject(obj: any): obj is IconObject {
  return obj && typeof obj.id === 'string' && typeof obj.category === 'string';
}
```

### 3. Error Handling

```typescript
try {
  canvas.loadFromJSON(jsonData, () => {
    canvas.renderAll();
  });
} catch (error) {
  console.error('Failed to load canvas:', error);
  // Show user-friendly error message
}
```

### 4. Keyboard Shortcuts

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();

    // Delete
    if (e.key === 'Delete' && activeObject) {
      canvas.remove(activeObject);
    }

    // Undo/Redo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    }

    // Copy/Paste
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && activeObject) {
      e.preventDefault();
      clipboard = activeObject.toJSON();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
      e.preventDefault();
      // Paste logic
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [canvas]);
```

---

## Conclusion

Fabric.js provides a powerful, feature-rich foundation for IconForge's canvas editor. The library's built-in object manipulation, text editing, and SVG support make it ideal for icon creation tools.

**Key Takeaways**:
- Use object caching for performance
- Implement layer management early
- Leverage built-in selection/transformation
- Integrate with React state management
- Plan export pipeline from the start

**Next Steps**:
1. Set up basic canvas with React
2. Implement shape tools
3. Add layer management
4. Build export system
5. Optimize performance

**Resources**:
- [Fabric.js Docs](http://fabricjs.com/)
- [Fabric.js GitHub](https://github.com/fabricjs/fabric.js)
- [React Integration Examples](http://fabricjs.com/fabric-intro-part-1)
