import { useState, useEffect } from 'react';

interface WelcomeOverlayProps {
  onClose: () => void;
}

export function WelcomeOverlay({ onClose }: WelcomeOverlayProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has seen welcome before
    const hasSeenWelcome = localStorage.getItem('iconforge_welcome_seen');
    if (!hasSeenWelcome) {
      setShow(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('iconforge_welcome_seen', 'true');
    setShow(false);
    onClose();
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50" />

      {/* Welcome Card */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 animate-fade-in">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to IconForge
            </h1>
            <p className="text-gray-600">
              Create beautiful icons in seconds with our easy-to-use editor
            </p>
          </div>

          {/* Quick Start Guide */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Start Guide</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Select a Shape Tool</h3>
                  <p className="text-sm text-gray-600">
                    Click a shape icon in the left toolbar (circle, rectangle, star, etc.)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Click on Canvas to Add Shape</h3>
                  <p className="text-sm text-gray-600">
                    Click anywhere on the white canvas to place your shape
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Customize Your Shape</h3>
                  <p className="text-sm text-gray-600">
                    Use the Properties Panel on the right to change colors, size, rotation, and more
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Export Your Icon</h3>
                  <p className="text-sm text-gray-600">
                    Click the blue "Export" button in the header to save as PNG or SVG
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Useful Keyboard Shortcuts</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300 text-xs">Ctrl+Z</kbd>
                <span className="text-gray-600 ml-2">Undo</span>
              </div>
              <div>
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300 text-xs">Ctrl+Y</kbd>
                <span className="text-gray-600 ml-2">Redo</span>
              </div>
              <div>
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300 text-xs">C</kbd>
                <span className="text-gray-600 ml-2">Change fill color</span>
              </div>
              <div>
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300 text-xs">S</kbd>
                <span className="text-gray-600 ml-2">Change stroke color</span>
              </div>
              <div>
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300 text-xs">Ctrl+E</kbd>
                <span className="text-gray-600 ml-2">Export</span>
              </div>
              <div>
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300 text-xs">Delete</kbd>
                <span className="text-gray-600 ml-2">Delete selected</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleClose}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </button>

          {/* Show Again Option */}
          <p className="text-center text-xs text-gray-500 mt-4">
            You can show this guide again by clearing your browser data
          </p>
        </div>
      </div>
    </>
  );
}
