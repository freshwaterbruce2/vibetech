/**
 * ModelSelectorPanel Types
 */
import type { CostTracker } from '../../services/CostTracker';
import type { AIModel, ModelRegistry } from '../../services/ModelRegistry';

export interface ModelSelectorPanelProps {
  modelRegistry: ModelRegistry;
  costTracker: CostTracker;
  selectedModelId?: string;
  taskType?: string;
  onModelSelect: (modelId: string) => void;
  onClose: () => void;
}

export type SortCriteria = 'name' | 'cost' | 'speed' | 'quality';
export type FilterCapability = 'all' | 'code-generation' | 'code-review' | 'debugging' | 'reasoning';

export interface ModelSelectorPanelState {
  expandedModelId: string | null;
  filterCapability: FilterCapability;
  sortBy: SortCriteria;
  budgetInput: string;
}

// Re-export service types for convenience
export type { AIModel, ModelRegistry, CostTracker };
