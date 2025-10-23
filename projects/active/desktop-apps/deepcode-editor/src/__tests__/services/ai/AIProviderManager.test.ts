/**
 * Tests for AIProviderManager - Multi-provider AI system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIProviderManager } from '../../../services/ai/AIProviderManager';
import { AIProvider, MODEL_REGISTRY } from '../../../services/ai/AIProviderInterface';

vi.mock('../../../services/ai/providers/OpenAIProvider');
vi.mock('../../../services/ai/providers/AnthropicProvider');
vi.mock('../../../services/ai/providers/DeepSeekProvider');
vi.mock('../../../services/ai/providers/GoogleProvider');

describe('AIProviderManager', () => {
  let manager: AIProviderManager;

  beforeEach(() => {
    manager = new AIProviderManager();
  });

  describe('initialization', () => {
    it('should initialize successfully', () => {
      expect(manager).toBeDefined();
    });

    it('should handle missing environment variables', () => {
      expect(() => new AIProviderManager()).not.toThrow();
    });
  });

  describe('provider configuration', () => {
    it('should set a provider with config', async () => {
      await manager.setProvider(AIProvider.DEEPSEEK, {
        provider: AIProvider.DEEPSEEK,
        apiKey: 'test-key',
        model: 'deepseek-chat',
      });

      expect(manager.isProviderConfigured(AIProvider.DEEPSEEK)).toBe(true);
    });

    it('should set current provider when first provider is added', async () => {
      await manager.setProvider(AIProvider.OPENAI, {
        provider: AIProvider.OPENAI,
        apiKey: 'test-key',
        model: 'gpt-4',
      });

      const current = manager.getCurrentProvider();
      expect(current).not.toBeNull();
    });

    it('should switch current provider', async () => {
      await manager.setProvider(AIProvider.DEEPSEEK, {
        provider: AIProvider.DEEPSEEK,
        apiKey: 'key1',
        model: 'deepseek-chat',
      });

      await manager.setProvider(AIProvider.OPENAI, {
        provider: AIProvider.OPENAI,
        apiKey: 'key2',
        model: 'gpt-4',
      });

      manager.setCurrentProvider(AIProvider.OPENAI);
      expect(manager.getCurrentProvider()).not.toBeNull();
    });

    it('should throw error when setting unconfigured provider as current', () => {
      expect(() => {
        manager.setCurrentProvider(AIProvider.ANTHROPIC);
      }).toThrow();
    });

    it('should return configured providers', async () => {
      await manager.setProvider(AIProvider.DEEPSEEK, {
        provider: AIProvider.DEEPSEEK,
        apiKey: 'key1',
        model: 'deepseek-chat',
      });

      await manager.setProvider(AIProvider.OPENAI, {
        provider: AIProvider.OPENAI,
        apiKey: 'key2',
        model: 'gpt-4',
      });

      const providers = manager.getConfiguredProviders();
      expect(providers).toContain(AIProvider.DEEPSEEK);
      expect(providers).toContain(AIProvider.OPENAI);
    });
  });

  describe('model registry', () => {
    it('should return available models', () => {
      const models = manager.getAvailableModels();
      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return model info', () => {
      const models = Object.keys(MODEL_REGISTRY);
      if (models.length > 0) {
        const info = manager.getModelInfo(models[0]);
        expect(info).toBeDefined();
        expect(info).toHaveProperty('id');
        expect(info).toHaveProperty('provider');
        expect(info).toHaveProperty('name');
      }
    });

    it('should return undefined for unknown model', () => {
      const info = manager.getModelInfo('unknown-model-xyz');
      expect(info).toBeUndefined();
    });
  });

  describe('completion', () => {
    it('should throw error for unknown model', async () => {
      await expect(
        manager.complete('unknown-model', {
          messages: [{ role: 'user', content: 'test' }],
        })
      ).rejects.toThrow('Unknown model');
    });

    it('should throw error for unconfigured provider', async () => {
      const modelId = Object.keys(MODEL_REGISTRY)[0];
      await expect(
        manager.complete(modelId, {
          messages: [{ role: 'user', content: 'test' }],
        })
      ).rejects.toThrow('not configured');
    });
  });

  describe('streaming completion', () => {
    it('should throw error for unknown model in streaming', async () => {
      const gen = manager.streamComplete('unknown-model', {
        messages: [{ role: 'user', content: 'test' }],
      });

      await expect(gen.next()).rejects.toThrow('Unknown model');
    });

    it('should throw error for unconfigured provider in streaming', async () => {
      const modelId = Object.keys(MODEL_REGISTRY)[0];
      const gen = manager.streamComplete(modelId, {
        messages: [{ role: 'user', content: 'test' }],
      });

      await expect(gen.next()).rejects.toThrow('not configured');
    });
  });

  describe('provider checking', () => {
    it('should return false for unconfigured provider', () => {
      expect(manager.isProviderConfigured(AIProvider.ANTHROPIC)).toBe(false);
    });

    it('should return true after provider is configured', async () => {
      await manager.setProvider(AIProvider.GOOGLE, {
        provider: AIProvider.GOOGLE,
        apiKey: 'test-key',
        model: 'gemini-pro',
      });

      expect(manager.isProviderConfigured(AIProvider.GOOGLE)).toBe(true);
    });
  });
});
