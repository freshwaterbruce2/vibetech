/**
 * useSettings Hook
 * State and logic for managing editor settings
 */
import { useCallback, useEffect, useState } from 'react';

import type { EditorSettings } from '../../types';
import { DEFAULT_SETTINGS, MODEL_PRICING, REASONING_MODELS } from './types';
import type { ModelId, ModelPricing } from './types';

interface UseSettingsOptions {
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
  onClose: () => void;
}

export function useSettings(options: UseSettingsOptions) {
  const { settings, onSettingsChange, onClose } = options;

  const [localSettings, setLocalSettings] = useState<EditorSettings>(settings);
  const [showModelComparison, setShowModelComparison] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = useCallback(() => {
    onSettingsChange(localSettings);
    onClose();
  }, [localSettings, onSettingsChange, onClose]);

  const handleReset = useCallback(() => {
    setLocalSettings(DEFAULT_SETTINGS);
  }, []);

  const updateSetting = useCallback(<K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const getModelPricing = useCallback((modelId: string | undefined): ModelPricing | null => {
    if (!modelId) return null;
    return MODEL_PRICING[modelId as ModelId] || null;
  }, []);

  const isReasoningModel = useCallback((modelId: string | undefined): boolean => {
    if (!modelId) return false;
    return REASONING_MODELS.includes(modelId as ModelId);
  }, []);

  const toggleModelComparison = useCallback(() => {
    setShowModelComparison(prev => !prev);
  }, []);

  return {
    // State
    localSettings,
    showModelComparison,

    // Actions
    handleSave,
    handleReset,
    updateSetting,
    getModelPricing,
    isReasoningModel,
    toggleModelComparison,
  };
}
