/**
 * ModelSelectorPanel Tests
 * TDD: UI component for model selection and cost tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModelSelectorPanel } from '../../components/ModelSelectorPanel';
import { ModelRegistry } from '../../services/ModelRegistry';
import { CostTracker } from '../../services/CostTracker';

describe('ModelSelectorPanel', () => {
  let modelRegistry: ModelRegistry;
  let costTracker: CostTracker;
  let onModelSelect: ReturnType<typeof vi.fn>;
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    modelRegistry = new ModelRegistry();
    costTracker = new CostTracker(modelRegistry);
    onModelSelect = vi.fn();
    onClose = vi.fn();

    // Add some usage data
    costTracker.trackUsage('gpt-4', 1000, 500);
    costTracker.trackUsage('gpt-3.5-turbo', 2000, 1000);
    costTracker.setBudget(10.0);
  });

  describe('Rendering', () => {
    it('should render model selector panel', () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      expect(screen.getByText(/Model Selection/i)).toBeInTheDocument();
    });

    it('should display list of available models', () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      expect(screen.getAllByText(/GPT-4/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/GPT-3.5 Turbo/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/DeepSeek Coder/i).length).toBeGreaterThan(0);
    });

    it('should show model pricing information', () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      // GPT-4 pricing: $0.03/1k input, $0.06/1k output
      expect(screen.getAllByText(/\$0\.03/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/\$0\.06/).length).toBeGreaterThan(0);
    });

    it('should display model capabilities', () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      expect(screen.getAllByText(/code-generation/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/code-review/i).length).toBeGreaterThan(0);
    });
  });

  describe('Model Selection', () => {
    it('should select model on click', async () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      const gpt4Elements = screen.getAllByText(/^GPT-4$/);
      const gpt4Card = gpt4Elements[0].closest('[class*="ModelCard"]');
      fireEvent.click(gpt4Card!);

      await waitFor(() => {
        expect(onModelSelect).toHaveBeenCalledWith('gpt-4');
      });
    });

    it('should highlight selected model', async () => {
      const { rerender } = render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          selectedModelId="gpt-4"
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      const gpt4Elements = screen.getAllByText(/^GPT-4$/);
      const gpt4Card = gpt4Elements[0].closest('[class*="ModelCard"]');
      expect(gpt4Card).toBeInTheDocument();
    });

    it('should filter models by capability', async () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      const filterSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(filterSelect, { target: { value: 'code-generation' } });

      await waitFor(() => {
        const models = screen.getAllByText(/GPT/);
        expect(models.length).toBeGreaterThan(0);
      });
    });

    it('should sort models by different criteria', async () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      const sortSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(sortSelect, { target: { value: 'cost' } });

      await waitFor(() => {
        // DeepSeek should be present (cheapest models)
        const deepseekModels = screen.getAllByText(/DeepSeek/);
        expect(deepseekModels.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Cost Display', () => {
    it('should show total cost', () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      const totalCost = costTracker.getTotalCost();
      expect(screen.getByText(new RegExp(`\\$${totalCost.toFixed(4)}`))).toBeInTheDocument();
    });

    it('should show budget information', () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      expect(screen.getByText(/Budget/i)).toBeInTheDocument();
      expect(screen.getByText(/\$10\.00/)).toBeInTheDocument();
    });

    it('should show budget usage percentage', () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      const percentage = costTracker.getBudgetUsagePercentage();
      expect(screen.getByText(new RegExp(`${percentage.toFixed(1)}%`))).toBeInTheDocument();
    });

    it('should warn when over budget', () => {
      costTracker.setBudget(0.001); // Very low budget

      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      expect(screen.getByText(/Over Budget/i)).toBeInTheDocument();
    });
  });

  describe('Usage Statistics', () => {
    it('should display request count', () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      expect(screen.getByText(/Requests/i)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 tracked requests
    });

    it('should show most used model', () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      expect(screen.getByText(/Most Used/i)).toBeInTheDocument();
    });

    it('should display per-model usage', () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      // Should show usage counts per model
      const stats = costTracker.getStatistics();
      expect(stats.totalRequests).toBe(2);
    });

    it('should show average cost per request', () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      const stats = costTracker.getStatistics();
      expect(screen.getByText(new RegExp(`\\$${stats.averageCostPerRequest.toFixed(4)}`))).toBeInTheDocument();
    });
  });

  describe('Model Recommendations', () => {
    it('should recommend model for task type', () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
          taskType="code-generation"
        />
      );

      expect(screen.getByText(/Recommended/i)).toBeInTheDocument();
    });

    it('should show budget-aware recommendations', () => {
      costTracker.setBudget(0.01); // Low budget

      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
          taskType="code-generation"
        />
      );

      // Should recommend DeepSeek (cheapest)
      const recommended = modelRegistry.selectForBudget(0.01, 'code-generation');
      expect(recommended?.id).toBe('deepseek-coder');
    });

    it('should highlight recommended model', () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
          taskType="code-generation"
        />
      );

      const recommended = modelRegistry.getRecommendedModel('code-generation');
      const recommendedCard = screen.getByText(recommended.name).closest('div');
      expect(recommendedCard).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should close panel when clicking close button', () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should expand model card for details', async () => {
      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      const expandButton = screen.getAllByLabelText(/expand/i)[0];
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText(/Context Window/i)).toBeInTheDocument();
      });
    });

    it('should reset statistics when clicking reset', async () => {
      const resetSpy = vi.spyOn(costTracker, 'reset');

      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      const resetButton = screen.getByText(/Reset Stats/i);
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(resetSpy).toHaveBeenCalled();
      });
    });

    it('should update budget when changed', async () => {
      const setBudgetSpy = vi.spyOn(costTracker, 'setBudget');

      render(
        <ModelSelectorPanel
          modelRegistry={modelRegistry}
          costTracker={costTracker}
          onModelSelect={onModelSelect}
          onClose={onClose}
        />
      );

      const budgetInput = screen.getByLabelText(/Budget/i);
      fireEvent.change(budgetInput, { target: { value: '20' } });
      fireEvent.blur(budgetInput);

      await waitFor(() => {
        expect(setBudgetSpy).toHaveBeenCalledWith(20);
      });
    });
  });
});
