import { useState } from 'react';
import { Canvas } from 'fabric';

interface ExportDialogProps {
  canvas: Canvas | null;
  isOpen: boolean;
  onClose: () => void;
}

const PNG_SIZES = [16, 32, 64, 128, 256, 512];

export function ExportDialog({ canvas, isOpen, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<'svg' | 'png'>('png');
  const [selectedSize, setSelectedSize] = useState(256);
  const [exporting, setExporting] = useState(false);

  const exportSVG = () => {
    if (!canvas) return;

    setExporting(true);

    try {
      const svg = canvas.toSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `icon-${Date.now()}.svg`;
      link.click();

      URL.revokeObjectURL(url);
      onClose();
    } catch (error) {
      console.error('SVG export failed:', error);
      alert('Failed to export SVG. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportPNG = (size: number) => {
    if (!canvas) return;

    setExporting(true);

    try {
      // Calculate scale factor
      const originalWidth = canvas.width || 512;
      const originalHeight = canvas.height || 512;
      const scale = size / Math.max(originalWidth, originalHeight);

      // Export as data URL
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: scale,
      });

      // Download
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `icon-${size}x${size}-${Date.now()}.png`;
      link.click();

      onClose();
    } catch (error) {
      console.error('PNG export failed:', error);
      alert('Failed to export PNG. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportAllPNG = async () => {
    if (!canvas) return;

    setExporting(true);

    try {
      for (const size of PNG_SIZES) {
        await new Promise((resolve) => {
          const originalWidth = canvas.width || 512;
          const originalHeight = canvas.height || 512;
          const scale = size / Math.max(originalWidth, originalHeight);

          const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: scale,
          });

          const link = document.createElement('a');
          link.href = dataURL;
          link.download = `icon-${size}x${size}-${Date.now()}.png`;
          link.click();

          // Delay between downloads to avoid browser blocking
          setTimeout(resolve, 200);
        });
      }

      onClose();
    } catch (error) {
      console.error('Batch PNG export failed:', error);
      alert('Failed to export all PNG sizes. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleExport = () => {
    if (format === 'svg') {
      exportSVG();
    } else {
      exportPNG(selectedSize);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white rounded-lg shadow-xl p-6 w-96 pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Export Icon</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={exporting}
            >
              ✕
            </button>
          </div>

          {/* Format Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Format</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat('png')}
                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                  format === 'png'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">PNG</div>
                <div className="text-xs">Raster image</div>
              </button>
              <button
                onClick={() => setFormat('svg')}
                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                  format === 'svg'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">SVG</div>
                <div className="text-xs">Vector image</div>
              </button>
            </div>
          </div>

          {/* PNG Size Selection */}
          {format === 'png' && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Size</h3>
              <div className="grid grid-cols-3 gap-2">
                {PNG_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-2 rounded border transition-colors ${
                      selectedSize === size
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {size}×{size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Export Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleExport}
              disabled={exporting || !canvas}
              className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
            </button>

            {format === 'png' && (
              <button
                onClick={exportAllPNG}
                disabled={exporting || !canvas}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
              >
                Export All Sizes
              </button>
            )}
          </div>

          {/* Keyboard Hint */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Shortcut: <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Ctrl+E</kbd>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
