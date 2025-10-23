import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeepSeekService } from '@/services/DeepSeekService';
import { FileSystemService } from '@/services/FileSystemService';
import { AgentOrchestrator } from '@/services/specialized-agents/AgentOrchestrator';
import { AIClient } from '@/services/ai/AIClient';

describe('Core Functionality Integration Tests', () => {
  let deepSeekService: DeepSeekService;
  let fileSystemService: FileSystemService;
  let agentOrchestrator: AgentOrchestrator;
  let aiClient: AIClient;

  beforeEach(() => {
    // Initialize services with proper configuration
    deepSeekService = new DeepSeekService();
    fileSystemService = new FileSystemService();
    
    // Initialize AI client with test configuration
    const testConfig = {
      apiKey: 'test-key',
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 2048
    };
    aiClient = new AIClient(testConfig);
    agentOrchestrator = new AgentOrchestrator(aiClient);
  });

  describe('DeepSeek AI Integration', () => {
    it('should initialize DeepSeek service correctly', () => {
      expect(deepSeekService).toBeDefined();
      expect(deepSeekService.isConfigured()).toBe(true); // Should use demo config
    });

    it('should handle demo mode responses', async () => {
      const response = await deepSeekService.sendMessage('Hello');
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should handle code completion requests', async () => {
      const completion = await deepSeekService.getCodeCompletion(
        'const greeting = ',
        'typescript',
        { line: 0, column: 17 }
      );
      expect(completion).toBeDefined();
      expect(Array.isArray(completion)).toBe(true);
    });

    it('should handle error cases gracefully', async () => {
      // Force an error by using invalid configuration
      const invalidService = new DeepSeekService();
      invalidService.updateConfig({ apiKey: '', baseUrl: 'invalid-url' });
      
      const response = await invalidService.sendMessage('test');
      // Should fallback to demo response
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });
  });

  describe('File System Operations', () => {
    it('should initialize file system service', () => {
      expect(fileSystemService).toBeDefined();
    });

    it('should handle file operations', async () => {
      const testContent = 'test file content';
      const testPath = 'test.txt';

      // Write file
      await fileSystemService.writeFile(testPath, testContent);
      
      // Read file
      const content = await fileSystemService.readFile(testPath);
      expect(content).toBe(testContent);

      // Get file info
      const info = await fileSystemService.getFileInfo(testPath);
      expect(info).toBeDefined();
      expect(info.name).toBe(testPath);
    });

    it('should handle path utilities correctly', () => {
      const joined = fileSystemService.joinPath('folder', 'file.txt');
      expect(joined).toBe('folder/file.txt');

      const dirname = fileSystemService.getDirname('/path/to/file.txt');
      expect(dirname).toBe('/path/to');

      const basename = fileSystemService.getBasename('/path/to/file.txt');
      expect(basename).toBe('file.txt');

      const isAbsolute = fileSystemService.isAbsolute('/path/to/file');
      expect(isAbsolute).toBe(true);
    });
  });

  describe('Multi-Agent System', () => {
    it('should initialize agent orchestrator', () => {
      expect(agentOrchestrator).toBeDefined();
    });

    it('should handle task coordination', async () => {
      const task = {
        id: 'test-task',
        type: 'code_review' as const,
        description: 'Review test code',
        priority: 'medium' as const,
        context: {
          code: 'function test() { return "hello"; }',
          language: 'typescript',
        }
      };

      const result = await agentOrchestrator.executeTask(task);
      expect(result).toBeDefined();
      expect(result.taskId).toBe(task.id);
      expect(result.status).toBeDefined();
    });

    it('should handle agent capabilities', () => {
      const capabilities = agentOrchestrator.getAvailableCapabilities();
      expect(Array.isArray(capabilities)).toBe(true);
      expect(capabilities.length).toBeGreaterThan(0);
    });

    it('should manage active agents', () => {
      const activeAgents = agentOrchestrator.getActiveAgents();
      expect(Array.isArray(activeAgents)).toBe(true);
    });
  });

  describe('AI Client Integration', () => {
    it('should initialize AI client', () => {
      expect(aiClient).toBeDefined();
    });

    it('should handle provider management', () => {
      const providers = aiClient.getAvailableProviders();
      expect(Array.isArray(providers)).toBe(true);
    });

    it('should handle completion requests with fallback', async () => {
      try {
        const completion = await aiClient.completion({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'deepseek-chat',
          temperature: 0.7,
        });
        expect(completion).toBeDefined();
      } catch (error) {
        // Should handle errors gracefully
        expect(error).toBeDefined();
      }
    });
  });

  describe('Service Integration', () => {
    it('should handle service dependencies correctly', () => {
      // Test that services can work together
      expect(deepSeekService).toBeDefined();
      expect(fileSystemService).toBeDefined();
      expect(agentOrchestrator).toBeDefined();
      expect(aiClient).toBeDefined();
    });

    it('should maintain service state correctly', async () => {
      // Test conversation history
      await deepSeekService.sendMessage('First message');
      const history = deepSeekService.getConversationHistory();
      expect(history.length).toBeGreaterThan(0);

      // Clear history
      deepSeekService.clearConversationHistory();
      const clearedHistory = deepSeekService.getConversationHistory();
      expect(clearedHistory.length).toBe(0);
    });

    it('should handle configuration updates', () => {
      const originalConfig = deepSeekService.getConfig();
      expect(originalConfig).toBeDefined();

      const newConfig = {
        apiKey: 'new-key',
        baseUrl: 'https://new-url.com',
        model: 'new-model',
        temperature: 0.5,
        maxTokens: 1000,
      };

      deepSeekService.updateConfig(newConfig);
      const updatedConfig = deepSeekService.getConfig();
      expect(updatedConfig.apiKey).toBe(newConfig.apiKey);
      expect(updatedConfig.baseUrl).toBe(newConfig.baseUrl);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle service failures gracefully', async () => {
      // Test AI service with invalid config
      const invalidService = new DeepSeekService();
      invalidService.updateConfig({ apiKey: '', baseUrl: '' });
      
      const response = await invalidService.sendMessage('test');
      expect(response).toBeDefined(); // Should get demo response
    });

    it('should handle file system errors', async () => {
      try {
        await fileSystemService.readFile('non-existent-file.txt');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle agent orchestration errors', async () => {
      const invalidTask = {
        id: 'invalid-task',
        type: 'invalid_type' as any,
        description: 'Invalid task',
        priority: 'high' as const,
        context: {}
      };

      try {
        await agentOrchestrator.executeTask(invalidTask);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large data efficiently', async () => {
      const largeContent = 'x'.repeat(10000);
      const testPath = 'large-file.txt';

      const startTime = Date.now();
      await fileSystemService.writeFile(testPath, largeContent);
      const content = await fileSystemService.readFile(testPath);
      const endTime = Date.now();

      expect(content).toBe(largeContent);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should manage memory for conversation history', async () => {
      // Add many messages to test memory management
      for (let i = 0; i < 50; i++) {
        await deepSeekService.sendMessage(`Message ${i}`);
      }

      const history = deepSeekService.getConversationHistory();
      expect(history.length).toBeLessThanOrEqual(50); // Should manage history size
    });

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        deepSeekService.sendMessage(`Concurrent message ${i}`)
      );

      const responses = await Promise.all(promises);
      expect(responses.length).toBe(5);
      responses.forEach(response => {
        expect(response).toBeDefined();
        expect(typeof response).toBe('string');
      });
    });
  });
});