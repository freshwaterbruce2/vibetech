import { useState, useEffect } from 'react';
import { Canvas, FabricObject } from 'fabric';

interface PropertiesPanelProps {
  canvas: Canvas | null;
  onOpenColorPicker: (mode: 'fill' | 'stroke') => void;
}

export function PropertiesPanel({ canvas, onOpenColorPicker }: PropertiesPanelProps) {
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [properties, setProperties] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    opacity: 100,
    fill: '#000000',
    stroke: '#000000',
  });

  useEffect(() => {
    if (!canvas) return;

    const updateSelection = () => {
      const activeObject = canvas.getActiveObject();
      setSelectedObject(activeObject || null);

      if (activeObject) {
        setProperties({
          x: Math.round(activeObject.left || 0),
          y: Math.round(activeObject.top || 0),
          width: Math.round(activeObject.width || 0),
          height: Math.round(activeObject.height || 0),
          rotation: Math.round(activeObject.angle || 0),
          opacity: Math.round((activeObject.opacity || 1) * 100),
          fill: (activeObject.fill as string) || '#000000',
          stroke: (activeObject.stroke as string) || '#000000',
        });
      }
    };

    canvas.on('selection:created', updateSelection);
    canvas.on('selection:updated', updateSelection);
    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });
    canvas.on('object:modified', updateSelection);
    canvas.on('object:rotating', updateSelection);
    canvas.on('object:scaling', updateSelection);
    canvas.on('object:moving', updateSelection);

    updateSelection();

    return () => {
      canvas.off('selection:created', updateSelection);
      canvas.off('selection:updated', updateSelection);
      canvas.off('selection:cleared');
      canvas.off('object:modified', updateSelection);
      canvas.off('object:rotating', updateSelection);
      canvas.off('object:scaling', updateSelection);
      canvas.off('object:moving', updateSelection);
    };
  }, [canvas]);

  const updateProperty = (key: string, value: number | string) => {
    if (!canvas || !selectedObject) return;

    switch (key) {
      case 'x':
        selectedObject.set('left', Number(value));
        break;
      case 'y':
        selectedObject.set('top', Number(value));
        break;
      case 'width':
        selectedObject.set('width', Number(value));
        break;
      case 'height':
        selectedObject.set('height', Number(value));
        break;
      case 'rotation':
        selectedObject.set('angle', Number(value));
        break;
      case 'opacity':
        selectedObject.set('opacity', Number(value) / 100);
        break;
    }

    canvas.renderAll();
    setProperties((prev) => ({ ...prev, [key]: value }));
  };

  const bringForward = () => {
    if (!canvas || !selectedObject) return;
    canvas.bringObjectForward(selectedObject);
    canvas.renderAll();
  };

  const sendBackward = () => {
    if (!canvas || !selectedObject) return;
    canvas.sendObjectBackwards(selectedObject);
    canvas.renderAll();
  };

  const bringToFront = () => {
    if (!canvas || !selectedObject) return;
    canvas.bringObjectToFront(selectedObject);
    canvas.renderAll();
  };

  const sendToBack = () => {
    if (!canvas || !selectedObject) return;
    canvas.sendObjectToBack(selectedObject);
    canvas.renderAll();
  };

  if (!selectedObject) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-gray-400 text-sm">
            Select an object
            <br />
            <span className="text-xs">to view properties</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Properties</h2>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Position */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2">Position</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600">X</label>
              <input
                type="number"
                value={properties.x}
                onChange={(e) => updateProperty('x', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Y</label>
              <input
                type="number"
                value={properties.y}
                onChange={(e) => updateProperty('y', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2">Size</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600">Width</label>
              <input
                type="number"
                value={properties.width}
                onChange={(e) => updateProperty('width', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Height</label>
              <input
                type="number"
                value={properties.height}
                onChange={(e) => updateProperty('height', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-500">Rotation</h3>
            <span className="text-xs text-gray-600">{properties.rotation}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={properties.rotation}
            onChange={(e) => updateProperty('rotation', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Opacity */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-500">Opacity</h3>
            <span className="text-xs text-gray-600">{properties.opacity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={properties.opacity}
            onChange={(e) => updateProperty('opacity', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Colors */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2">Colors</h3>
          <div className="space-y-2">
            <button
              onClick={() => onOpenColorPicker('fill')}
              className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              <div
                className="w-6 h-6 rounded border border-gray-300"
                style={{ backgroundColor: properties.fill }}
              />
              <span className="text-sm text-gray-700">Fill</span>
              <kbd className="ml-auto text-xs px-1.5 py-0.5 bg-gray-100 rounded">C</kbd>
            </button>
            <button
              onClick={() => onOpenColorPicker('stroke')}
              className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              <div
                className="w-6 h-6 rounded border border-gray-300"
                style={{ backgroundColor: properties.stroke }}
              />
              <span className="text-sm text-gray-700">Stroke</span>
              <kbd className="ml-auto text-xs px-1.5 py-0.5 bg-gray-100 rounded">S</kbd>
            </button>
          </div>
        </div>

        {/* Layer Order */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2">Layer Order</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={bringToFront}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              title="Bring to Front"
            >
              ⬆️ Front
            </button>
            <button
              onClick={sendToBack}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              title="Send to Back"
            >
              ⬇️ Back
            </button>
            <button
              onClick={bringForward}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              title="Bring Forward"
            >
              ↑ Forward
            </button>
            <button
              onClick={sendBackward}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              title="Send Backward"
            >
              ↓ Backward
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
