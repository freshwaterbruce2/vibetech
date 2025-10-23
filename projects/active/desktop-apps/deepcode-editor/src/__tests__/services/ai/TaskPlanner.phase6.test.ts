/**
 * TaskPlanner Phase 6 Tests
 *
 * Tests for confidence-based planning with fallback strategies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskPlanner } from '../../../services/ai/TaskPlanner';
import { StrategyMemory } from '../../../services/ai/StrategyMemory';
import { UnifiedAIService } from '../../../services/ai/UnifiedAIService';
import { AgentStep, TaskPlanRequest, StepConfidence } from '../../../types';

// Mock dependencies
vi.mock('../../../services/ai/UnifiedAIService');
vi.mock('../../../services/ai/StrategyMemory');

describe('TaskPlanner - Phase 6: Confidence-Based Planning', () => {
  let taskPlanner: TaskPlanner;
  let mockAIService: UnifiedAIService;
  let mockMemory: StrategyMemory;

  beforeEach(() => {
    mockAIService = new UnifiedAIService();
    taskPlanner = new TaskPlanner(mockAIService);
    mockMemory = new StrategyMemory();
  });

  describe('calculateStepConfidence', () => {
    it('should calculate baseline confidence of 50 for simple steps', async () => {
      const step: AgentStep = {
        id: 'step-1',
        taskId: 'task-1',
        order: 1,
        title: 'Read file',
        description: 'Read package.json',
        action: {
          type: 'read_file',
          params: { filePath: 'package.json' }
        },
        status: 'pending',
        requiresApproval: false,
        retryCount: 0,
        maxRetries: 3
      };

      // Mock no memory match
      vi.spyOn(mockMemory, 'queryPatterns').mockResolvedValue([]);

      const confidence = await (taskPlanner as any).calculateStepConfidence(step, mockMemory);

      expect(confidence.score).toBeGreaterThanOrEqual(40);
      expect(confidence.score).toBeLessThanOrEqual(70);
      expect(confidence.riskLevel).toBeDefined();
      expect(confidence.memoryBacked).toBe(false);
    });

    it('should boost confidence with memory-backed patterns', async () => {
      const step: AgentStep = {
        id: 'step-1',
        taskId: 'task-1',
        order: 1,
        title: 'Read file',
        description: 'Read package.json',
        action: {
          type: 'read_file',
          params: { filePath: 'package.json' }
        },
        status: 'pending',
        requiresApproval: false,
        retryCount: 0,
        maxRetries: 3
      };

      // Mock memory match with high success rate
      vi.spyOn(mockMemory, 'queryPatterns').mockResolvedValue([
        {
          pattern: {
            id: 'pattern-1',
            problemSignature: 'read-package-json',
            problemDescription: 'Read package.json file',
            actionType: 'read_file',
            successfulApproach: 'Direct file read',
            context: {},
            confidence: 95,
            usageCount: 10,
            successRate: 95,
            createdAt: new Date(),
            lastUsedAt: new Date()
          },
          relevanceScore: 85,
          reason: 'Exact match for reading package.json'
        }
      ]);

      const confidence = await (taskPlanner as any).calculateStepConfidence(step, mockMemory);

      expect(confidence.score).toBeGreaterThan(70); // Should be boosted by memory
      expect(confidence.memoryBacked).toBe(true);
      expect(confidence.factors).toContainEqual(
        expect.objectContaining({
          name: 'Memory Match',
          impact: expect.any(Number)
        })
      );
    });

    it('should reduce confidence for complex actions', async () => {
      const complexStep: AgentStep = {
        id: 'step-1',
        taskId: 'task-1',
        order: 1,
        title: 'Generate code',
        description: 'Generate React component',
        action: {
          type: 'generate_code',
          params: { codeSnippet: 'React component' }
        },
        status: 'pending',
        requiresApproval: false,
        retryCount: 0,
        maxRetries: 3
      };

      vi.spyOn(mockMemory, 'queryPatterns').mockResolvedValue([]);

      const confidence = await (taskPlanner as any).calculateStepConfidence(complexStep, mockMemory);

      expect(confidence.factors).toContainEqual(
        expect.objectContaining({
          name: 'Complex Action',
          impact: -15
        })
      );
      // Complex action: baseline 50 - 15 = 35, which is high risk (<40)
      expect(confidence.riskLevel).toBe('high');
      expect(confidence.score).toBeLessThan(40);
    });

    it('should classify risk levels correctly', async () => {
      const step: AgentStep = {
        id: 'step-1',
        taskId: 'task-1',
        order: 1,
        title: 'Test step',
        description: 'Test',
        action: { type: 'read_file', params: {} },
        status: 'pending',
        requiresApproval: false,
        retryCount: 0,
        maxRetries: 3
      };

      vi.spyOn(mockMemory, 'queryPatterns').mockResolvedValue([]);

      const confidence = await (taskPlanner as any).calculateStepConfidence(step, mockMemory);

      if (confidence.score >= 70) {
        expect(confidence.riskLevel).toBe('low');
      } else if (confidence.score >= 40) {
        expect(confidence.riskLevel).toBe('medium');
      } else {
        expect(confidence.riskLevel).toBe('high');
      }
    });
  });

  describe('generateFallbackPlans', () => {
    it('should not generate fallbacks for low-risk steps', async () => {
      const step: AgentStep = {
        id: 'step-1',
        taskId: 'task-1',
        order: 1,
        title: 'Low risk step',
        description: 'Test',
        action: { type: 'read_file', params: {} },
        status: 'pending',
        requiresApproval: false,
        retryCount: 0,
        maxRetries: 3
      };

      const lowRiskConfidence: StepConfidence = {
        score: 85,
        factors: [],
        memoryBacked: true,
        riskLevel: 'low'
      };

      const fallbacks = await (taskPlanner as any).generateFallbackPlans(step, lowRiskConfidence);

      expect(fallbacks).toHaveLength(0);
    });

    it('should generate search fallback for read_file actions', async () => {
      const step: AgentStep = {
        id: 'step-1',
        taskId: 'task-1',
        order: 1,
        title: 'Read config file',
        description: 'Read tsconfig.json',
        action: {
          type: 'read_file',
          params: { filePath: './tsconfig.json' }
        },
        status: 'pending',
        requiresApproval: false,
        retryCount: 0,
        maxRetries: 3
      };

      const mediumRiskConfidence: StepConfidence = {
        score: 55,
        factors: [],
        memoryBacked: false,
        riskLevel: 'medium'
      };

      const fallbacks = await (taskPlanner as any).generateFallbackPlans(step, mediumRiskConfidence);

      expect(fallbacks.length).toBeGreaterThan(0);
      expect(fallbacks[0]).toMatchObject({
        stepId: 'step-1',
        trigger: 'If file not found',
        alternativeAction: {
          type: 'search_codebase',
          params: expect.objectContaining({
            searchQuery: expect.stringContaining('tsconfig.json')
          })
        }
      });
    });

    it('should generate create fallback for config files', async () => {
      const step: AgentStep = {
        id: 'step-1',
        taskId: 'task-1',
        order: 1,
        title: 'Read config',
        description: 'Read config file',
        action: {
          type: 'read_file',
          params: { filePath: './config.json' }
        },
        status: 'pending',
        requiresApproval: false,
        retryCount: 0,
        maxRetries: 3
      };

      const mediumRiskConfidence: StepConfidence = {
        score: 50,
        factors: [],
        memoryBacked: false,
        riskLevel: 'medium'
      };

      const fallbacks = await (taskPlanner as any).generateFallbackPlans(step, mediumRiskConfidence);

      const createFallback = fallbacks.find(f => f.trigger.includes('after search'));
      expect(createFallback).toBeDefined();
      expect(createFallback?.alternativeAction.type).toBe('write_file');
    });

    it('should generate user assistance fallback for high-risk steps', async () => {
      const step: AgentStep = {
        id: 'step-1',
        taskId: 'task-1',
        order: 1,
        title: 'High risk step',
        description: 'Complex operation',
        action: {
          type: 'generate_code',
          params: {}
        },
        status: 'pending',
        requiresApproval: false,
        retryCount: 0,
        maxRetries: 3
      };

      const highRiskConfidence: StepConfidence = {
        score: 30,
        factors: [],
        memoryBacked: false,
        riskLevel: 'high'
      };

      const fallbacks = await (taskPlanner as any).generateFallbackPlans(step, highRiskConfidence);

      const userFallback = fallbacks.find(f => f.trigger.includes('all attempts fail'));
      expect(userFallback).toBeDefined();
      expect(userFallback?.alternativeAction.params.action).toBe('request_user_input');
      expect(userFallback?.confidence).toBe(90); // High confidence in user helping
    });
  });

  describe('planTaskWithConfidence', () => {
    it('should enhance all steps with confidence scores', async () => {
      const request: TaskPlanRequest = {
        userRequest: 'Create a new React component',
        context: {
          workspaceRoot: '/test',
          openFiles: [],
          recentFiles: []
        }
      };

      // Mock the base planTask to return a simple task
      vi.spyOn(taskPlanner as any, 'planTask').mockResolvedValue({
        task: {
          id: 'task-1',
          title: 'Create React component',
          description: 'Test task',
          userRequest: 'Create a new React component',
          steps: [
            {
              id: 'step-1',
              taskId: 'task-1',
              order: 1,
              title: 'Create file',
              description: 'Create component file',
              action: { type: 'write_file', params: {} },
              status: 'pending',
              requiresApproval: false,
              retryCount: 0,
              maxRetries: 3
            },
            {
              id: 'step-2',
              taskId: 'task-1',
              order: 2,
              title: 'Generate code',
              description: 'Generate component code',
              action: { type: 'generate_code', params: {} },
              status: 'pending',
              requiresApproval: false,
              retryCount: 0,
              maxRetries: 3
            }
          ],
          status: 'awaiting_approval',
          createdAt: new Date()
        },
        reasoning: 'Test reasoning',
        estimatedTime: '2 minutes',
        warnings: []
      });

      vi.spyOn(mockMemory, 'queryPatterns').mockResolvedValue([]);

      const result = await (taskPlanner as any).planTaskWithConfidence(request, mockMemory);

      expect(result.insights).toBeDefined();
      expect(result.insights.overallConfidence).toBeGreaterThan(0);
      expect(result.insights.estimatedSuccessRate).toBeGreaterThan(0);
      expect(result.task.steps.length).toBe(2);

      // All steps should have confidence
      result.task.steps.forEach((step: any) => {
        expect(step.confidence).toBeDefined();
        expect(step.confidence.score).toBeGreaterThanOrEqual(0);
        expect(step.confidence.score).toBeLessThanOrEqual(100);
      });
    });

    it('should calculate accurate planning insights', async () => {
      const request: TaskPlanRequest = {
        userRequest: 'Test task',
        context: {
          workspaceRoot: '/test',
          openFiles: [],
          recentFiles: []
        }
      };

      vi.spyOn(taskPlanner as any, 'planTask').mockResolvedValue({
        task: {
          id: 'task-1',
          title: 'Test',
          description: 'Test',
          userRequest: 'Test',
          steps: [
            {
              id: 'step-1',
              taskId: 'task-1',
              order: 1,
              title: 'Step 1',
              description: 'Test',
              action: { type: 'read_file', params: {} },
              status: 'pending',
              requiresApproval: false,
              retryCount: 0,
              maxRetries: 3
            }
          ],
          status: 'awaiting_approval',
          createdAt: new Date()
        },
        reasoning: 'Test',
        estimatedTime: '1 minute',
        warnings: []
      });

      vi.spyOn(mockMemory, 'queryPatterns').mockResolvedValue([]);

      const result = await (taskPlanner as any).planTaskWithConfidence(request, mockMemory);

      expect(result.insights.overallConfidence).toBeLessThanOrEqual(100);
      expect(result.insights.highRiskSteps).toBeGreaterThanOrEqual(0);
      expect(result.insights.memoryBackedSteps).toBeGreaterThanOrEqual(0);
      expect(result.insights.fallbacksGenerated).toBeGreaterThanOrEqual(0);
      expect(result.insights.estimatedSuccessRate).toBeGreaterThanOrEqual(0);
      expect(result.insights.estimatedSuccessRate).toBeLessThanOrEqual(100);
    });
  });

  describe('planTaskEnhanced', () => {
    it('should use internal StrategyMemory instance', async () => {
      const request: TaskPlanRequest = {
        userRequest: 'Test enhanced planning',
        context: {
          workspaceRoot: '/test',
          openFiles: [],
          recentFiles: []
        }
      };

      vi.spyOn(taskPlanner as any, 'planTask').mockResolvedValue({
        task: {
          id: 'task-1',
          title: 'Test',
          description: 'Test',
          userRequest: 'Test',
          steps: [],
          status: 'awaiting_approval',
          createdAt: new Date()
        },
        reasoning: 'Test',
        estimatedTime: '1 minute',
        warnings: []
      });

      const result = await taskPlanner.planTaskEnhanced(request);

      expect(result.insights).toBeDefined();
      expect(result.task).toBeDefined();
      expect(result.reasoning).toBeDefined();
    });
  });

  describe('estimateSuccessRate', () => {
    it('should estimate higher success with memory backing', () => {
      const avgConfidence = 70;
      const memoryRatio = 0.8; // 80% memory-backed

      const successRate = (taskPlanner as any).estimateSuccessRate(avgConfidence, memoryRatio);

      expect(successRate).toBeGreaterThan(avgConfidence);
      expect(successRate).toBeLessThanOrEqual(100);
    });

    it('should cap success rate at 95%', () => {
      const avgConfidence = 95;
      const memoryRatio = 1.0; // 100% memory-backed

      const successRate = (taskPlanner as any).estimateSuccessRate(avgConfidence, memoryRatio);

      expect(successRate).toBeLessThanOrEqual(95);
    });

    it('should return low success rate for low confidence with no memory', () => {
      const avgConfidence = 10;
      const memoryRatio = 0;

      const successRate = (taskPlanner as any).estimateSuccessRate(avgConfidence, memoryRatio);

      // No floor - returns avgConfidence (10) when no memory backing
      expect(successRate).toBe(10);
      expect(successRate).toBeGreaterThanOrEqual(0);
    });
  });
});
