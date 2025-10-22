/**
 * ModelSelectorPanel - Visual interface for model selection and cost tracking
 */

import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { X, ChevronDown, ChevronUp, DollarSign, TrendingUp, Zap, Award } from 'lucide-react';
import type { ModelRegistry, AIModel } from '../services/ModelRegistry';
import type { CostTracker } from '../services/CostTracker';

export interface ModelSelectorPanelProps {
  modelRegistry: ModelRegistry;
  costTracker: CostTracker;
  selectedModelId?: string;
  taskType?: string;
  onModelSelect: (modelId: string) => void;
  onClose: () => void;
}

type SortCriteria = 'name' | 'cost' | 'speed' | 'quality';
type FilterCapability = 'all' | 'code-generation' | 'code-review' | 'debugging' | 'reasoning';

export const ModelSelectorPanel: React.FC<ModelSelectorPanelProps> = ({
  modelRegistry,
  costTracker,
  selectedModelId,
  taskType,
  onModelSelect,
  onClose
}) => {
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
    if (!taskType) return null;
    return modelRegistry.getRecommendedModel(taskType);
  }, [modelRegistry, taskType]);

  // Get usage statistics
  const stats = costTracker.getStatistics();
  const isOverBudget = costTracker.isOverBudget();
  const budgetUsagePercentage = costTracker.getBudgetUsagePercentage();
  const mostUsedModel = costTracker.getMostUsedModel();

  const handleBudgetChange = () => {
    const value = parseFloat(budgetInput);
    if (!isNaN(value) && value > 0) {
      costTracker.setBudget(value);
    }
  };

  const handleReset = () => {
    costTracker.reset();
    // Force re-render by updating state
    setFilterCapability('all');
  };

  return (
    <PanelContainer>
      <PanelHeader>
        <Title>
          <DollarSign size={20} />
          Model Selection & Cost Tracking
        </Title>
        <CloseButton onClick={onClose} aria-label="close">
          <X size={20} />
        </CloseButton>
      </PanelHeader>

      {/* Statistics Overview */}
      <StatsSection>
        <StatCard>
          <StatLabel>Total Cost</StatLabel>
          <StatValue>${stats.totalCost.toFixed(4)}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Requests</StatLabel>
          <StatValue>{stats.totalRequests}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Avg/Request</StatLabel>
          <StatValue>${stats.averageCostPerRequest.toFixed(4)}</StatValue>
        </StatCard>
        {mostUsedModel && (
          <StatCard>
            <StatLabel>Most Used</StatLabel>
            <StatValue>{modelRegistry.getModel(mostUsedModel)?.name || mostUsedModel}</StatValue>
          </StatCard>
        )}
      </StatsSection>

      {/* Budget Management */}
      <BudgetSection>
        <BudgetHeader>
          <span>Budget</span>
          <BudgetInput
            type="number"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            onBlur={handleBudgetChange}
            aria-label="Budget"
          />
        </BudgetHeader>
        <BudgetBar>
          <BudgetProgress $width={Math.min(budgetUsagePercentage, 100)} $isOver={isOverBudget} />
        </BudgetBar>
        <BudgetText>
          {isOverBudget ? (
            <OverBudgetWarning>Over Budget!</OverBudgetWarning>
          ) : (
            <span>
              ${costTracker.getRemainingBudget().toFixed(2)} remaining ({budgetUsagePercentage.toFixed(1)}% used)
            </span>
          )}
        </BudgetText>
      </BudgetSection>

      {/* Filters and Sorting */}
      <ControlsSection>
        <ControlGroup>
          <label>Filter by Capability:</label>
          <Select
            value={filterCapability}
            onChange={(e) => setFilterCapability(e.target.value as FilterCapability)}
            role="combobox"
          >
            <option value="all">All Models</option>
            <option value="code-generation">Code Generation</option>
            <option value="code-review">Code Review</option>
            <option value="debugging">Debugging</option>
            <option value="reasoning">Reasoning</option>
          </Select>
        </ControlGroup>
        <ControlGroup>
          <label>Sort by:</label>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortCriteria)}
            role="combobox"
          >
            <option value="name">Name</option>
            <option value="cost">Cost</option>
            <option value="speed">Speed</option>
            <option value="quality">Quality</option>
          </Select>
        </ControlGroup>
      </ControlsSection>

      {/* Model Cards */}
      <ModelsSection>
        {models.map((model) => {
          const isExpanded = expandedModelId === model.id;
          const isSelected = selectedModelId === model.id;
          const isRecommended = recommendedModel?.id === model.id;
          const modelUsage = costTracker.getModelUsage(model.id);

          return (
            <ModelCard
              key={model.id}
              $isSelected={isSelected}
              $isRecommended={isRecommended}
              onClick={() => onModelSelect(model.id)}
            >
              <ModelHeader>
                <ModelName>
                  {model.name}
                  {isRecommended && <RecommendedBadge><Award size={14} /> Recommended</RecommendedBadge>}
                </ModelName>
                <ExpandButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedModelId(isExpanded ? null : model.id);
                  }}
                  aria-label={isExpanded ? 'collapse' : 'expand'}
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </ExpandButton>
              </ModelHeader>

              <ModelProvider>{model.provider.toUpperCase()}</ModelProvider>

              <PricingRow>
                <PricingLabel>Input:</PricingLabel>
                <PricingValue>${model.pricing.inputCostPer1k.toFixed(5)}/1k</PricingValue>
                <PricingLabel>Output:</PricingLabel>
                <PricingValue>${model.pricing.outputCostPer1k.toFixed(5)}/1k</PricingValue>
              </PricingRow>

              <PerformanceRow>
                <PerformanceMetric>
                  <Zap size={14} />
                  Speed: {model.performance.speed}/10
                </PerformanceMetric>
                <PerformanceMetric>
                  <TrendingUp size={14} />
                  Quality: {model.performance.quality}/10
                </PerformanceMetric>
              </PerformanceRow>

              {modelUsage.requestCount > 0 && (
                <UsageRow>
                  <UsageLabel>Usage:</UsageLabel>
                  <UsageValue>
                    {modelUsage.requestCount} requests · ${modelUsage.totalCost.toFixed(4)}
                  </UsageValue>
                </UsageRow>
              )}

              {isExpanded && (
                <ExpandedDetails>
                  <DetailRow>
                    <DetailLabel>Context Window:</DetailLabel>
                    <DetailValue>{model.contextWindow?.toLocaleString()} tokens</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Max Output:</DetailLabel>
                    <DetailValue>{model.maxTokens?.toLocaleString()} tokens</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Capabilities:</DetailLabel>
                  </DetailRow>
                  <CapabilitiesGrid>
                    {model.capabilities.map((cap) => (
                      <CapabilityBadge key={cap}>{cap}</CapabilityBadge>
                    ))}
                  </CapabilitiesGrid>
                </ExpandedDetails>
              )}
            </ModelCard>
          );
        })}
      </ModelsSection>

      {/* Actions */}
      <ActionsSection>
        <ResetButton onClick={handleReset}>Reset Stats</ResetButton>
      </ActionsSection>
    </PanelContainer>
  );
};

// Styled Components

const PanelContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 480px;
  height: 100vh;
  background: #1e1e1e;
  border-left: 1px solid #333;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #333;
  background: #252525;
`;

const Title = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;

  &:hover {
    color: #fff;
  }
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
  background: #252525;
  border-bottom: 1px solid #333;
`;

const StatCard = styled.div`
  background: #1e1e1e;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #333;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
`;

const BudgetSection = styled.div`
  padding: 16px;
  background: #252525;
  border-bottom: 1px solid #333;
`;

const BudgetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #fff;
  font-size: 14px;
`;

const BudgetInput = styled.input`
  width: 80px;
  padding: 4px 8px;
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #007acc;
  }
`;

const BudgetBar = styled.div`
  width: 100%;
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const BudgetProgress = styled.div<{ $width: number; $isOver: boolean }>`
  height: 100%;
  width: ${(props) => props.$width}%;
  background: ${(props) => (props.$isOver ? '#f44336' : '#4caf50')};
  transition: width 0.3s, background 0.3s;
`;

const BudgetText = styled.div`
  font-size: 12px;
  color: #888;
  text-align: center;
`;

const OverBudgetWarning = styled.span`
  color: #f44336;
  font-weight: 600;
`;

const ControlsSection = styled.div`
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #252525;
  border-bottom: 1px solid #333;
`;

const ControlGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 12px;
    color: #888;
  }
`;

const Select = styled.select`
  padding: 6px;
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #007acc;
  }
`;

const ModelsSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ModelCard = styled.div<{ $isSelected: boolean; $isRecommended: boolean }>`
  background: #252525;
  border: 2px solid ${(props) => (props.$isSelected ? '#007acc' : props.$isRecommended ? '#ffa726' : '#333')};
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #007acc;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 122, 204, 0.2);
  }
`;

const ModelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const ModelName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RecommendedBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #ffa726;
  background: rgba(255, 167, 38, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;

  &:hover {
    color: #fff;
  }
`;

const ModelProvider = styled.div`
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const PricingRow = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto 1fr;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
`;

const PricingLabel = styled.span`
  color: #888;
`;

const PricingValue = styled.span`
  color: #4caf50;
  font-weight: 500;
`;

const PerformanceRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
`;

const PerformanceMetric = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #888;

  svg {
    color: #ffa726;
  }
`;

const UsageRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding-top: 8px;
  border-top: 1px solid #333;
`;

const UsageLabel = styled.span`
  color: #888;
`;

const UsageValue = styled.span`
  color: #fff;
  font-weight: 500;
`;

const ExpandedDetails = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #333;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
`;

const DetailLabel = styled.span`
  color: #888;
`;

const DetailValue = styled.span`
  color: #fff;
  font-weight: 500;
`;

const CapabilitiesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const CapabilityBadge = styled.span`
  font-size: 10px;
  color: #007acc;
  background: rgba(0, 122, 204, 0.1);
  padding: 3px 8px;
  border-radius: 12px;
  border: 1px solid rgba(0, 122, 204, 0.3);
`;

const ActionsSection = styled.div`
  padding: 16px;
  border-top: 1px solid #333;
  background: #252525;
`;

const ResetButton = styled.button`
  width: 100%;
  padding: 8px;
  background: #f44336;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #d32f2f;
  }
`;
