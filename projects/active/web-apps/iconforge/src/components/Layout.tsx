import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onExport?: () => void;
  onHelp?: () => void;
}

export function Layout({ children, onUndo, onRedo, canUndo = false, canRedo = false, onExport, onHelp }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">IconForge</h1>
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Phase 1 MVP</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Help Button */}
          {onHelp && (
            <button
              onClick={onHelp}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title="Show help guide"
            >
              ❓ Help
            </button>
          )}

          {/* Undo/Redo buttons */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-4">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-gray-100 rounded transition-colors"
              title="Undo (Ctrl+Z)"
            >
              ↶ Undo
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-gray-100 rounded transition-colors"
              title="Redo (Ctrl+Y)"
            >
              ↷ Redo
            </button>
          </div>

          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
            New Project
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
            Open
          </button>
          <button
            onClick={onExport}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            title="Export (Ctrl+E)"
          >
            Export
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
}
