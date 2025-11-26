/**
 * useCustomInstructions Hook
 * State and logic for managing custom instructions/rules
 */
import { useCallback, useEffect, useState } from 'react';

import type { DeepCodeRules } from '../../types/customInstructions';
import type { TabType } from './types';

interface UseCustomInstructionsOptions {
  currentRules?: DeepCodeRules;
  onSaveRules: (rules: DeepCodeRules) => Promise<void>;
  onLoadRules: () => Promise<DeepCodeRules | null>;
  onExportRules: (rules: DeepCodeRules) => void;
  onImportRules: (file: File) => Promise<void>;
}

export function useCustomInstructions(options: UseCustomInstructionsOptions) {
  const { currentRules, onSaveRules, onLoadRules, onExportRules, onImportRules } = options;

  const [rules, setRules] = useState<DeepCodeRules | null>(currentRules || null);
  const [activeTab, setActiveTab] = useState<TabType>('global');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (currentRules) {
      setRules(currentRules);
    } else {
      loadRules();
    }
  }, [currentRules]);

  const loadRules = useCallback(async () => {
    const loaded = await onLoadRules();
    if (loaded) {
      setRules(loaded);
    }
  }, [onLoadRules]);

  const handleSave = useCallback(async () => {
    if (rules) {
      await onSaveRules(rules);
      setIsEditing(false);
    }
  }, [rules, onSaveRules]);

  const handleExport = useCallback(() => {
    if (rules) {
      onExportRules(rules);
    }
  }, [rules, onExportRules]);

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await onImportRules(file);
      await loadRules();
    }
  }, [onImportRules, loadRules]);

  const updateNestedValue = useCallback((path: string, value: any) => {
    if (!rules) return;

    const parts = path.split('.');
    const newRules = { ...rules };
    let current: any = newRules;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part && !current[part]) {
        current[part] = {};
      }
      if (part) {
        current = current[part];
      }
    }

    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      current[lastPart] = value;
    }
    setRules(newRules);
  }, [rules]);

  const createNewRules = useCallback(() => {
    setRules({ version: '1.0' });
  }, []);

  return {
    // State
    rules,
    setRules,
    activeTab,
    setActiveTab,
    isEditing,
    setIsEditing,
    editedContent,
    setEditedContent,
    selectedTemplate,
    setSelectedTemplate,

    // Actions
    loadRules,
    handleSave,
    handleExport,
    handleImport,
    updateNestedValue,
    createNewRules,
  };
}
