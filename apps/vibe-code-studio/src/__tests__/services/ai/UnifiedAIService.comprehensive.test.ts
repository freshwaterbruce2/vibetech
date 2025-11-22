/**
 * Comprehensive tests for UnifiedAIService
 *
 * Coverage Areas:
 * - Provider initialization from stored API keys
 * - Model selection and provider configuration
 * - Demo mode vs production mode behavior
 * - Contextual message sending (non-streaming)
 * - Streaming message responses
 * - System prompt building with context
 * - Multi-provider support
 * - Error handling for missing API keys
 * - Backward compatibility interface
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { UnifiedAIService } from '../../../services/ai/UnifiedAIService';
import { AIProviderManager } from '../../../services/ai/AIProviderManager';
import { AIProvider, MODEL_REGISTRY } from '../../../services/ai/AIProviderInterface';
import { SecureApiKeyManager } from '../../../utils/SecureApiKeyManager';
import { DemoResponseProvider } from '../../../services/ai/DemoResponseProvider';
import { AIContextRequest } from '../../../types';

// Mock dependencies
vi.mock('../../../services/ai/AIProviderManager');
vi.mock('../../../utils/SecureApiKeyManager');
vi.mock('../../../services/ai/DemoResponseProvider');

describe('UnifiedAIService', () => {
  let service: UnifiedAIService;
  let mockProviderManager: any;
  let mockKeyManager: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock provider manager
    mockProviderManager = {
      setProvider: vi.fn().mockResolvedValue(undefined),
      isProviderConfigured: vi.fn().mockReturnValue(false),
      complete: vi.fn().mockResolvedValue({
        content: 'Test response',
        usage: { total_tokens: 100 },
      }),
      streamComplete: vi.fn(),
      getAvailableModels: vi.fn().mockReturnValue(['deepseek-v3-2-exp', 'gpt-5', 'claude-sonnet-4-5']),
    };

    (AIProviderManager as any).mockImplementation(() => mockProviderManager);

    // Setup mock key manager
    mockKeyManager = {
      getStoredProviders: vi.fn().mockReturnValue([]),
      getApiKey: vi.fn().mockReturnValue(null),
      getInstance: vi.fn().mockReturnValue(mockKeyManager),
    };

    (SecureApiKeyManager.getInstance as any).mockReturnValue(mockKeyManager);

    // Setup demo response provider
    (DemoResponseProvider.getContextualResponse as any).mockReturnValue({
      content: 'Demo response',
      metadata: {
        model: 'demo',
        tokens: 0,
        processing_time: 0,
      },
    });
  });

  describe('initialization', () => {
    it('should initialize with default model', () => {
      service = new UnifiedAIService();
      expect(service.getCurrentModel()).toBe('deepseek-v3-2-exp');
    });

    it('should initialize with custom model', () => {
      service = new UnifiedAIService('gpt-5');
      expect(service.getCurrentModel()).toBe('gpt-5');
    });

    it('should start in demo mode by default', () => {
      service = new UnifiedAIService();
      expect(service.isDemo()).toBe(true);
    });

    it('should initialize SecureApiKeyManager', () => {
      service = new UnifiedAIService();
      expect(SecureApiKeyManager.getInstance).toHaveBeenCalled();
    });

    it('should create AIProviderManager instance', () => {
      service = new UnifiedAIService();
      expect(AIProviderManager).toHaveBeenCalled();
    });
  });

  describe('provider initialization from storage', () => {
    it('should initialize OpenAI provider if API key exists', async () => {
      mockKeyManager.getStoredProviders.mockReturnValue([
        { provider: 'openai' },
      ]);
      mockKeyManager.getApiKey.mockReturnValue('test-openai-key');

      service = new UnifiedAIService();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockProviderManager.setProvider).toHaveBeenCalledWith(
        AIProvider.OPENAI,
        expect.objectContaining({
          provider: AIProvider.OPENAI,
          apiKey: 'test-openai-key',
        })
      );
    });

    it('should initialize Anthropic provider if API key exists', async () => {
      mockKeyManager.getStoredProviders.mockReturnValue([
        { provider: 'anthropic' },
      ]);
      mockKeyManager.getApiKey.mockReturnValue('test-anthropic-key');

      service = new UnifiedAIService();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockProviderManager.setProvider).toHaveBeenCalledWith(
        AIProvider.ANTHROPIC,
        expect.objectContaining({
          provider: AIProvider.ANTHROPIC,
          apiKey: 'test-anthropic-key',
        })
      );
    });

    it('should initialize Google provider if API key exists', async () => {
      mockKeyManager.getStoredProviders.mockReturnValue([
        { provider: 'google' },
      ]);
      mockKeyManager.getApiKey.mockReturnValue('test-google-key');

      service = new UnifiedAIService();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockProviderManager.setProvider).toHaveBeenCalledWith(
        AIProvider.GOOGLE,
        expect.objectContaining({
          provider: AIProvider.GOOGLE,
          apiKey: 'test-google-key',
        })
      );
    });

    it('should initialize DeepSeek provider if API key exists', async () => {
      mockKeyManager.getStoredProviders.mockReturnValue([
        { provider: 'deepseek' },
      ]);
      mockKeyManager.getApiKey.mockReturnValue('test-deepseek-key');

      service = new UnifiedAIService();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockProviderManager.setProvider).toHaveBeenCalledWith(
        AIProvider.DEEPSEEK,
        expect.objectContaining({
          provider: AIProvider.DEEPSEEK,
          apiKey: 'test-deepseek-key',
        })
      );
    });

    it('should exit demo mode when at least one provider is initialized', async () => {
      mockKeyManager.getStoredProviders.mockReturnValue([
        { provider: 'openai' },
      ]);
      mockKeyManager.getApiKey.mockReturnValue('test-key');

      service = new UnifiedAIService();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(service.isDemo()).toBe(false);
    });

    it('should initialize multiple providers', async () => {
      mockKeyManager.getStoredProviders.mockReturnValue([
        { provider: 'openai' },
        { provider: 'anthropic' },
      ]);
      mockKeyManager.getApiKey
        .mockReturnValueOnce('openai-key')
        .mockReturnValueOnce('anthropic-key');

      service = new UnifiedAIService();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockProviderManager.setProvider).toHaveBeenCalledTimes(2);
    });

    it('should handle provider initialization errors gracefully', async () => {
      mockKeyManager.getStoredProviders.mockReturnValue([
        { provider: 'openai' },
      ]);
      mockKeyManager.getApiKey.mockReturnValue('test-key');
      mockProviderManager.setProvider.mockRejectedValueOnce(new Error('Init failed'));

      // Should not throw
      expect(() => new UnifiedAIService()).not.toThrow();
    });

    it('should skip providers without API keys', async () => {
      mockKeyManager.getStoredProviders.mockReturnValue([
        { provider: 'openai' },
      ]);
      mockKeyManager.getApiKey.mockReturnValue(null); // No API key

      service = new UnifiedAIService();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockProviderManager.setProvider).not.toHaveBeenCalled();
    });

    it('should ignore unknown provider types', async () => {
      mockKeyManager.getStoredProviders.mockReturnValue([
        { provider: 'unknown-provider' },
      ]);

      service = new UnifiedAIService();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockProviderManager.setProvider).not.toHaveBeenCalled();
    });
  });

  describe('model selection', () => {
    beforeEach(() => {
      service = new UnifiedAIService();
    });

    it('should update current model', async () => {
      const modelId = 'gpt-5';
      mockProviderManager.isProviderConfigured.mockReturnValue(true);

      await service.setModel(modelId);

      expect(service.getCurrentModel()).toBe(modelId);
    });

    it('should throw error for unknown model', async () => {
      await expect(service.setModel('unknown-model')).rejects.toThrow('Unknown model');
    });

    it('should initialize provider if API key exists but provider not configured', async () => {
      const modelId = 'gpt-5';
      mockProviderManager.isProviderConfigured.mockReturnValue(false);
      mockKeyManager.getApiKey.mockReturnValue('test-key');

      await service.setModel(modelId);

      expect(mockProviderManager.setProvider).toHaveBeenCalled();
      expect(service.getCurrentModel()).toBe(modelId);
    });

    it('should throw error if provider not configured and no API key', async () => {
      const modelId = 'gpt-5';
      mockProviderManager.isProviderConfigured.mockReturnValue(false);
      mockKeyManager.getApiKey.mockReturnValue(null);

      await expect(service.setModel(modelId)).rejects.toThrow('API key not configured');
    });

    it('should exit demo mode when model is set with API key', async () => {
      const modelId = 'gpt-5';
      mockProviderManager.isProviderConfigured.mockReturnValue(false);
      mockKeyManager.getApiKey.mockReturnValue('test-key');

      expect(service.isDemo()).toBe(true);

      await service.setModel(modelId);

      expect(service.isDemo()).toBe(false);
    });
  });

  describe('demo mode behavior', () => {
    beforeEach(() => {
      service = new UnifiedAIService();
    });

    it('should use DemoResponseProvider in demo mode', async () => {
      const request: AIContextRequest = {
        userQuery: 'Test query',
        conversationHistory: [],
      };

      await service.sendContextualMessage(request);

      expect(DemoResponseProvider.getContextualResponse).toHaveBeenCalledWith(request);
    });

    it('should return demo response content', async () => {
      const request: AIContextRequest = {
        userQuery: 'Test query',
        conversationHistory: [],
      };

      const response = await service.sendContextualMessage(request);

      expect(response.content).toBe('Demo response');
      expect(response.metadata.model).toBe('demo');
    });

    it('should simulate streaming in demo mode', async () => {
      const request: AIContextRequest = {
        userQuery: 'Test query',
        conversationHistory: [],
      };

      const chunks: string[] = [];
      for await (const chunk of service.sendContextualMessageStream(request)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toContain('Demo response');
    });
  });

  describe('production mode - contextual messages', () => {
    beforeEach(() => {
      mockKeyManager.getStoredProviders.mockReturnValue([
        { provider: 'openai' },
      ]);
      mockKeyManager.getApiKey.mockReturnValue('test-key');
      service = new UnifiedAIService();
    });

    it('should send contextual message to AI provider', async () => {
      const request: AIContextRequest = {
        userQuery: 'Explain this code',
        conversationHistory: [],
      };

      await service.sendContextualMessage(request);

      expect(mockProviderManager.complete).toHaveBeenCalledWith(
        'deepseek-v3-2-exp',
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: 'Explain this code' }),
          ]),
          temperature: 0.3,
          max_tokens: 2000,
        })
      );
    });

    it('should return AI response with metadata', async () => {
      const request: AIContextRequest = {
        userQuery: 'Test query',
        conversationHistory: [],
      };

      const response = await service.sendContextualMessage(request);

      expect(response.content).toBe('Test response');
      expect(response.metadata.tokens).toBe(100);
      expect(response.metadata.model).toBe('deepseek-v3-2-exp');
    });

    it('should include workspace context in system prompt', async () => {
      const request: AIContextRequest = {
        userQuery: 'Test query',
        conversationHistory: [],
        workspaceContext: {
          rootPath: '/test',
          totalFiles: 10,
          languages: ['TypeScript', 'JavaScript'],
          testFiles: 2,
          projectStructure: {},
          dependencies: {},
          exports: {},
          symbols: {},
          lastIndexed: new Date(),
          summary: 'Test project with TypeScript',
        },
      };

      await service.sendContextualMessage(request);

      const systemPrompt = (mockProviderManager.complete as Mock).mock.calls[0][1].messages[0].content;
      expect(systemPrompt).toContain('Test project with TypeScript');
      expect(systemPrompt).toContain('TypeScript, JavaScript');
    });

    it('should include current file context in system prompt', async () => {
      const request: AIContextRequest = {
        userQuery: 'Test query',
        conversationHistory: [],
        currentFile: {
          path: '/test/App.tsx',
          language: 'typescript',
          content: 'const x = 1;',
        },
      };

      await service.sendContextualMessage(request);

      const systemPrompt = (mockProviderManager.complete as Mock).mock.calls[0][1].messages[0].content;
      expect(systemPrompt).toContain('/test/App.tsx');
      expect(systemPrompt).toContain('typescript');
      expect(systemPrompt).toContain('const x = 1;');
    });

    it('should truncate large file content from system prompt', async () => {
      const request: AIContextRequest = {
        userQuery: 'Test query',
        conversationHistory: [],
        currentFile: {
          path: '/test/App.tsx',
          language: 'typescript',
          content: 'x'.repeat(3000), // 3000 chars, exceeds 2000 limit
        },
      };

      await service.sendContextualMessage(request);

      const systemPrompt = (mockProviderManager.complete as Mock).mock.calls[0][1].messages[0].content;
      // Should not include file content due to size
      expect(systemPrompt).not.toContain('x'.repeat(3000));
    });

    it('should handle missing usage data gracefully', async () => {
      mockProviderManager.complete.mockResolvedValueOnce({
        content: 'Test response',
        // No usage data
      });

      const request: AIContextRequest = {
        userQuery: 'Test query',
        conversationHistory: [],
      };

      const response = await service.sendContextualMessage(request);

      expect(response.metadata.tokens).toBe(0);
    });
  });

  describe('streaming responses', () => {
    beforeEach(() => {
      mockKeyManager.getStoredProviders.mockReturnValue([
        { provider: 'openai' },
      ]);
      mockKeyManager.getApiKey.mockReturnValue('test-key');
      mockProviderManager.isProviderConfigured.mockReturnValue(true);
      service = new UnifiedAIService();
    });

    it('should stream response chunks', async () => {
      // Mock async generator
      async function* mockGenerator() {
        yield { type: 'content', delta: 'Hello ' };
        yield { type: 'content', delta: 'world' };
      }

      mockProviderManager.streamComplete.mockReturnValue(mockGenerator());

      const request: AIContextRequest = {
        userQuery: 'Test query',
        conversationHistory: [],
      };

      const chunks: string[] = [];
      for await (const chunk of service.sendContextualMessageStream(request)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello ', 'world']);
    });

    it('should handle reasoning chunks', async () => {
      async function* mockGenerator() {
        yield { type: 'reasoning', delta: 'Thinking...' };
        yield { type: 'content', delta: 'Answer' };
      }

      mockProviderManager.streamComplete.mockReturnValue(mockGenerator());

      const request: AIContextRequest = {
        userQuery: 'Test query',
        conversationHistory: [],
      };

      const chunks: string[] = [];
      for await (const chunk of service.sendContextualMessageStream(request)) {
        chunks.push(chunk);
      }

      expect(chunks[0]).toContain('[REASONING]');
      expect(chunks[0]).toContain('Thinking...');
      expect(chunks[1]).toBe('Answer');
    });

    it('should throw error if provider not configured', async () => {
      mockProviderManager.isProviderConfigured.mockReturnValue(false);

      const request: AIContextRequest = {
        userQuery: 'Test query',
        conversationHistory: [],
      };

      const generator = service.sendContextualMessageStream(request);

      await expect(generator.next()).rejects.toThrow('Provider');
    });

    it('should throw error for unknown model in streaming', async () => {
      service = new UnifiedAIService('unknown-model');

      const request: AIContextRequest = {
        userQuery: 'Test query',
        conversationHistory: [],
      };

      const generator = service.sendContextualMessageStream(request);

      await expect(generator.next()).rejects.toThrow('Unknown model');
    });

    it('should handle streaming errors', async () => {
      async function* mockGenerator() {
        throw new Error('Streaming failed');
      }

      mockProviderManager.streamComplete.mockReturnValue(mockGenerator());

      const request: AIContextRequest = {
        userQuery: 'Test query',
        conversationHistory: [],
      };

      const generator = service.sendContextualMessageStream(request);

      await expect(generator.next()).rejects.toThrow('Streaming failed');
    });

    it('should include system prompt in streaming', async () => {
      async function* mockGenerator() {
        yield { type: 'content', delta: 'Test' };
      }

      mockProviderManager.streamComplete.mockReturnValue(mockGenerator());

      const request: AIContextRequest = {
        userQuery: 'Test query',
        conversationHistory: [],
        workspaceContext: {
          rootPath: '/test',
          totalFiles: 5,
          languages: ['TypeScript'],
          testFiles: 1,
          projectStructure: {},
          dependencies: {},
          exports: {},
          symbols: {},
          lastIndexed: new Date(),
          summary: 'Test workspace',
        },
      };

      const chunks: string[] = [];
      for await (const chunk of service.sendContextualMessageStream(request)) {
        chunks.push(chunk);
      }

      const streamArgs = (mockProviderManager.streamComplete as Mock).mock.calls[0][1];
      expect(streamArgs.messages[0].content).toContain('Test workspace');
    });
  });

  describe('system prompt building', () => {
    beforeEach(() => {
      mockKeyManager.getStoredProviders.mockReturnValue([
        { provider: 'openai' },
      ]);
      mockKeyManager.getApiKey.mockReturnValue('test-key');
      service = new UnifiedAIService();
    });

    it('should include base coding assistant instructions', async () => {
      const request: AIContextRequest = {
        userQuery: 'Test',
        conversationHistory: [],
      };

      await service.sendContextualMessage(request);

      const systemPrompt = (mockProviderManager.complete as Mock).mock.calls[0][1].messages[0].content;
      expect(systemPrompt).toContain('expert coding assistant');
      expect(systemPrompt).toContain('best practices');
      expect(systemPrompt).toContain('edge cases');
    });

    it('should include workspace summary when provided', async () => {
      const request: AIContextRequest = {
        userQuery: 'Test',
        conversationHistory: [],
        workspaceContext: {
          rootPath: '/test',
          totalFiles: 10,
          languages: ['TypeScript'],
          testFiles: 2,
          projectStructure: {},
          dependencies: {},
          exports: {},
          symbols: {},
          lastIndexed: new Date(),
          summary: 'React TypeScript project',
        },
      };

      await service.sendContextualMessage(request);

      const systemPrompt = (mockProviderManager.complete as Mock).mock.calls[0][1].messages[0].content;
      expect(systemPrompt).toContain('React TypeScript project');
    });

    it('should include languages list when provided', async () => {
      const request: AIContextRequest = {
        userQuery: 'Test',
        conversationHistory: [],
        workspaceContext: {
          rootPath: '/test',
          totalFiles: 10,
          languages: ['TypeScript', 'JavaScript', 'CSS'],
          testFiles: 2,
          projectStructure: {},
          dependencies: {},
          exports: {},
          symbols: {},
          lastIndexed: new Date(),
          summary: 'Multi-language project',
        },
      };

      await service.sendContextualMessage(request);

      const systemPrompt = (mockProviderManager.complete as Mock).mock.calls[0][1].messages[0].content;
      expect(systemPrompt).toContain('TypeScript, JavaScript, CSS');
    });

    it('should include current file path when provided', async () => {
      const request: AIContextRequest = {
        userQuery: 'Test',
        conversationHistory: [],
        currentFile: {
          path: '/src/components/Button.tsx',
          language: 'typescript',
        },
      };

      await service.sendContextualMessage(request);

      const systemPrompt = (mockProviderManager.complete as Mock).mock.calls[0][1].messages[0].content;
      expect(systemPrompt).toContain('/src/components/Button.tsx');
    });

    it('should include file content in code block when small enough', async () => {
      const request: AIContextRequest = {
        userQuery: 'Test',
        conversationHistory: [],
        currentFile: {
          path: '/test.ts',
          language: 'typescript',
          content: 'const x = 1;\nconst y = 2;',
        },
      };

      await service.sendContextualMessage(request);

      const systemPrompt = (mockProviderManager.complete as Mock).mock.calls[0][1].messages[0].content;
      expect(systemPrompt).toContain('```typescript');
      expect(systemPrompt).toContain('const x = 1;');
    });

    it('should omit file content when too large', async () => {
      const request: AIContextRequest = {
        userQuery: 'Test',
        conversationHistory: [],
        currentFile: {
          path: '/test.ts',
          language: 'typescript',
          content: 'x'.repeat(2500), // Exceeds 2000 char limit
        },
      };

      await service.sendContextualMessage(request);

      const systemPrompt = (mockProviderManager.complete as Mock).mock.calls[0][1].messages[0].content;
      expect(systemPrompt).not.toContain('x'.repeat(2500));
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      service = new UnifiedAIService();
    });

    it('should get current model', () => {
      expect(service.getCurrentModel()).toBe('deepseek-v3-2-exp');
    });

    it('should check demo mode status', () => {
      expect(service.isDemo()).toBe(true);
    });

    it('should get available models from provider manager', () => {
      const models = service.getAvailableModels();
      expect(models).toEqual(['deepseek-v3-2-exp', 'gpt-5', 'claude-sonnet-4-5']);
    });

    it('should check if provider is configured', () => {
      mockProviderManager.isProviderConfigured.mockReturnValue(true);
      expect(service.isProviderConfigured(AIProvider.OPENAI)).toBe(true);
    });

    it('should check if provider is not configured', () => {
      mockProviderManager.isProviderConfigured.mockReturnValue(false);
      expect(service.isProviderConfigured(AIProvider.ANTHROPIC)).toBe(false);
    });
  });
});
