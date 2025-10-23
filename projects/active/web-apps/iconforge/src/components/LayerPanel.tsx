import { useEffect, useState } from 'react';

interface Layer {
  id: string;
  type: string;
  visible: boolean;
  locked: boolean;
}

interface LayerPanelProps {
  canvas: any | null;
}

export function LayerPanel({ canvas }: LayerPanelProps) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!canvas) return;

    const updateLayers = () => {
      const objects = canvas.getObjects();
      const layerList: Layer[] = objects.map((obj: any, index: number) => ({
        id: obj.id || `layer-${index}`,
        type: obj.type || 'object',
        visible: obj.visible !== false,
        locked: obj.lockMovementX || false,
      }));
      setLayers(layerList.reverse()); // Reverse to show top layer first
    };

    canvas.on('object:added', updateLayers);
    canvas.on('object:removed', updateLayers);
    canvas.on('object:modified', updateLayers);
    canvas.on('selection:created', (e: any) => {
      setSelectedId(e.selected?.[0]?.id || null);
    });
    canvas.on('selection:cleared', () => {
      setSelectedId(null);
    });

    updateLayers();

    return () => {
      canvas.off('object:added', updateLayers);
      canvas.off('object:removed', updateLayers);
      canvas.off('object:modified', updateLayers);
    };
  }, [canvas]);

  const toggleVisibility = (id: string) => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o: any) => o.id === id || `layer-${canvas.getObjects().indexOf(o)}` === id);
    if (obj) {
      obj.visible = !obj.visible;
      canvas.renderAll();
      setLayers([...layers]);
    }
  };

  const deleteLayer = (id: string) => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o: any) => o.id === id || `layer-${canvas.getObjects().indexOf(o)}` === id);
    if (obj) {
      canvas.remove(obj);
    }
  };

  const selectLayer = (id: string) => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o: any) => o.id === id || `layer-${canvas.getObjects().indexOf(o)}` === id);
    if (obj) {
      canvas.setActiveObject(obj);
      canvas.renderAll();
      setSelectedId(id);
    }
  };

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Layers</h2>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-2">
        {layers.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No layers yet
            <br />
            <span className="text-xs">Click a tool to add shapes</span>
          </div>
        ) : (
          <div className="space-y-1">
            {layers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => selectLayer(layer.id)}
                className={`
                  flex items-center gap-2 p-2 rounded cursor-pointer
                  ${selectedId === layer.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}
                `}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(layer.id);
                  }}
                  className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900"
                >
                  {layer.visible ? '👁️' : '👁️‍🗨️'}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {layer.type}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLayer(layer.id);
                  }}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200">
          Clear All
        </button>
      </div>
    </div>
  );
}
