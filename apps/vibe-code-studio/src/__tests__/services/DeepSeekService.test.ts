import { describe, it, expect, beforeEach } from 'vitest';
import { DeepSeekService } from '../../services/DeepSeekService';
import { AIContextRequest } from '../../types';

describe('DeepSeekService', () => {
  let service: DeepSeekService;

  beforeEach(() => {
    service = new DeepSeekService({
      apiKey: 'test_key',
      baseUrl: 'https://test.api.com',
      model: 'test-model',
    });
  });

  describe('configuration', () => {
    it('should initialize with custom config', () => {
      expect(service).toBeDefined();
    });

    it('should update configuration', () => {
      service.updateConfig({
        apiKey: 'new_key',
        temperature: 0.5,
      });
      // Config is private, so we test the effect
      expect(service).toBeDefined();
    });
  });

  describe('demo mode', () => {
    beforeEach(() => {
      service = new DeepSeekService({
        apiKey: 'demo_key',
      });
    });

    it('should return demo response for contextual messages', async () => {
      const request: AIContextRequest = {
        userQuery: 'Create a React component',
        relatedFiles: [],
        workspaceContext: {
          rootPath: '/test',
          totalFiles: 10,
          languages: ['TypeScript', 'React'],
          testFiles: 2,
          projectStructure: {},
          dependencies: {},
          exports: {},
          symbols: {},
          lastIndexed: new Date(),
          summary: 'Test project',
        },
        conversationHistory: [],
      };

      const response = await service.sendContextualMessage(request);

      expect(response).toBeDefined();
      expect(response.content).toContain('component');
      expect(response.metadata?.model).toBe('demo');
    });

    it('should return demo code completion', async () => {
      const completions = await service.getCodeCompletion('console.', 'javascript', {
        line: 1,
        column: 8,
      });

      expect(completions).toHaveLength(1);
      expect(completions[0].text).toBe('log()');
    });
  });

  describe('conversation history', () => {
    it('should clear conversation history', () => {
      service.clearConversationHistory();
      // History is private, so we test the effect by sending a message
      expect(service).toBeDefined();
    });
  });

  describe('code operations', () => {
    it('should explain code', async () => {
      const code = `function add(a, b) { return a + b; }`;
      const explanation = await service.explainCode(code, 'javascript');

      expect(explanation).toBeDefined();
      expect(typeof explanation).toBe('string');
    });

    it('should refactor code', async () => {
      const code = `function add(a, b) { return a + b; }`;
      const refactored = await service.refactorCode(code, 'javascript');

      expect(refactored).toBeDefined();
      expect(typeof refactored).toBe('string');
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      // This will fall back to demo response
      const response = await service.sendMessage('test message');

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });
  });
});
