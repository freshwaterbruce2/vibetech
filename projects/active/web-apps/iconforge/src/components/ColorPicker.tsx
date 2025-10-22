import { useState, useEffect } from 'react';
import { Canvas } from 'fabric';

interface ColorPickerProps {
  canvas: Canvas | null;
  isOpen: boolean;
  onClose: () => void;
  mode: 'fill' | 'stroke';
}

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#9E9E9E', '#757575', '#424242',
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
  '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
  '#FF5722', '#795548', '#607D8B',
];

const RECENT_COLORS_KEY = 'iconforge_recent_colors';
const MAX_RECENT_COLORS = 10;

export function ColorPicker({ canvas, isOpen, onClose, mode }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [recentColors, setRecentColors] = useState<string[]>([]);

  useEffect(() => {
    // Load recent colors from localStorage
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    if (stored) {
      try {
        setRecentColors(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent colors:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Get current color from selected object
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        const currentColor = mode === 'fill'
          ? (activeObject.fill as string)
          : (activeObject.stroke as string);
        if (currentColor && typeof currentColor === 'string') {
          setSelectedColor(currentColor);
        }
      }
    }
  }, [canvas, mode, isOpen]);

  const applyColor = (color: string) => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    if (mode === 'fill') {
      activeObject.set('fill', color);
    } else {
      activeObject.set('stroke', color);
    }

    canvas.renderAll();
    setSelectedColor(color);

    // Add to recent colors
    addToRecentColors(color);
  };

  const addToRecentColors = (color: string) => {
    const updated = [color, ...recentColors.filter(c => c !== color)].slice(0, MAX_RECENT_COLORS);
    setRecentColors(updated);
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    applyColor(color);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Color Picker Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white rounded-lg shadow-xl p-4 w-80 pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {mode === 'fill' ? 'Fill Color' : 'Stroke Color'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Color Input */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={selectedColor}
                onChange={handleColorChange}
                className="w-16 h-16 rounded border border-gray-300 cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => applyColor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Recent</h4>
              <div className="grid grid-cols-10 gap-1">
                {recentColors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => applyColor(color)}
                    className="w-7 h-7 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Preset Colors */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-2">Presets</h4>
            <div className="grid grid-cols-10 gap-1">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => applyColor(color)}
                  className="w-7 h-7 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Keyboard Hint */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Shortcut: <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                {mode === 'fill' ? 'C' : 'S'}
              </kbd>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
