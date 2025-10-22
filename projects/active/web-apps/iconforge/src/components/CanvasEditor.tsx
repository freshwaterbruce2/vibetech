import { useEffect, useRef, useState } from 'react';
import { Canvas, Circle, Rect, Triangle, Polygon, Path, FabricObject } from 'fabric';
import type { Tool } from './Toolbar';

interface CanvasEditorProps {
  activeTool: Tool;
  onCanvasReady?: (canvas: Canvas) => void;
  onToolChange?: (tool: Tool) => void;
}

// Helper function to create star points
function createStarPoints(points: number, outerRadius: number, innerRadius: number) {
  const starPoints = [];
  const step = Math.PI / points;

  for (let i = 0; i < 2 * points; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    starPoints.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    });
  }

  return starPoints;
}

// Helper function to create regular polygon points
function createPolygonPoints(sides: number, radius: number) {
  const points = [];
  const step = (2 * Math.PI) / sides;

  for (let i = 0; i < sides; i++) {
    const angle = i * step - Math.PI / 2;
    points.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    });
  }

  return points;
}

export function CanvasEditor({ activeTool, onCanvasReady, onToolChange }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [objectCount, setObjectCount] = useState(0);
  const isAddingShapeRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric.js canvas
    const fabricCanvas = new Canvas(canvasRef.current, {
      width: 512,
      height: 512,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = fabricCanvas;
    setIsReady(true);

    // Notify parent component
    if (onCanvasReady) {
      onCanvasReady(fabricCanvas);
    }

    // Add event listeners
    fabricCanvas.on('object:added', () => {
      setObjectCount(fabricCanvas.getObjects().length);
    });

    fabricCanvas.on('object:removed', () => {
      setObjectCount(fabricCanvas.getObjects().length);
    });

    // Cleanup
    return () => {
      fabricCanvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Handle tool changes
  useEffect(() => {
    if (!fabricRef.current || !isReady) return;

    const canvas = fabricRef.current;

    if (activeTool === 'select') {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      return;
    }

    // Add shape on click
    const handleMouseDown = (e: any) => {
      // Prevent multiple shapes from being created in rapid succession
      if (isAddingShapeRef.current) return;
      isAddingShapeRef.current = true;

      const pointer = canvas.getPointer(e.e);
      let shape: FabricObject | null = null;

      switch (activeTool) {
        case 'circle':
          shape = new Circle({
            left: pointer.x - 50,
            top: pointer.y - 50,
            radius: 50,
            fill: '#3b82f6',
            stroke: '#1e40af',
            strokeWidth: 2,
          });
          break;

        case 'rectangle':
          shape = new Rect({
            left: pointer.x - 50,
            top: pointer.y - 50,
            width: 100,
            height: 80,
            fill: '#10b981',
            stroke: '#059669',
            strokeWidth: 2,
            rx: 8,
            ry: 8,
          });
          break;

        case 'triangle':
          shape = new Triangle({
            left: pointer.x - 50,
            top: pointer.y - 50,
            width: 100,
            height: 100,
            fill: '#f59e0b',
            stroke: '#d97706',
            strokeWidth: 2,
          });
          break;

        case 'star':
          // Create 5-pointed star using polygon
          const starPoints = createStarPoints(5, 50, 25);
          shape = new Polygon(starPoints, {
            left: pointer.x - 50,
            top: pointer.y - 50,
            fill: '#eab308',
            stroke: '#ca8a04',
            strokeWidth: 2,
          });
          break;

        case 'polygon':
          // Create hexagon using polygon
          const hexPoints = createPolygonPoints(6, 50);
          shape = new Polygon(hexPoints, {
            left: pointer.x - 50,
            top: pointer.y - 50,
            fill: '#8b5cf6',
            stroke: '#7c3aed',
            strokeWidth: 2,
          });
          break;

        case 'arrow':
          // Create arrow using path
          const arrowPath = 'M 0 30 L 60 30 L 60 20 L 80 40 L 60 60 L 60 50 L 0 50 Z';
          shape = new Path(arrowPath, {
            left: pointer.x - 40,
            top: pointer.y - 40,
            fill: '#ec4899',
            stroke: '#db2777',
            strokeWidth: 2,
          });
          break;
      }

      if (shape) {
        canvas.add(shape);
        canvas.setActiveObject(shape);
        canvas.renderAll();

        // Automatically switch back to select tool after placing shape
        if (onToolChange) {
          onToolChange('select');
        }

        // Reset the flag after a brief delay
        setTimeout(() => {
          isAddingShapeRef.current = false;
        }, 100);
      } else {
        // If no shape was created, reset immediately
        isAddingShapeRef.current = false;
      }
    };

    canvas.on('mouse:down', handleMouseDown);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      // Reset flag on cleanup
      isAddingShapeRef.current = false;
    };
  }, [activeTool, isReady, onToolChange]);

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-100 p-8">
      <div className="relative">
        {/* Canvas Container */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <canvas ref={canvasRef} className="border border-gray-300" />

          {/* Empty State Overlay */}
          {objectCount === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-lg max-w-sm">
                <div className="text-4xl mb-3">👈</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Start Creating
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Select a shape tool from the left toolbar, then click on the canvas to place it
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">⭕</div>
                    Circle
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">▭</div>
                    Rectangle
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">⭐</div>
                    Star
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur rounded px-3 py-2 text-xs text-gray-600 flex items-center justify-between">
          <span>Canvas: 512×512</span>
          <span>Objects: {objectCount}</span>
          <span className="font-medium">
            Tool: <span className="text-blue-600">{activeTool}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
