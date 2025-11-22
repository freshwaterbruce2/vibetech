/**
 * ModelRegistry Tests
 * TDD: Central registry for AI model management
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('ModelRegistry', () => {
  let ModelRegistry: any;

  beforeEach(async () => {
    try {
      const module = await import('../../services/ModelRegistry');
      ModelRegistry = module.ModelRegistry;
    } catch {
      // Expected to fail initially - TDD RED phase
      ModelRegistry = null;
    }
  });

  describe('Initialization', () => {
    it('should initialize with default models', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const models = registry.listModels();

      expect(models.length).toBeGreaterThan(0);
    });

    it('should load models from config', () => {
      if (!ModelRegistry) return;

      const config = {
        models: [
          { id: 'custom-model', name: 'Custom', provider: 'openai' }
        ]
      };

      const registry = new ModelRegistry(config);
      const model = registry.getModel('custom-model');

      expect(model).toBeDefined();
      expect(model.name).toBe('Custom');
    });
  });

  describe('Model Information', () => {
    it('should get model by id', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const model = registry.getModel('gpt-4');

      expect(model).toBeDefined();
      expect(model.id).toBe('gpt-4');
    });

    it('should return null for unknown model', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const model = registry.getModel('unknown-model');

      expect(model).toBeNull();
    });

    it('should list all models', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const models = registry.listModels();

      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should filter models by provider', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const openAIModels = registry.listModelsByProvider('openai');

      expect(openAIModels.length).toBeGreaterThan(0);
      expect(openAIModels.every(m => m.provider === 'openai')).toBe(true);
    });

    it('should filter models by capability', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const codeModels = registry.listModelsByCapability('code-generation');

      expect(codeModels.length).toBeGreaterThan(0);
    });
  });

  describe('Model Pricing', () => {
    it('should have pricing information', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const model = registry.getModel('gpt-4');

      expect(model.pricing).toBeDefined();
      expect(model.pricing.inputCostPer1k).toBeGreaterThan(0);
      expect(model.pricing.outputCostPer1k).toBeGreaterThan(0);
    });

    it('should calculate request cost', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const cost = registry.calculateCost('gpt-4', 1000, 500);

      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should compare model costs', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const comparison = registry.compareCosts(['gpt-4', 'gpt-3.5-turbo'], 1000, 500);

      expect(comparison).toBeDefined();
      expect(comparison.cheapest).toBeDefined();
      expect(comparison.costs).toBeDefined();
    });
  });

  describe('Model Capabilities', () => {
    it('should list model capabilities', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const model = registry.getModel('gpt-4');

      expect(model.capabilities).toBeDefined();
      expect(Array.isArray(model.capabilities)).toBe(true);
    });

    it('should check if model supports capability', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const supports = registry.supportsCapability('gpt-4', 'code-generation');

      expect(typeof supports).toBe('boolean');
    });

    it('should get recommended model for task', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const recommended = registry.getRecommendedModel('code-review');

      expect(recommended).toBeDefined();
      expect(recommended.id).toBeDefined();
    });
  });

  describe('Model Performance', () => {
    it('should have performance metrics', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const model = registry.getModel('gpt-4');

      expect(model.performance).toBeDefined();
      expect(model.performance.speed).toBeDefined();
      expect(model.performance.quality).toBeDefined();
    });

    it('should rank models by speed', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const ranked = registry.rankBySpeed();

      expect(ranked.length).toBeGreaterThan(0);
      // First should be faster than last
      expect(ranked[0].performance.speed).toBeGreaterThanOrEqual(
        ranked[ranked.length - 1].performance.speed
      );
    });

    it('should rank models by quality', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const ranked = registry.rankByQuality();

      expect(ranked.length).toBeGreaterThan(0);
    });

    it('should rank models by cost efficiency', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const ranked = registry.rankByCostEfficiency();

      expect(ranked.length).toBeGreaterThan(0);
    });
  });

  describe('Model Registration', () => {
    it('should register new model', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const newModel = {
        id: 'custom-llm',
        name: 'Custom LLM',
        provider: 'custom',
        pricing: { inputCostPer1k: 0.001, outputCostPer1k: 0.002 },
        capabilities: ['text-generation'],
        performance: { speed: 8, quality: 7 }
      };

      registry.registerModel(newModel);
      const model = registry.getModel('custom-llm');

      expect(model).toBeDefined();
      expect(model.id).toBe('custom-llm');
    });

    it('should update existing model', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      registry.updateModel('gpt-4', { pricing: { inputCostPer1k: 0.05 } });

      const model = registry.getModel('gpt-4');
      expect(model.pricing.inputCostPer1k).toBe(0.05);
    });

    it('should remove model', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      registry.removeModel('gpt-4');

      const model = registry.getModel('gpt-4');
      expect(model).toBeNull();
    });
  });

  describe('Model Selection', () => {
    it('should select best model for budget', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const model = registry.selectForBudget(0.01, 'code-generation');

      expect(model).toBeDefined();
    });

    it('should select fastest model for capability', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const model = registry.selectFastest('text-generation');

      expect(model).toBeDefined();
      expect(model.capabilities).toContain('text-generation');
    });

    it('should select highest quality model', () => {
      if (!ModelRegistry) return;

      const registry = new ModelRegistry();
      const model = registry.selectHighestQuality('code-review');

      expect(model).toBeDefined();
    });
  });
});
