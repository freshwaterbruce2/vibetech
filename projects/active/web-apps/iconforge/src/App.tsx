import { useState, useEffect } from 'react';
import { Canvas } from 'fabric';
import { Layout } from './components/Layout';
import { Toolbar } from './components/Toolbar';
import { CanvasEditor } from './components/CanvasEditor';
import { LayerPanel } from './components/LayerPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ColorPicker } from './components/ColorPicker';
import { ExportDialog } from './components/ExportDialog';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { Toast } from './components/Toast';
import { useHistory } from './hooks/useHistory';
import type { Tool } from './components/Toolbar';

function App() {
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorPickerMode, setColorPickerMode] = useState<'fill' | 'stroke'>('fill');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const { saveState, undo, redo, canUndo, canRedo } = useHistory(canvas);

  const openColorPicker = (mode: 'fill' | 'stroke') => {
    setColorPickerMode(mode);
    setColorPickerOpen(true);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleUndo = () => {
    if (undo()) {
      showToast('Undone');
    }
  };

  const handleRedo = () => {
    if (redo()) {
      showToast('Redone');
    }
  };

  // Save state when canvas changes
  useEffect(() => {
    if (!canvas) return;

    const handleObjectModified = () => {
      saveState();
    };

    const handleObjectAdded = () => {
      saveState();
    };

    const handleObjectRemoved = () => {
      saveState();
    };

    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:removed', handleObjectRemoved);

    // Save initial state
    setTimeout(() => saveState(), 100);

    return () => {
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:removed', handleObjectRemoved);
    };
  }, [canvas, saveState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Export (Ctrl+E)
      if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setExportDialogOpen(true);
        return;
      }

      // Undo/Redo (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
      if (e.ctrlKey && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (e.ctrlKey && (e.key === 'y' || e.key === 'Y' || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Delete (only when object is selected)
      if (!canvas) return;
      const activeObject = canvas.getActiveObject();

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeObject) {
          e.preventDefault();
          canvas.remove(activeObject);
          canvas.renderAll();
          showToast('Object deleted');
        }
        return;
      }

      // Color picker shortcuts (only when object is selected)
      if (!activeObject) return;

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        openColorPicker('fill');
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        openColorPicker('stroke');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvas, handleUndo, handleRedo]);

  return (
    <>
      <Layout
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onExport={() => setExportDialogOpen(true)}
        onHelp={() => {}}
      >
        <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />
        <CanvasEditor
          activeTool={activeTool}
          onCanvasReady={setCanvas}
          onToolChange={setActiveTool}
        />
        <PropertiesPanel canvas={canvas} onOpenColorPicker={openColorPicker} />
        <LayerPanel canvas={canvas} />
      </Layout>
      <ColorPicker
        canvas={canvas}
        isOpen={colorPickerOpen}
        onClose={() => setColorPickerOpen(false)}
        mode={colorPickerMode}
      />
      <ExportDialog
        canvas={canvas}
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      />
      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
      <WelcomeOverlay onClose={() => {}} />
    </>
  );
}

export default App;
