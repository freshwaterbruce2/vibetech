/**
 * ModelSelectorPanel Component
 * Visual interface for model selection and cost tracking
 */
import React from 'react';

import { Award, ChevronDown, ChevronUp, DollarSign, TrendingUp, X, Zap } from 'lucide-react';

import type { FilterCapability, ModelSelectorPanelProps, SortCriteria } from './types';
import {
  ActionsSection,
  BudgetBar,
  BudgetHeader,
  BudgetInput,
  BudgetProgress,
  BudgetSection,
  BudgetText,
  CapabilitiesGrid,
  CapabilityBadge,
  CloseButton,
  ControlGroup,
  ControlsSection,
  DetailLabel,
  DetailRow,
  DetailValue,
  ExpandButton,
  ExpandedDetails,
  ModelCard,
  ModelHeader,
  ModelName,
  ModelProvider,
  ModelsSection,
  OverBudgetWarning,
  PanelContainer,
  PanelHeader,
  PerformanceMetric,
  PerformanceRow,
  PricingLabel,
  PricingRow,
  PricingValue,
  RecommendedBadge,
  ResetButton,
  Select,
  StatCard,
  StatLabel,
  StatsSection,
  StatValue,
  Title,
  UsageLabel,
  UsageRow,
  UsageValue,
} from './styled';
import { useModelSelector } from './useModelSelector';

export const ModelSelectorPanel: React.FC<ModelSelectorPanelProps> = ({
  modelRegistry,
  costTracker,
  selectedModelId,
  taskType,
  onModelSelect,
  onClose,
}) => {
  const {
    filterCapability,
    setFilterCapability,
    sortBy,
    setSortBy,
    budgetInput,
    setBudgetInput,
    models,
    recommendedModel,
    stats,
    isOverBudget,
    budgetUsagePercentage,
    mostUsedModel,
    handleBudgetChange,
    handleReset,
    toggleExpanded,
    isExpanded,
    getModelUsage,
    getModelName,
    getRemainingBudget,
  } = useModelSelector({ modelRegistry, costTracker, taskType });

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
            <StatValue>{getModelName(mostUsedModel)}</StatValue>
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
              ${getRemainingBudget().toFixed(2)} remaining ({budgetUsagePercentage.toFixed(1)}% used)
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
          const expanded = isExpanded(model.id);
          const isSelected = selectedModelId === model.id;
          const isRecommended = recommendedModel?.id === model.id;
          const modelUsage = getModelUsage(model.id);

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
                    toggleExpanded(model.id);
                  }}
                  aria-label={expanded ? 'collapse' : 'expand'}
                >
                  {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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

              {expanded && (
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

// Export all types and modules
export * from './types';
export * from './styled';
export { useModelSelector } from './useModelSelector';
export default ModelSelectorPanel;
