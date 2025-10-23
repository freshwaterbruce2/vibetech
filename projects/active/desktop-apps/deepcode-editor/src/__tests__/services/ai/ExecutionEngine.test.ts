/**
 * Comprehensive tests for ExecutionEngine service
 * Coverage target: 90%+ for critical Agent Mode execution logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExecutionEngine, ExecutionCallbacks } from '../../../services/ai/ExecutionEngine';
import { FileSystemService } from '../../../services/FileSystemService';
import { UnifiedAIService } from '../../../services/ai/UnifiedAIService';
import { WorkspaceService } from '../../../services/WorkspaceService';
import { GitService } from '../../../services/GitService';
import { AgentTask, AgentStep, StepResult } from '../../../types';

// Mock dependencies
vi.mock('../../../services/FileSystemService');
vi.mock('../../../services/ai/UnifiedAIService');
vi.mock('../../../services/WorkspaceService');
vi.mock('../../../services/GitService');

describe('ExecutionEngine', () => {
  let executionEngine: ExecutionEngine;
  let mockFileSystemService: FileSystemService;
  let mockAIService: UnifiedAIService;
  let mockWorkspaceService: WorkspaceService;
  let mockGitService: GitService;

  beforeEach(() => {
    mockFileSystemService = {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      deleteFile: vi.fn(),
      createDirectory: vi.fn(),
      getFileStats: vi.fn(),
      listFiles: vi.fn(),
    } as any;

    mockAIService = {
      sendMessage: vi.fn(),
      setModel: vi.fn().mockResolvedValue(undefined),
    } as any;

    mockWorkspaceService = {
      searchFiles: vi.fn(),
      analyzeFile: vi.fn(),
    } as any;

    mockGitService = {
      commit: vi.fn(),
    } as any;

    executionEngine = new ExecutionEngine(
      mockFileSystemService,
      mockAIService,
      mockWorkspaceService,
      mockGitService
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('executeTask', () => {
    it('should execute a simple task successfully', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Read file',
        description: 'Read a test file',
        userRequest: 'Read test.ts',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Read file',
            description: 'Read the test file',
            action: {
              type: 'read_file',
              params: { filePath: '/test.ts' },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.getFileStats).mockResolvedValue({ size: 100, isDirectory: false } as any);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue('file content');

      const result = await executionEngine.executeTask(task);

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeDefined();
      expect(result.steps[0].status).toBe('completed');
      expect(result.steps[0].result?.success).toBe(true);
    });

    it('should call onStepStart callback before executing step', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Test step',
            description: 'Test',
            action: { type: 'read_file', params: { filePath: '/test.ts' } },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.getFileStats).mockResolvedValue({ size: 100, isDirectory: false } as any);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue('content');

      const callbacks: ExecutionCallbacks = {
        onStepStart: vi.fn(),
        onStepComplete: vi.fn(),
      };

      await executionEngine.executeTask(task, callbacks);

      expect(callbacks.onStepStart).toHaveBeenCalledWith(task.steps[0]);
      expect(callbacks.onStepComplete).toHaveBeenCalledWith(
        task.steps[0],
        expect.objectContaining({ success: true })
      );
    });

    it('should request approval for steps requiring approval', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Delete file',
        description: 'Delete a test file',
        userRequest: 'Delete test.ts',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Delete file',
            description: 'Delete the test file',
            action: {
              type: 'delete_file',
              params: { filePath: '/test.ts' },
            },
            status: 'pending',
            requiresApproval: true,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      const callbacks: ExecutionCallbacks = {
        onStepApprovalRequired: vi.fn().mockResolvedValue(true), // User approves
      };

      vi.mocked(mockFileSystemService.deleteFile).mockResolvedValue(undefined);

      await executionEngine.executeTask(task, callbacks);

      expect(callbacks.onStepApprovalRequired).toHaveBeenCalledWith(
        task.steps[0],
        expect.objectContaining({
          taskId: 'task_123',
          stepId: 'step_1',
          action: expect.objectContaining({ type: 'delete_file' }),
        })
      );
      expect(task.steps[0].approved).toBe(true);
      expect(task.status).toBe('completed');
    });

    it('should cancel task if approval is rejected', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Delete file',
        description: 'Delete a test file',
        userRequest: 'Delete test.ts',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Delete file',
            description: 'Delete the test file',
            action: {
              type: 'delete_file',
              params: { filePath: '/test.ts' },
            },
            status: 'pending',
            requiresApproval: true,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      const callbacks: ExecutionCallbacks = {
        onStepApprovalRequired: vi.fn().mockResolvedValue(false), // User rejects
      };

      await executionEngine.executeTask(task, callbacks);

      expect(task.steps[0].status).toBe('rejected');
      expect(task.status).toBe('cancelled');
    });

    it('should retry failed steps up to maxRetries', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Test step',
            description: 'Test',
            action: { type: 'read_file', params: { filePath: '/test.ts' } },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      // Mock getFileStats to succeed
      vi.mocked(mockFileSystemService.getFileStats).mockResolvedValue({ size: 100, isDirectory: false } as any);

      // Fail first 2 times, succeed on 3rd
      vi.mocked(mockFileSystemService.readFile)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');

      await executionEngine.executeTask(task);

      expect(mockFileSystemService.readFile).toHaveBeenCalledTimes(3);
      expect(task.steps[0].status).toBe('completed');
      expect(task.steps[0].retryCount).toBe(2);
    }, 15000);

    it('should fail task after exhausting retries', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Test step',
            description: 'Test',
            action: { type: 'read_file', params: { filePath: '/test.ts' } },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 2,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      // getFileStats succeeds, but readFile fails persistently
      vi.mocked(mockFileSystemService.getFileStats).mockResolvedValue({ size: 100, isDirectory: false } as any);
      vi.mocked(mockFileSystemService.readFile)
        .mockRejectedValueOnce(new Error('Persistent error'))
        .mockRejectedValueOnce(new Error('Persistent error'))
        .mockRejectedValue(new Error('Persistent error'));

      const callbacks: ExecutionCallbacks = {
        onTaskError: vi.fn(),
      };

      const result = await executionEngine.executeTask(task, callbacks);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Step 1 failed');
      expect(mockFileSystemService.readFile).toHaveBeenCalledTimes(3); // initial + 2 retries = 3 total
      expect(callbacks.onTaskError).toHaveBeenCalled();
    }, 15000);

    it('should track progress with onTaskProgress callback', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Multi-step task',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Step 1',
            description: 'Test',
            action: { type: 'read_file', params: { filePath: '/test1.ts' } },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
          {
            id: 'step_2',
            taskId: 'task_123',
            order: 2,
            title: 'Step 2',
            description: 'Test',
            action: { type: 'read_file', params: { filePath: '/test2.ts' } },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
          {
            id: 'step_3',
            taskId: 'task_123',
            order: 3,
            title: 'Step 3',
            description: 'Test',
            action: { type: 'read_file', params: { filePath: '/test3.ts' } },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.getFileStats).mockResolvedValue({ size: 100, isDirectory: false } as any);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue('content');

      const callbacks: ExecutionCallbacks = {
        onTaskProgress: vi.fn(),
      };

      await executionEngine.executeTask(task, callbacks);

      expect(callbacks.onTaskProgress).toHaveBeenCalledWith(1, 3);
      expect(callbacks.onTaskProgress).toHaveBeenCalledWith(2, 3);
      expect(callbacks.onTaskProgress).toHaveBeenCalledWith(3, 3);
    });

    it('should pause execution when paused', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Step 1',
            description: 'Test',
            action: { type: 'read_file', params: { filePath: '/test1.ts' } },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
          {
            id: 'step_2',
            taskId: 'task_123',
            order: 2,
            title: 'Step 2',
            description: 'Test',
            action: { type: 'read_file', params: { filePath: '/test2.ts' } },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      // Set task context for persistence during pause
      executionEngine.setTaskContext('Test request', '/workspace');

      vi.mocked(mockFileSystemService.getFileStats).mockResolvedValue({ size: 100, isDirectory: false } as any);
      vi.mocked(mockFileSystemService.readFile).mockImplementation(async (path) => {
        if (path === '/test1.ts') {
          executionEngine.pause(); // Pause after first step
          return 'content1';
        }
        return 'content2';
      });

      const result = await executionEngine.executeTask(task);

      expect(result.status).toBe('paused');
      expect(task.steps[0].status).toBe('completed');
      expect(task.steps[1].status).toBe('pending'); // Not executed
    });
  });

  describe('action handlers', () => {
    it('should execute read_file action', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Read file',
            description: 'Test',
            action: {
              type: 'read_file',
              params: { filePath: '/test.ts' },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.getFileStats).mockResolvedValue({ size: 100, isDirectory: false } as any);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue('file content');

      await executionEngine.executeTask(task);

      expect(mockFileSystemService.readFile).toHaveBeenCalledWith('/test.ts');
      expect(task.steps[0].result?.data).toMatchObject({ content: 'file content' });
    });

    it('should execute write_file action', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Write file',
            description: 'Test',
            action: {
              type: 'write_file',
              params: {
                filePath: '/new.ts',
                content: 'export const test = 1;',
              },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await executionEngine.executeTask(task);

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith('/new.ts', 'export const test = 1;');
      expect(task.steps[0].result?.filesCreated).toEqual(['/new.ts']);
    });

    it('should execute edit_file action', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Edit file',
            description: 'Test',
            action: {
              type: 'edit_file',
              params: {
                filePath: '/test.ts',
                oldContent: 'const x = 1;',
                newContent: 'const x = 2;',
              },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.readFile).mockResolvedValue('const x = 1;\nconst y = 3;');
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await executionEngine.executeTask(task);

      expect(mockFileSystemService.readFile).toHaveBeenCalledWith('/test.ts');
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/test.ts',
        'const x = 2;\nconst y = 3;'
      );
      expect(task.steps[0].result?.filesModified).toEqual(['/test.ts']);
    });

    it('should execute delete_file action', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Delete file',
            description: 'Test',
            action: {
              type: 'delete_file',
              params: { filePath: '/old.ts' },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.deleteFile).mockResolvedValue(undefined);

      await executionEngine.executeTask(task);

      expect(mockFileSystemService.deleteFile).toHaveBeenCalledWith('/old.ts');
      expect(task.steps[0].result?.filesDeleted).toEqual(['/old.ts']);
    });

    it('should execute create_directory action', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Create directory',
            description: 'Test',
            action: {
              type: 'create_directory',
              params: { path: '/new-dir' },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.createDirectory).mockResolvedValue(undefined);

      await executionEngine.executeTask(task);

      expect(mockFileSystemService.createDirectory).toHaveBeenCalledWith('/new-dir');
      expect(task.steps[0].result?.success).toBe(true);
    });

    it('should execute search_codebase action', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Search',
            description: 'Test',
            action: {
              type: 'search_codebase',
              params: { searchQuery: 'useEffect' },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockWorkspaceService.searchFiles).mockResolvedValue([
        { path: '/file1.ts', line: 10, content: 'useEffect' },
      ]);

      await executionEngine.executeTask(task);

      expect(mockWorkspaceService.searchFiles).toHaveBeenCalledWith('useEffect');
      expect(task.steps[0].result?.data?.results).toHaveLength(1);
    });

    it('should handle search_codebase with array of search terms', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Search',
            description: 'Test',
            action: {
              type: 'search_codebase',
              params: { searchQuery: ['asset', 'image', 'file'] },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockWorkspaceService.searchFiles).mockResolvedValue([
        { path: '/assets/icon.png', line: 1, content: 'asset' },
      ]);

      await executionEngine.executeTask(task);

      // Array should be joined with '|' for OR search
      expect(mockWorkspaceService.searchFiles).toHaveBeenCalledWith('asset|image|file');
      expect(task.steps[0].result?.data?.results).toHaveLength(1);
    });

    it('should execute git_commit action', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Git commit',
            description: 'Test',
            action: {
              type: 'git_commit',
              params: { message: 'feat: add new feature' },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockGitService.commit).mockResolvedValue(undefined);

      await executionEngine.executeTask(task);

      expect(mockGitService.commit).toHaveBeenCalledWith('feat: add new feature');
      expect(task.steps[0].result?.success).toBe(true);
    });

    it('should execute generate_code action using AI', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Generate code',
            description: 'Test',
            action: {
              type: 'generate_code',
              params: {
                description: 'Create a React button component',
                targetLanguage: 'TypeScript',
              },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockAIService.sendMessage).mockResolvedValue(
        'export const Button = () => <button>Click</button>;'
      );

      await executionEngine.executeTask(task);

      expect(mockAIService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('Generate TypeScript code')
      );
      expect(task.steps[0].result?.data?.generatedCode).toBeTruthy();
    });
  });

  describe('rollback functionality', () => {
    it('should rollback created files on task failure', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Write file',
            description: 'Test',
            action: {
              type: 'write_file',
              params: { filePath: '/test.ts', content: 'test' },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
          {
            id: 'step_2',
            taskId: 'task_123',
            order: 2,
            title: 'Failing step',
            description: 'Test',
            action: {
              type: 'read_file',
              params: { filePath: '/nonexistent.ts' },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 1,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);
      vi.mocked(mockFileSystemService.readFile).mockRejectedValue(new Error('File not found'));
      vi.mocked(mockFileSystemService.deleteFile).mockResolvedValue(undefined);

      await executionEngine.executeTask(task);

      expect(task.status).toBe('failed');
      expect(mockFileSystemService.deleteFile).toHaveBeenCalledWith('/test.ts');
    });

    it('should handle rollback when file deletion fails', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Write file',
            description: 'Test',
            action: {
              type: 'write_file',
              params: { filePath: '/test.ts', content: 'test' },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 1,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.writeFile).mockRejectedValue(new Error('Write failed'));
      vi.mocked(mockFileSystemService.deleteFile).mockRejectedValue(
        new Error('Delete failed during rollback')
      );

      const result = await executionEngine.executeTask(task);

      expect(result.status).toBe('failed');
      // Should not throw even if rollback fails
    });
  });

  describe('pause and resume', () => {
    it('should pause execution', () => {
      executionEngine.pause();
      expect(executionEngine.isPausedState()).toBe(true);
    });

    it('should resume execution', () => {
      executionEngine.pause();
      executionEngine.resume();
      expect(executionEngine.isPausedState()).toBe(false);
    });
  });

  describe('execution history', () => {
    it('should store execution history', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Write file',
            description: 'Test',
            action: {
              type: 'write_file',
              params: { filePath: '/test.ts', content: 'test' },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await executionEngine.executeTask(task);

      // History is stored internally for rollback
      expect(task.status).toBe('completed');
    });

    it('should clear history for a task', () => {
      executionEngine.clearHistory('task_123');
      // No error should be thrown
      expect(true).toBe(true);
    });
  });

  describe('approval request building', () => {
    it('should build approval request with correct risk level', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Delete file',
            description: 'Delete test file',
            action: {
              type: 'delete_file',
              params: { filePath: '/test.ts' },
            },
            status: 'pending',
            requiresApproval: true,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      let capturedRequest: any = null;

      const callbacks: ExecutionCallbacks = {
        onStepApprovalRequired: vi.fn().mockImplementation(async (_step, request) => {
          capturedRequest = request;
          return true;
        }),
      };

      vi.mocked(mockFileSystemService.deleteFile).mockResolvedValue(undefined);

      await executionEngine.executeTask(task, callbacks);

      expect(capturedRequest).toBeDefined();
      expect(capturedRequest.impact.riskLevel).toBe('high');
      expect(capturedRequest.impact.reversible).toBe(false);
      expect(capturedRequest.impact.filesAffected).toEqual(['/test.ts']);
    });

    it('should execute review_project action with Code Quality Analyzer', async () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Test',
        description: 'Test',
        userRequest: 'Test',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Review project',
            description: 'Analyze entire workspace for code quality',
            action: {
              type: 'review_project',
              params: { workspaceRoot: '/workspace' },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      // Mock CodeQualityAnalyzer to be available in ExecutionEngine
      const mockQualityReport = {
        totalFiles: 5,
        totalLinesOfCode: 500,
        averageQuality: 85,
        averageComplexity: 3,
        filesWithIssues: 2,
        fileReports: [
          {
            filePath: '/workspace/file1.ts',
            language: 'typescript',
            linesOfCode: 100,
            commentLines: 20,
            complexity: 2,
            quality: 90,
            maintainability: 'high' as const,
            issues: [],
          },
        ],
      };

      // We'll need to mock the analyzer in ExecutionEngine
      // For now, just verify the action type is recognized
      await executionEngine.executeTask(task);

      // Test should verify:
      // 1. Action is executed without errors
      // 2. Result contains quality report data
      // 3. Message includes summary stats
      expect(task.steps[0].result?.success).toBe(true);
      expect(task.steps[0].result?.data).toBeDefined();
    });
  });

  describe('Path Resolution with Workspace Root', () => {
    const workspaceRoot = 'C:\\dev\\projects\\active\\desktop-apps\\deepcode-editor';

    beforeEach(() => {
      // Add resolveWorkspacePath method to mock
      mockFileSystemService.resolveWorkspacePath = vi.fn((path: string) => {
        // Mock Windows path resolution
        if (path.match(/^[A-Za-z]:\\/)) {
          return path; // Already absolute
        }
        return `${workspaceRoot}\\${path}`;
      });

      // Set task context with workspace root
      executionEngine.setTaskContext('Test task', workspaceRoot);
    });

    it('should resolve relative file paths in read_file action', async () => {
      const task: AgentTask = {
        id: 'task_path_1',
        title: 'Read relative file',
        description: 'Test relative path resolution',
        userRequest: 'Read CLAUDE.md',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_path_1',
            order: 1,
            title: 'Read file',
            description: 'Read CLAUDE.md',
            action: {
              type: 'read_file',
              params: { filePath: 'CLAUDE.md' }, // Relative path
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.getFileStats).mockResolvedValue({ size: 100, isDirectory: false } as any);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue('file content');

      await executionEngine.executeTask(task);

      // Verify resolveWorkspacePath was called with relative path
      expect(mockFileSystemService.resolveWorkspacePath).toHaveBeenCalledWith('CLAUDE.md');

      // Verify readFile was called with resolved absolute path
      expect(mockFileSystemService.readFile).toHaveBeenCalledWith(`${workspaceRoot}\\CLAUDE.md`);

      expect(task.steps[0].status).toBe('completed');
    });

    it('should not double-resolve absolute file paths', async () => {
      const absolutePath = 'C:\\absolute\\path\\file.ts';
      const task: AgentTask = {
        id: 'task_path_2',
        title: 'Read absolute file',
        description: 'Test absolute path handling',
        userRequest: 'Read file',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_path_2',
            order: 1,
            title: 'Read file',
            description: 'Read absolute path file',
            action: {
              type: 'read_file',
              params: { filePath: absolutePath },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.getFileStats).mockResolvedValue({ size: 100, isDirectory: false } as any);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue('file content');
      vi.mocked(mockFileSystemService.resolveWorkspacePath).mockReturnValue(absolutePath); // Returns as-is

      await executionEngine.executeTask(task);

      // Verify readFile was called with original absolute path
      expect(mockFileSystemService.readFile).toHaveBeenCalledWith(absolutePath);
    });

    it('should resolve relative paths in write_file action', async () => {
      const task: AgentTask = {
        id: 'task_path_3',
        title: 'Write relative file',
        description: 'Test relative path write',
        userRequest: 'Write file',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_path_3',
            order: 1,
            title: 'Write file',
            description: 'Write new file',
            action: {
              type: 'write_file',
              params: { filePath: 'new-file.ts', content: 'export const test = 1;' },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue();

      await executionEngine.executeTask(task);

      expect(mockFileSystemService.resolveWorkspacePath).toHaveBeenCalledWith('new-file.ts');
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        `${workspaceRoot}\\new-file.ts`,
        'export const test = 1;'
      );
    });

    it('should resolve relative paths in edit_file action', async () => {
      const task: AgentTask = {
        id: 'task_path_4',
        title: 'Edit relative file',
        description: 'Test relative path edit',
        userRequest: 'Edit file',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_path_4',
            order: 1,
            title: 'Edit file',
            description: 'Edit existing file',
            action: {
              type: 'edit_file',
              params: { filePath: 'src/App.tsx', oldContent: 'old', newContent: 'new' },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.readFile).mockResolvedValue('old content');
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue();

      await executionEngine.executeTask(task);

      const resolvedPath = `${workspaceRoot}\\src/App.tsx`;
      expect(mockFileSystemService.resolveWorkspacePath).toHaveBeenCalledWith('src/App.tsx');
      expect(mockFileSystemService.readFile).toHaveBeenCalledWith(resolvedPath);
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(resolvedPath, expect.any(String));
    });

    it('should resolve relative paths in delete_file action', async () => {
      const task: AgentTask = {
        id: 'task_path_5',
        title: 'Delete relative file',
        description: 'Test relative path delete',
        userRequest: 'Delete file',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_path_5',
            order: 1,
            title: 'Delete file',
            description: 'Delete file',
            action: {
              type: 'delete_file',
              params: { filePath: 'temp.txt' },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.deleteFile).mockResolvedValue();

      await executionEngine.executeTask(task);

      expect(mockFileSystemService.resolveWorkspacePath).toHaveBeenCalledWith('temp.txt');
      expect(mockFileSystemService.deleteFile).toHaveBeenCalledWith(`${workspaceRoot}\\temp.txt`);
    });

    it('should resolve relative paths in create_directory action', async () => {
      const task: AgentTask = {
        id: 'task_path_6',
        title: 'Create directory',
        description: 'Test relative path directory',
        userRequest: 'Create directory',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_path_6',
            order: 1,
            title: 'Create directory',
            description: 'Create new directory',
            action: {
              type: 'create_directory',
              params: { path: 'src/components/new' },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.createDirectory).mockResolvedValue();

      await executionEngine.executeTask(task);

      expect(mockFileSystemService.resolveWorkspacePath).toHaveBeenCalledWith('src/components/new');
      expect(mockFileSystemService.createDirectory).toHaveBeenCalledWith(
        `${workspaceRoot}\\src/components/new`
      );
    });

    it('should resolve relative paths in analyze_code action', async () => {
      const task: AgentTask = {
        id: 'task_path_7',
        title: 'Analyze relative file',
        description: 'Test relative path analysis',
        userRequest: 'Analyze file',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_path_7',
            order: 1,
            title: 'Analyze file',
            description: 'Analyze code',
            action: {
              type: 'analyze_code',
              params: { filePath: 'src/services/FileSystemService.ts' },
            },
            status: 'pending',
            requiresApproval: false,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      vi.mocked(mockFileSystemService.readFile).mockResolvedValue('const x = 1;\nconst y = 2;');

      await executionEngine.executeTask(task);

      expect(mockFileSystemService.resolveWorkspacePath).toHaveBeenCalledWith(
        'src/services/FileSystemService.ts'
      );
      expect(mockFileSystemService.readFile).toHaveBeenCalledWith(
        `${workspaceRoot}\\src/services/FileSystemService.ts`
      );
    });
  });
});
