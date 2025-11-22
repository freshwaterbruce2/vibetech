/**
 * Comprehensive tests for TaskPlanner service
 * Coverage target: 90%+ for critical Agent Mode functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskPlanner } from '../../../services/ai/TaskPlanner';
import { UnifiedAIService } from '../../../services/ai/UnifiedAIService';
import { TaskPlanRequest, AgentTask } from '../../../types';

// Mock UnifiedAIService
vi.mock('../../../services/ai/UnifiedAIService');

describe('TaskPlanner', () => {
  let taskPlanner: TaskPlanner;
  let mockAIService: UnifiedAIService;

  beforeEach(() => {
    mockAIService = {
      sendContextualMessage: vi.fn(),
    } as any;
    taskPlanner = new TaskPlanner(mockAIService);
  });

  describe('planTask', () => {
    it('should create a valid task plan from AI response', async () => {
      const aiResponse = JSON.stringify({
        title: 'Create new component',
        description: 'Create a new React component with tests',
        reasoning: 'Breaking down into file creation and test setup',
        steps: [
          {
            order: 1,
            title: 'Create component file',
            description: 'Create the React component file',
            action: {
              type: 'write_file',
              params: {
                filePath: '/src/components/NewComponent.tsx',
                content: 'export const NewComponent = () => <div>Hello</div>;',
              },
            },
            requiresApproval: false,
            maxRetries: 3,
          },
          {
            order: 2,
            title: 'Create test file',
            description: 'Create test file for the component',
            action: {
              type: 'write_file',
              params: {
                filePath: '/src/components/NewComponent.test.tsx',
                content: 'describe("NewComponent", () => { it("renders", () => {}) });',
              },
            },
            requiresApproval: false,
            maxRetries: 3,
          },
        ],
        warnings: ['This will create new files'],
      });

      vi.mocked(mockAIService.sendContextualMessage).mockResolvedValue({ content: aiResponse, metadata: { model: 'test', tokens: 100, processing_time: 50 } });

      const request: TaskPlanRequest = {
        userRequest: 'Create a new component called NewComponent',
        context: {
          workspaceRoot: '/project',
          openFiles: [],
          recentFiles: [],
          currentFile: null,
        },
      };

      const result = await taskPlanner.planTask(request);

      expect(result.task).toBeDefined();
      expect(result.task.title).toBe('Create new component');
      expect(result.task.steps).toHaveLength(2);
      expect(result.task.status).toBe('awaiting_approval');
      expect(result.reasoning).toContain('Breaking down into file creation');
      expect(result.warnings).toContain('This will create new files');
      expect(result.estimatedTime).toBeTruthy();
    });

    it('should handle JSON in markdown code blocks', async () => {
      const aiResponse = `Here's the plan:

\`\`\`json
{
  "title": "Test Task",
  "description": "Testing markdown parsing",
  "reasoning": "AI provided context",
  "steps": [{
    "order": 1,
    "title": "Read file",
    "description": "Read the test file",
    "action": {
      "type": "read_file",
      "params": { "filePath": "/test.ts" }
    }
  }],
  "warnings": []
}
\`\`\``;

      vi.mocked(mockAIService.sendContextualMessage).mockResolvedValue({ content: aiResponse, metadata: { model: 'test', tokens: 100, processing_time: 50 } });

      const request: TaskPlanRequest = {
        userRequest: 'Test request',
        context: {
          workspaceRoot: '/project',
          openFiles: [],
          recentFiles: [],
          currentFile: null,
        },
      };

      const result = await taskPlanner.planTask(request);

      expect(result.task.title).toBe('Test Task');
      expect(result.task.steps).toHaveLength(1);
    });

    it('should create fallback task on parsing error', async () => {
      vi.mocked(mockAIService.sendContextualMessage).mockResolvedValue({
        content: 'Invalid JSON response',
        metadata: { model: 'test', tokens: 50, processing_time: 20 }
      });

      const request: TaskPlanRequest = {
        userRequest: 'Do something complex',
        context: {
          workspaceRoot: '/project',
          openFiles: [],
          recentFiles: [],
          currentFile: null,
        },
      };

      const result = await taskPlanner.planTask(request);

      expect(result.task).toBeDefined();
      expect(result.task.title).toBe('Manual Task');
      expect(result.task.steps).toHaveLength(1);
      expect(result.task.steps[0].action.type).toBe('custom');
      expect(result.task.steps[0].requiresApproval).toBe(true);
    });

    it('should respect maxSteps option', async () => {
      const aiResponse = JSON.stringify({
        title: 'Test',
        description: 'Test',
        reasoning: 'Test',
        steps: Array(5).fill({
          order: 1,
          title: 'Step',
          description: 'Step description',
          action: { type: 'read_file', params: {} },
        }),
      });

      vi.mocked(mockAIService.sendContextualMessage).mockResolvedValue({ content: aiResponse, metadata: { model: 'test', tokens: 100, processing_time: 50 } });

      const request: TaskPlanRequest = {
        userRequest: 'Test request',
        context: {
          workspaceRoot: '/project',
          openFiles: [],
          recentFiles: [],
          currentFile: null,
        },
        options: {
          maxSteps: 3,
        },
      };

      await taskPlanner.planTask(request);

      const promptCall = vi.mocked(mockAIService.sendContextualMessage).mock.calls[0][0];
      expect(promptCall).toContain('Maximum steps: 3');
    });

    it('should mark destructive actions as requiring approval', async () => {
      const aiResponse = JSON.stringify({
        title: 'Delete files',
        description: 'Delete test files',
        reasoning: 'Cleanup',
        steps: [
          {
            order: 1,
            title: 'Delete file',
            description: 'Delete test file',
            action: {
              type: 'delete_file',
              params: { filePath: '/test.ts' },
            },
            requiresApproval: false, // AI says no, but we should override
          },
        ],
      });

      vi.mocked(mockAIService.sendContextualMessage).mockResolvedValue({ content: aiResponse, metadata: { model: 'test', tokens: 100, processing_time: 50 } });

      const request: TaskPlanRequest = {
        userRequest: 'Delete test files',
        context: {
          workspaceRoot: '/project',
          openFiles: [],
          recentFiles: [],
          currentFile: null,
        },
      };

      const result = await taskPlanner.planTask(request);

      expect(result.task.steps[0].requiresApproval).toBe(true); // Overridden to true
    });

    it('should add warnings for destructive operations', async () => {
      const aiResponse = JSON.stringify({
        title: 'Destructive task',
        description: 'Delete and commit',
        reasoning: 'Cleanup',
        steps: [
          {
            order: 1,
            title: 'Delete file',
            description: 'Delete file',
            action: { type: 'delete_file', params: { filePath: '/test.ts' } },
          },
          {
            order: 2,
            title: 'Git commit',
            description: 'Commit changes',
            action: { type: 'git_commit', params: { message: 'Deleted files' } },
          },
          {
            order: 3,
            title: 'Run command',
            description: 'Run build',
            action: { type: 'run_command', params: { command: 'npm run build' } },
          },
        ],
        warnings: [],
      });

      vi.mocked(mockAIService.sendContextualMessage).mockResolvedValue({ content: aiResponse, metadata: { model: 'test', tokens: 100, processing_time: 50 } });

      const request: TaskPlanRequest = {
        userRequest: 'Cleanup and commit',
        context: {
          workspaceRoot: '/project',
          openFiles: [],
          recentFiles: [],
          currentFile: null,
        },
      };

      const result = await taskPlanner.planTask(request);

      expect(result.warnings).toContain(
        'This task includes file deletions - changes may not be reversible'
      );
      expect(result.warnings).toContain('This task will create git commits');
      expect(result.warnings).toContain('This task will execute terminal commands');
    });

    it('should warn about complex tasks', async () => {
      const aiResponse = JSON.stringify({
        title: 'Complex task',
        description: 'Many steps',
        reasoning: 'Complex',
        steps: Array(12).fill({
          order: 1,
          title: 'Step',
          description: 'Step',
          action: { type: 'read_file', params: {} },
        }),
      });

      vi.mocked(mockAIService.sendContextualMessage).mockResolvedValue({ content: aiResponse, metadata: { model: 'test', tokens: 100, processing_time: 50 } });

      const request: TaskPlanRequest = {
        userRequest: 'Complex request',
        context: {
          workspaceRoot: '/project',
          openFiles: [],
          recentFiles: [],
          currentFile: null,
        },
      };

      const result = await taskPlanner.planTask(request);

      expect(result.warnings.some((w) => w.includes('12 steps'))).toBe(true);
    });

    it('should estimate execution time based on step count', async () => {
      const testCases = [
        { stepCount: 1, expected: '< 1 minute' },
        { stepCount: 3, expected: '1-3 minutes' },
        { stepCount: 7, expected: '3-5 minutes' },
        { stepCount: 15, expected: '5+ minutes' },
      ];

      for (const { stepCount, expected } of testCases) {
        const aiResponse = JSON.stringify({
          title: 'Test',
          description: 'Test',
          reasoning: 'Test',
          steps: Array(stepCount).fill({
            order: 1,
            title: 'Step',
            description: 'Step',
            action: { type: 'read_file', params: {} },
          }),
        });

        vi.mocked(mockAIService.sendContextualMessage).mockResolvedValue({ content: aiResponse, metadata: { model: 'test', tokens: 100, processing_time: 50 } });

        const request: TaskPlanRequest = {
          userRequest: 'Test',
          context: {
            workspaceRoot: '/project',
            openFiles: [],
            recentFiles: [],
            currentFile: null,
          },
        };

        const result = await taskPlanner.planTask(request);
        expect(result.estimatedTime).toBe(expected);
      }
    });
  });

  describe('validateTask', () => {
    it('should validate a well-formed task', () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Valid Task',
        description: 'A valid task',
        userRequest: 'User request',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Step 1',
            description: 'First step',
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

      const result = taskPlanner.validateTask(task);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject task with no steps', () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Invalid Task',
        description: 'No steps',
        userRequest: 'User request',
        steps: [],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      const result = taskPlanner.validateTask(task);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Task has no steps');
    });

    it('should reject steps without action type', () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Invalid Task',
        description: 'Bad step',
        userRequest: 'User request',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: 'Bad Step',
            description: 'Missing action type',
            action: {
              type: null as any,
              params: {},
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

      const result = taskPlanner.validateTask(task);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Step 1 has no action type');
    });

    it('should reject steps without titles', () => {
      const task: AgentTask = {
        id: 'task_123',
        title: 'Invalid Task',
        description: 'Bad step',
        userRequest: 'User request',
        steps: [
          {
            id: 'step_1',
            taskId: 'task_123',
            order: 1,
            title: '',
            description: 'Missing title',
            action: {
              type: 'read_file',
              params: {},
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

      const result = taskPlanner.validateTask(task);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Step 1 has no title');
    });
  });

  describe('action type validation', () => {
    it('should accept all valid action types', async () => {
      const validActionTypes = [
        'read_file',
        'write_file',
        'edit_file',
        'delete_file',
        'create_directory',
        'run_command',
        'search_codebase',
        'analyze_code',
        'refactor_code',
        'generate_code',
        'run_tests',
        'git_commit',
        'custom',
      ];

      for (const actionType of validActionTypes) {
        const aiResponse = JSON.stringify({
          title: 'Test',
          description: 'Test',
          reasoning: 'Test',
          steps: [
            {
              order: 1,
              title: 'Test step',
              description: 'Test',
              action: { type: actionType, params: {} },
            },
          ],
        });

        vi.mocked(mockAIService.sendContextualMessage).mockResolvedValue({ content: aiResponse, metadata: { model: 'test', tokens: 100, processing_time: 50 } });

        const request: TaskPlanRequest = {
          userRequest: 'Test',
          context: {
            workspaceRoot: '/project',
            openFiles: [],
            recentFiles: [],
            currentFile: null,
          },
        };

        const result = await taskPlanner.planTask(request);
        expect(result.task.steps[0].action.type).toBe(actionType);
      }
    });

    it('should mark dangerous commands as requiring approval', async () => {
      const dangerousCommands = ['rm -rf /', 'del /f /s', 'format C:', 'shutdown', 'reboot'];

      for (const command of dangerousCommands) {
        const aiResponse = JSON.stringify({
          title: 'Dangerous',
          description: 'Dangerous command',
          reasoning: 'Test',
          steps: [
            {
              order: 1,
              title: 'Dangerous step',
              description: 'Test',
              action: {
                type: 'run_command',
                params: { command },
              },
              requiresApproval: false,
            },
          ],
        });

        vi.mocked(mockAIService.sendContextualMessage).mockResolvedValue({ content: aiResponse, metadata: { model: 'test', tokens: 100, processing_time: 50 } });

        const request: TaskPlanRequest = {
          userRequest: 'Test',
          context: {
            workspaceRoot: '/project',
            openFiles: [],
            recentFiles: [],
            currentFile: null,
          },
        };

        const result = await taskPlanner.planTask(request);
        expect(result.task.steps[0].requiresApproval).toBe(true);
      }
    });

    it('should respect requireApprovalForAll option', async () => {
      const aiResponse = JSON.stringify({
        title: 'Test',
        description: 'Test',
        reasoning: 'Test',
        steps: [
          {
            order: 1,
            title: 'Safe step',
            description: 'Just searching',
            action: {
              type: 'search_codebase',
              params: { searchQuery: 'test' },
            },
            requiresApproval: false,
          },
        ],
      });

      vi.mocked(mockAIService.sendContextualMessage).mockResolvedValue({ content: aiResponse, metadata: { model: 'test', tokens: 100, processing_time: 50 } });

      const request: TaskPlanRequest = {
        userRequest: 'Test',
        context: {
          workspaceRoot: '/project',
          openFiles: [],
          recentFiles: [],
          currentFile: null,
        },
        options: {
          requireApprovalForAll: true,
        },
      };

      const result = await taskPlanner.planTask(request);
      expect(result.task.steps[0].requiresApproval).toBe(true);
    });
  });

  describe('context inclusion', () => {
    it('should include workspace context in prompt', async () => {
      vi.mocked(mockAIService.sendContextualMessage).mockResolvedValue(
        JSON.stringify({
          title: 'Test',
          description: 'Test',
          reasoning: 'Test',
          steps: [],
        })
      );

      const request: TaskPlanRequest = {
        userRequest: 'Test',
        context: {
          workspaceRoot: '/my-project',
          openFiles: ['file1.ts', 'file2.ts'],
          recentFiles: ['file3.ts'],
          currentFile: 'file1.ts',
        },
      };

      await taskPlanner.planTask(request);

      const promptCall = vi.mocked(mockAIService.sendContextualMessage).mock.calls[0][0];
      expect(promptCall).toContain('/my-project');
      expect(promptCall).toContain('file1.ts, file2.ts');
      expect(promptCall).toContain('file1.ts');
      expect(promptCall).toContain('file3.ts');
    });

    it('should handle empty context gracefully', async () => {
      vi.mocked(mockAIService.sendContextualMessage).mockResolvedValue(
        JSON.stringify({
          title: 'Test',
          description: 'Test',
          reasoning: 'Test',
          steps: [],
        })
      );

      const request: TaskPlanRequest = {
        userRequest: 'Test',
        context: {
          workspaceRoot: '/project',
          openFiles: [],
          recentFiles: [],
          currentFile: null,
        },
      };

      await taskPlanner.planTask(request);

      const promptCall = vi.mocked(mockAIService.sendContextualMessage).mock.calls[0][0];
      expect(promptCall).toContain('None');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined openFiles and recentFiles gracefully', async () => {
      vi.mocked(mockAIService.sendContextualMessage).mockResolvedValue(
        JSON.stringify({
          title: 'Test Task',
          description: 'Test Description',
          reasoning: 'Test reasoning',
          steps: [
            {
              order: 1,
              title: 'Test Step',
              description: 'Test step description',
              action: {
                type: 'read_file',
                params: { filePath: '/test.ts' },
              },
              requiresApproval: false,
              maxRetries: 3,
            },
          ],
          estimatedTime: '1 minute',
        })
      );

      const request: TaskPlanRequest = {
        userRequest: 'Test with undefined context arrays',
        context: {
          workspaceRoot: '/project',
          // openFiles and recentFiles are undefined (not provided)
        } as any,
      };

      const result = await taskPlanner.planTask(request);

      expect(result).toBeDefined();
      expect(result.task.title).toBe('Test Task');

      // Verify the prompt was built without crashing
      const promptCall = vi.mocked(mockAIService.sendContextualMessage).mock.calls[0][0];
      expect(promptCall).toContain('Open Files: None');
      expect(promptCall).toContain('Recent Files: None');
    });
  });
});
