/**
 * Agent Mode V2 Integration Test
 *
 * Tests the complete workflow from task planning to execution
 * without UI interaction.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskPlanner } from '../services/ai/TaskPlanner';
import { ExecutionEngine } from '../services/ai/ExecutionEngine';
import { UnifiedAIService } from '../services/ai/UnifiedAIService';
import { FileSystemService } from '../services/FileSystemService';
import { WorkspaceService } from '../services/WorkspaceService';
import { GitService } from '../services/GitService';
import type { AgentTask, AgentStep } from '../types';

describe('Agent Mode V2 Integration', () => {
  let taskPlanner: TaskPlanner;
  let executionEngine: ExecutionEngine;
  let aiService: UnifiedAIService;
  let fileSystemService: FileSystemService;
  let workspaceService: WorkspaceService;
  let gitService: GitService;

  beforeEach(() => {
    // Mock services
    aiService = {
      sendContextualMessage: vi.fn().mockResolvedValue({
        content: 'Mocked AI response',
        metadata: {
          model: 'test-model',
          tokens: 100,
          processing_time: 100,
        },
      }),
      setModel: vi.fn().mockResolvedValue(undefined),
    } as any;

    fileSystemService = {
      readFile: vi.fn().mockResolvedValue('// File content'),
      writeFile: vi.fn().mockResolvedValue(undefined),
      deleteFile: vi.fn().mockResolvedValue(undefined),
      createDirectory: vi.fn().mockResolvedValue(undefined),
      getFileStats: vi.fn().mockResolvedValue({ size: 100, isDirectory: false }),
      listFiles: vi.fn().mockResolvedValue([]),
    } as any;

    workspaceService = {
      searchFiles: vi.fn().mockResolvedValue([]),
      analyzeFile: vi.fn().mockResolvedValue({}),
    } as any;

    gitService = {
      commit: vi.fn().mockResolvedValue(undefined),
    } as any;

    // Initialize services
    taskPlanner = new TaskPlanner(aiService);
    executionEngine = new ExecutionEngine(
      fileSystemService,
      aiService,
      workspaceService,
      gitService
    );
  });

  describe('TaskPlanner', () => {
    it('should plan a simple task', async () => {
      // Mock AI response for task planning
      const mockAIResponse = JSON.stringify({
        title: 'Create Hello World File',
        description: 'Create a simple hello world text file',
        steps: [
          {
            title: 'Create Hello File',
            action: {
              type: 'write_file',
              params: {
                filePath: '/test/hello.txt',
                content: 'Hello World!',
              },
            },
            description: 'Create hello.txt with content',
            estimatedDuration: 1,
            requiresApproval: true,
          },
        ],
        estimatedDuration: 1,
        requiresApproval: true,
        reasoning: 'Simple file creation task',
        warnings: ['This will create a new file'],
      });

      aiService.sendContextualMessage = vi.fn().mockResolvedValue({
        content: mockAIResponse,
        metadata: { model: 'test-model', tokens: 100, processing_time: 100 },
      });

      const result = await taskPlanner.planTask({
        userRequest: 'Create a hello world text file',
        context: {
          workspaceRoot: '/test',
          openFiles: [],
          currentFile: undefined,
          recentFiles: [],
        },
      });

      expect(result.task).toBeDefined();
      expect(result.task.title).toBe('Create Hello World File');
      expect(result.task.steps).toHaveLength(1);
      expect(result.task.steps[0].action.type).toBe('write_file');
      expect(result.reasoning).toBe('Simple file creation task');
      expect(result.warnings).toContain('This will create a new file');
    });

    it('should handle AI response parsing errors gracefully', async () => {
      // Mock invalid JSON response
      aiService.sendContextualMessage = vi.fn().mockResolvedValue({
        content: 'Invalid JSON {{{',
        metadata: { model: 'test-model', tokens: 100, processing_time: 100 },
      });

      const result = await taskPlanner.planTask({
        userRequest: 'Create a file',
        context: {
          workspaceRoot: '/test',
          openFiles: [],
          currentFile: undefined,
          recentFiles: [],
        },
      });

      expect(result.task).toBeDefined();
      expect(result.task.title).toBe('Manual Task');
      expect(result.task.status).toBe('awaiting_approval');
    });
  });

  describe('ExecutionEngine', () => {
    let mockTask: AgentTask;

    beforeEach(() => {
      mockTask = {
        id: 'test-task-1',
        title: 'Test Task',
        description: 'A test task',
        status: 'planning',
        steps: [
          {
            id: 'step-1',
            title: 'Read File',
            description: 'Read a test file',
            action: {
              type: 'read_file',
              params: { filePath: '/test/file.txt' },
            },
            status: 'pending',
            order: 1,
            retryCount: 0,
            maxRetries: 3,
            requiresApproval: false,
          },
        ],
        createdAt: new Date(),
        metadata: {},
      };
    });

    it('should execute a simple read_file step', async () => {
      fileSystemService.readFile = vi.fn().mockResolvedValue('Test content');

      const callbacks = {
        onStepStart: vi.fn(),
        onStepComplete: vi.fn(),
        onTaskComplete: vi.fn(),
      };

      const result = await executionEngine.executeTask(mockTask, callbacks);

      expect(result.status).toBe('completed');
      expect(callbacks.onStepStart).toHaveBeenCalledTimes(1);
      expect(callbacks.onStepComplete).toHaveBeenCalledTimes(1);
      expect(callbacks.onTaskComplete).toHaveBeenCalledTimes(1);
      expect(fileSystemService.readFile).toHaveBeenCalledWith('/test/file.txt');
    });

    it('should handle approval required steps', async () => {
      mockTask.steps[0].requiresApproval = true;
      mockTask.steps[0].action.type = 'write_file';
      mockTask.steps[0].action.params = {
        filePath: '/test/new.txt',
        content: 'New content',
      };

      const callbacks = {
        onStepApprovalRequired: vi.fn().mockResolvedValue(true), // User approves
        onStepComplete: vi.fn(),
        onTaskComplete: vi.fn(),
      };

      const result = await executionEngine.executeTask(mockTask, callbacks);

      expect(result.status).toBe('completed');
      expect(callbacks.onStepApprovalRequired).toHaveBeenCalledTimes(1);
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        '/test/new.txt',
        'New content'
      );
    });

    it('should reject task when approval is denied', async () => {
      mockTask.steps[0].requiresApproval = true;
      mockTask.steps[0].action.type = 'delete_file';

      const callbacks = {
        onStepApprovalRequired: vi.fn().mockResolvedValue(false), // User rejects
      };

      const result = await executionEngine.executeTask(mockTask, callbacks);

      expect(result.status).toBe('cancelled');
      expect(mockTask.steps[0].status).toBe('rejected');
      expect(fileSystemService.deleteFile).not.toHaveBeenCalled();
    });

    it('should retry failed steps with exponential backoff', async () => {
      mockTask.steps[0].maxRetries = 2;

      // Fail first attempt, succeed on second
      let callCount = 0;
      fileSystemService.readFile = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Permission denied');
        }
        return Promise.resolve('Success on retry');
      });

      const callbacks = {
        onStepError: vi.fn(),
        onStepComplete: vi.fn(),
      };

      const result = await executionEngine.executeTask(mockTask, callbacks);

      expect(result.status).toBe('completed');
      expect(fileSystemService.readFile).toHaveBeenCalledTimes(2);
      expect(callbacks.onStepError).not.toHaveBeenCalled(); // No final error
      expect(callbacks.onStepComplete).toHaveBeenCalledTimes(1);
    });

    it('should rollback on task failure', async () => {
      // Create task with multiple steps
      mockTask.steps = [
        {
          id: 'step-1',
          title: 'Create File',
          description: 'Create a file',
          action: {
            type: 'write_file',
            params: { filePath: '/test/file1.txt', content: 'Content 1' },
          },
          status: 'pending',
          order: 1,
          retryCount: 0,
          maxRetries: 3,
          requiresApproval: false,
        },
        {
          id: 'step-2',
          title: 'Create Second File (Will Fail)',
          description: 'This will fail',
          action: {
            type: 'write_file',
            params: { filePath: '/test/file2.txt', content: 'Content 2' },
          },
          status: 'pending',
          order: 2,
          retryCount: 0,
          maxRetries: 2,
          requiresApproval: false,
        },
      ];

      // First write succeeds, second fails
      let writeCallCount = 0;
      fileSystemService.writeFile = vi.fn().mockImplementation(() => {
        writeCallCount++;
        if (writeCallCount > 1) {
          throw new Error('Disk full');
        }
        return Promise.resolve();
      });

      const callbacks = {
        onTaskError: vi.fn(),
      };

      const result = await executionEngine.executeTask(mockTask, callbacks);

      expect(result.status).toBe('failed');
      expect(callbacks.onTaskError).toHaveBeenCalledTimes(1);

      // Rollback should delete the first created file
      expect(fileSystemService.deleteFile).toHaveBeenCalledWith('/test/file1.txt');
    });
  });

  describe('Complete Workflow', () => {
    it('should plan and execute a simple task end-to-end', async () => {
      // Step 1: Plan the task
      const mockAIResponse = JSON.stringify({
        title: 'Create Test File',
        description: 'Create a test file with content',
        steps: [
          {
            title: 'Create Test File',
            action: {
              type: 'write_file',
              params: {
                filePath: '/workspace/test.txt',
                content: 'Test content',
              },
            },
            description: 'Create test.txt',
            estimatedDuration: 1,
            requiresApproval: false,
          },
        ],
        estimatedDuration: 1,
        requiresApproval: false,
      });

      aiService.sendContextualMessage = vi.fn().mockResolvedValue({
        content: mockAIResponse,
        metadata: { model: 'test-model', tokens: 100, processing_time: 100 },
      });

      const planResult = await taskPlanner.planTask({
        userRequest: 'Create a test file with some content',
        context: {
          workspaceRoot: '/workspace',
          openFiles: [],
          currentFile: undefined,
          recentFiles: [],
        },
      });

      expect(planResult.task.status).toBe('awaiting_approval');
      expect(planResult.task.steps).toHaveLength(1);

      // Step 2: Execute the task
      const callbacks = {
        onStepComplete: vi.fn(),
        onTaskComplete: vi.fn(),
      };

      const executeResult = await executionEngine.executeTask(
        planResult.task,
        callbacks
      );

      expect(executeResult.status).toBe('completed');
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        '/workspace/test.txt',
        'Test content'
      );
      expect(callbacks.onTaskComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Action Handlers', () => {
    it('should handle search_codebase action', async () => {
      const mockTask: AgentTask = {
        id: 'search-task',
        title: 'Search Codebase',
        description: 'Search for files',
        status: 'planning',
        steps: [
          {
            id: 'step-1',
            title: 'Search',
            description: 'Search for .ts files',
            action: {
              type: 'search_codebase',
              params: { searchQuery: '*.ts' },
            },
            status: 'pending',
            order: 1,
            retryCount: 0,
            maxRetries: 3,
            requiresApproval: false,
          },
        ],
        createdAt: new Date(),
        metadata: {},
      };

      workspaceService.searchFiles = vi.fn().mockResolvedValue([
        '/workspace/file1.ts',
        '/workspace/file2.ts',
      ]);

      const result = await executionEngine.executeTask(mockTask);

      expect(result.status).toBe('completed');
      expect(workspaceService.searchFiles).toHaveBeenCalledWith('*.ts');
    });

    it('should handle analyze_code action', async () => {
      const mockTask: AgentTask = {
        id: 'analyze-task',
        title: 'Analyze Code',
        description: 'Analyze a file',
        status: 'planning',
        steps: [
          {
            id: 'step-1',
            title: 'Analyze',
            description: 'Analyze file structure',
            action: {
              type: 'analyze_code',
              params: { filePath: '/workspace/app.ts' },
            },
            status: 'pending',
            order: 1,
            retryCount: 0,
            maxRetries: 3,
            requiresApproval: false,
          },
        ],
        createdAt: new Date(),
        metadata: {},
      };

      fileSystemService.readFile = vi.fn().mockResolvedValue('const x = 1;');
      workspaceService.analyzeFile = vi.fn().mockResolvedValue({
        imports: [],
        exports: [],
      });

      const result = await executionEngine.executeTask(mockTask);

      expect(result.status).toBe('completed');
      expect(fileSystemService.readFile).toHaveBeenCalledWith('/workspace/app.ts');
      expect(workspaceService.analyzeFile).toHaveBeenCalled();
    });

    it('should handle generate_code action', async () => {
      const mockTask: AgentTask = {
        id: 'generate-task',
        title: 'Generate Code',
        description: 'Generate a component',
        status: 'planning',
        steps: [
          {
            id: 'step-1',
            title: 'Generate',
            description: 'Generate React component',
            action: {
              type: 'generate_code',
              params: {
                description: 'Create a button component',
                targetLanguage: 'TypeScript',
              },
            },
            status: 'pending',
            order: 1,
            retryCount: 0,
            maxRetries: 3,
            requiresApproval: false,
          },
        ],
        createdAt: new Date(),
        metadata: {},
      };

      aiService.sendContextualMessage = vi.fn().mockResolvedValue({
        content: 'const Button = () => <button>Click</button>;',
        metadata: { model: 'test-model', tokens: 100, processing_time: 100 },
      });

      const result = await executionEngine.executeTask(mockTask);

      expect(result.status).toBe('completed');
      expect(aiService.sendContextualMessage).toHaveBeenCalled();
    });
  });
});
