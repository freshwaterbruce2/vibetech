/**
 * useModelSelector Hook
 * State and logic for the ModelSelectorPanel component
 */
import { useCallback, useMemo, useState } from 'react';

import type { CostTracker } from '../../services/CostTracker';
import type { AIModel, ModelRegistry } from '../../services/ModelRegistry';
import type { FilterCapability, SortCriteria } from './types';

interface UseModelSelectorOptions {
  modelRegistry: ModelRegistry;
  costTracker: CostTracker;
  taskType?: string;
}

export function useModelSelector(options: UseModelSelectorOptions) {
  const { modelRegistry, costTracker, taskType } = options;

  const [expandedModelId, setExpandedModelId] = useState<string | null>(null);
  const [filterCapability, setFilterCapability] = useState<FilterCapability>('all');
  const [sortBy, setSortBy] = useState<SortCriteria>('name');
  const [budgetInput, setBudgetInput] = useState<string>(
    costTracker.getBudget()?.toString() || '10'
  );

  // Get filtered and sorted models
  const models = useMemo(() => {
    let filtered = modelRegistry.listModels();

    if (filterCapability !== 'all') {
      filtered = modelRegistry.listModelsByCapability(filterCapability);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'cost':
          return (
            (a.pricing.inputCostPer1k + a.pricing.outputCostPer1k) -
            (b.pricing.inputCostPer1k + b.pricing.outputCostPer1k)
          );
        case 'speed':
          return b.performance.speed - a.performance.speed;
        case 'quality':
          return b.performance.quality - a.performance.quality;
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [modelRegistry, filterCapability, sortBy]);

  // Get recommended model for task type
  const recommendedModel = useMemo(() => {
    if (!taskType) { return null; }
    return modelRegistry.getRecommendedModel(taskType);
  }, [modelRegistry, taskType]);

  // Get usage statistics
  const stats = costTracker.getStatistics();
  const isOverBudget = costTracker.isOverBudget();
  const budgetUsagePercentage = costTracker.getBudgetUsagePercentage();
  const mostUsedModel = costTracker.getMostUsedModel();

  const handleBudgetChange = useCallback(() => {
    const value = parseFloat(budgetInput);
    if (!isNaN(value) && value > 0) {
      costTracker.setBudget(value);
    }
  }, [budgetInput, costTracker]);

  const handleReset = useCallback(() => {
    costTracker.reset();
    // Force re-render by updating state
    setFilterCapability('all');
  }, [costTracker]);

  const toggleExpanded = useCallback((modelId: string) => {
    setExpandedModelId(prev => prev === modelId ? null : modelId);
  }, []);

  const isExpanded = useCallback((modelId: string) => {
    return expandedModelId === modelId;
  }, [expandedModelId]);

  const getModelUsage = useCallback((modelId: string) => {
    return costTracker.getModelUsage(modelId);
  }, [costTracker]);

  const getModelName = useCallback((modelId: string) => {
    return modelRegistry.getModel(modelId)?.name || modelId;
  }, [modelRegistry]);

  const getRemainingBudget = useCallback(() => {
    return costTracker.getRemainingBudget();
  }, [costTracker]);

  return {
    // State
    expandedModelId,
    filterCapability,
    setFilterCapability,
    sortBy,
    setSortBy,
    budgetInput,
    setBudgetInput,

    // Computed
    models,
    recommendedModel,
    stats,
    isOverBudget,
    budgetUsagePercentage,
    mostUsedModel,

    // Actions
    handleBudgetChange,
    handleReset,
    toggleExpanded,
    isExpanded,
    getModelUsage,
    getModelName,
    getRemainingBudget,
  };
}
