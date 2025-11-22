import { useCallback, useState } from 'react';

import { EditorSettings } from '../types';

export interface UseAppSettingsReturn {
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  editorSettings: EditorSettings;
  updateEditorSettings: (settings: EditorSettings) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  workspaceFolder: string | null;
  setWorkspaceFolder: (folder: string | null) => void;
}

const defaultEditorSettings: EditorSettings = {
  theme: 'dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  autoSave: true,
  aiAutoComplete: true,
  aiSuggestions: true,
};

export function useAppSettings(): UseAppSettingsReturn {
  const [settingsOpen, setSettingsOpenState] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [workspaceFolder, setWorkspaceFolder] = useState<string | null>(null);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(defaultEditorSettings);

  const setSettingsOpen = useCallback((open: boolean) => {
    setSettingsOpenState(open);
  }, []);

  const updateEditorSettings = useCallback((settings: EditorSettings) => {
    setEditorSettings(settings);
    setSettingsOpen(false);
  }, [setSettingsOpen]);

  return {
    settingsOpen,
    setSettingsOpen,
    editorSettings,
    updateEditorSettings,
    sidebarOpen,
    setSidebarOpen,
    workspaceFolder,
    setWorkspaceFolder,
  };
}
