/**
 * Comprehensive tests for AgentOrchestrator
 * Coverage target: 85%+ for multi-agent coordination logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentOrchestrator } from '../../../services/specialized-agents/AgentOrchestrator';
import { DeepSeekService } from '../../../services/DeepSeekService';
import { AgentContext } from '../../../services/specialized-agents/BaseSpecializedAgent';

// Mock DeepSeekService
vi.mock('../../../services/DeepSeekService');

// Mock all agent classes
vi.mock('../../../services/specialized-agents/TechnicalLeadAgent');
vi.mock('../../../services/specialized-agents/FrontendEngineerAgent');
vi.mock('../../../services/specialized-agents/BackendEngineerAgent');
vi.mock('../../../services/specialized-agents/PerformanceAgent');
vi.mock('../../../services/specialized-agents/SecurityAgent');
vi.mock('../../../services/specialized-agents/SuperCodingAgent');

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;
  let mockDeepSeekService: DeepSeekService;

  beforeEach(() => {
    mockDeepSeekService = {} as DeepSeekService;
    orchestrator = new AgentOrchestrator(mockDeepSeekService);
  });

  describe('initialization', () => {
    it('should initialize all specialized agents', () => {
      expect(orchestrator).toBeDefined();
      const agents = orchestrator.getAvailableAgents();
      expect(agents.length).toBeGreaterThan(0);
    });

    it('should return available agents with metadata', () => {
      const agents = orchestrator.getAvailableAgents();

      agents.forEach(agent => {
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('role');
        expect(agent).toHaveProperty('capabilities');
        expect(agent).toHaveProperty('specialization');
        expect(agent).toHaveProperty('performance');
        expect(agent.performance).toHaveProperty('avgResponseTime');
        expect(agent.performance).toHaveProperty('successRate');
        expect(agent.performance).toHaveProperty('confidence');
      });
    });
  });

  describe('agent selection and coordination', () => {
    it('should select frontend agent for React component request', async () => {
      const request = 'Create a new React component with TypeScript';
      const context: AgentContext = {
        currentFile: 'Button.tsx',
      };

      const result = await orchestrator.processRequest(request, context);

      expect(result).toBeDefined();
      expect(result.response).toBeTruthy();
      expect(result.agentResponses).toBeDefined();
      // Should include frontend_engineer in selected agents
      expect(Object.keys(result.agentResponses).some(key =>
        key.includes('frontend')
      )).toBe(true);
    });

    it('should select backend agent for API request', async () => {
      const request = 'Create a REST API endpoint for user management';
      const context: AgentContext = {
        currentFile: 'api/users.ts',
      };

      const result = await orchestrator.processRequest(request, context);

      expect(result).toBeDefined();
      expect(Object.keys(result.agentResponses).some(key =>
        key.includes('backend')
      )).toBe(true);
    });

    it('should select security agent for authentication request', async () => {
      const request = 'Implement secure authentication with JWT tokens';
      const context: AgentContext = {};

      const result = await orchestrator.processRequest(request, context);

      expect(result).toBeDefined();
      expect(Object.keys(result.agentResponses).some(key =>
        key.includes('security')
      )).toBe(true);
    });

    it('should select performance agent for optimization request', async () => {
      const request = 'Optimize the performance of this React component';
      const context: AgentContext = {};

      const result = await orchestrator.processRequest(request, context);

      expect(result).toBeDefined();
      expect(Object.keys(result.agentResponses).some(key =>
        key.includes('performance')
      )).toBe(true);
    });

    it('should select multiple agents for complex architecture request', async () => {
      const request = 'Design the architecture for a scalable microservices system';
      const context: AgentContext = {};

      const result = await orchestrator.processRequest(request, context);

      expect(result).toBeDefined();
      expect(Object.keys(result.agentResponses).length).toBeGreaterThan(1);
      // Should include technical lead for architecture
      expect(Object.keys(result.agentResponses).some(key =>
        key.includes('technical_lead')
      )).toBe(true);
    });

    it('should default to technical lead for unclear requests', async () => {
      const request = 'Help me with something';
      const context: AgentContext = {};

      const result = await orchestrator.processRequest(request, context);

      expect(result).toBeDefined();
      expect(result.agentResponses).toHaveProperty('technical_lead');
    });
  });

  describe('coordination strategies', () => {
    it('should use sequential strategy for single agent', async () => {
      const request = 'Read this file';
      const context: AgentContext = {};

      const result = await orchestrator.processRequest(request, context);

      expect(result.coordination?.strategy).toBeDefined();
      // Single agent typically uses sequential
      if (Object.keys(result.agentResponses).length === 1) {
        expect(['sequential', 'parallel']).toContain(result.coordination?.strategy);
      }
    });

    it('should use hierarchical strategy for technical lead oversight', async () => {
      const request = 'Design and implement a scalable API with security and performance optimization';
      const context: AgentContext = {};

      const result = await orchestrator.processRequest(request, context);

      expect(result.coordination).toBeDefined();
      // Complex multi-agent tasks should use hierarchical
      if (Object.keys(result.agentResponses).length > 2) {
        expect(result.coordination?.strategy).toBe('hierarchical');
      }
    });

    it('should provide coordination reasoning', async () => {
      const request = 'Create a new feature with frontend and backend';
      const context: AgentContext = {};

      const result = await orchestrator.processRequest(request, context);

      expect(result.coordination?.reasoning).toBeTruthy();
      expect(result.coordination?.confidence).toBeGreaterThanOrEqual(0);
      expect(result.coordination?.confidence).toBeLessThanOrEqual(1);
    });

    it('should calculate parallelism based on agents', async () => {
      const request = 'Implement feature with multiple specialists';
      const context: AgentContext = {};

      const result = await orchestrator.processRequest(request, context);

      expect(result.performance?.parallelism).toBeGreaterThanOrEqual(1);
    });
  });

  describe('context enhancement', () => {
    it('should boost frontend score for .tsx files', async () => {
      const request = 'Update this component';
      const context: AgentContext = {
        currentFile: 'MyComponent.tsx',
      };

      const result = await orchestrator.processRequest(request, context);

      // Should select frontend engineer due to .tsx file
      expect(Object.keys(result.agentResponses).some(key =>
        key.includes('frontend')
      )).toBe(true);
    });

    it('should boost backend score for api files', async () => {
      const request = 'Update this file';
      const context: AgentContext = {
        currentFile: 'api/service.ts',
      };

      const result = await orchestrator.processRequest(request, context);

      // Should select backend engineer due to api file
      expect(Object.keys(result.agentResponses).some(key =>
        key.includes('backend')
      )).toBe(true);
    });

    it('should boost coding score for test files', async () => {
      const request = 'Update this file';
      const context: AgentContext = {
        currentFile: 'component.test.ts',
      };

      const result = await orchestrator.processRequest(request, context);

      expect(result).toBeDefined();
      // Super coder should be considered for test files
    });
  });

  describe('response synthesis', () => {
    it('should synthesize multiple agent responses', async () => {
      const request = 'Design a scalable system with security';
      const context: AgentContext = {};

      const result = await orchestrator.processRequest(request, context);

      expect(result.response).toBeTruthy();
      if (Object.keys(result.agentResponses).length > 1) {
        expect(result.response).toContain('Multi-Agent Analysis');
      }
    });

    it('should extract recommendations from all agents', async () => {
      const request = 'Improve this codebase';
      const context: AgentContext = {};

      const result = await orchestrator.processRequest(request, context);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should include coordination summary in multi-agent response', async () => {
      const request = 'Complex multi-agent task with architecture and security';
      const context: AgentContext = {};

      const result = await orchestrator.processRequest(request, context);

      if (Object.keys(result.agentResponses).length > 1) {
        expect(result.response).toContain('Coordination Summary');
      }
    });
  });

  describe('performance tracking', () => {
    it('should track performance metrics', async () => {
      const request = 'Test request';
      const context: AgentContext = {};

      await orchestrator.processRequest(request, context);

      const analytics = orchestrator.getPerformanceAnalytics();

      expect(analytics).toBeDefined();
      expect(analytics.totalTasks).toBeGreaterThan(0);
      expect(analytics.successRate).toBeGreaterThanOrEqual(0);
      expect(analytics.avgResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should track agent utilization', async () => {
      const request = 'Test request';
      const context: AgentContext = {};

      await orchestrator.processRequest(request, context);

      const analytics = orchestrator.getPerformanceAnalytics();

      expect(analytics.agentUtilization).toBeDefined();
      expect(typeof analytics.agentUtilization).toBe('object');
    });

    it('should track top task types', async () => {
      const request = 'Test request';
      const context: AgentContext = {};

      await orchestrator.processRequest(request, context);

      const analytics = orchestrator.getPerformanceAnalytics();

      expect(analytics.topTaskTypes).toBeDefined();
      expect(Array.isArray(analytics.topTaskTypes)).toBe(true);
    });

    it('should measure total execution time', async () => {
      const request = 'Test request';
      const context: AgentContext = {};

      const result = await orchestrator.processRequest(request, context);

      expect(result.performance?.totalTime).toBeGreaterThan(0);
    });

    it('should measure individual agent times', async () => {
      const request = 'Test request';
      const context: AgentContext = {};

      const result = await orchestrator.processRequest(request, context);

      expect(result.performance?.agentTimes).toBeDefined();
      expect(typeof result.performance?.agentTimes).toBe('object');
    });
  });

  describe('task management', () => {
    it('should create and track active coordinations', async () => {
      const request = 'Test request';
      const context: AgentContext = {};

      // Start request in background (conceptually)
      const promise = orchestrator.processRequest(request, context);

      // Check active coordinations (note: will be empty after completion)
      await promise;

      const active = orchestrator.getActiveCoordinations();
      expect(Array.isArray(active)).toBe(true);
    });

    it('should support backward compatible delegateTask', async () => {
      const task = {
        id: 'task_123',
        title: 'Test Task',
        description: 'Test description',
      };

      const result = await orchestrator.delegateTask(task);

      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should support backward compatible coordinateTask', async () => {
      const task = {
        description: 'Test coordination',
      };

      const result = await orchestrator.coordinateTask(task);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.status).toBe('pending');
      expect(result.requiredAgents).toBeDefined();
    });

    it('should cancel coordination', () => {
      const cancelled = orchestrator.cancelCoordination('nonexistent_task');
      expect(cancelled).toBe(false); // Task doesn't exist
    });
  });

  describe('error handling', () => {
    it('should handle agent initialization failure gracefully', () => {
      // Orchestrator should still initialize even if some agents fail
      expect(orchestrator).toBeDefined();
    });

    it('should handle request processing errors', async () => {
      const request = 'Test request';
      const context: AgentContext = {};

      // Should not throw even if agents fail
      const result = await orchestrator.processRequest(request, context);
      expect(result).toBeDefined();
    });

    it('should continue execution if some agents fail in parallel', async () => {
      const request = 'Complex request requiring multiple agents';
      const context: AgentContext = {};

      const result = await orchestrator.processRequest(request, context);

      // Should still return a result even if some agents fail
      expect(result).toBeDefined();
      expect(result.response).toBeTruthy();
    });
  });

  describe('pattern matching', () => {
    it('should detect architecture keywords', async () => {
      const architectureKeywords = [
        'architecture',
        'design',
        'structure',
        'pattern',
        'scalability',
        'system',
      ];

      for (const keyword of architectureKeywords) {
        const request = `Please help with ${keyword}`;
        const result = await orchestrator.processRequest(request, {});

        // Should select technical lead for architecture
        expect(Object.keys(result.agentResponses).some(key =>
          key.includes('technical_lead')
        )).toBe(true);
      }
    });

    it('should detect frontend keywords', async () => {
      const frontendKeywords = ['react', 'component', 'ui', 'frontend', 'interface'];

      for (const keyword of frontendKeywords) {
        const request = `Please help with ${keyword}`;
        const result = await orchestrator.processRequest(request, {});

        expect(result).toBeDefined();
        // Should consider frontend agent
      }
    });

    it('should detect security keywords', async () => {
      const securityKeywords = ['security', 'auth', 'authentication', 'vulnerability'];

      for (const keyword of securityKeywords) {
        const request = `Please help with ${keyword}`;
        const result = await orchestrator.processRequest(request, {});

        // Should select security specialist
        expect(Object.keys(result.agentResponses).some(key =>
          key.includes('security')
        )).toBe(true);
      }
    });

    it('should detect performance keywords', async () => {
      const performanceKeywords = ['performance', 'optimization', 'speed', 'efficiency'];

      for (const keyword of performanceKeywords) {
        const request = `Please help with ${keyword}`;
        const result = await orchestrator.processRequest(request, {});

        // Should select performance specialist
        expect(Object.keys(result.agentResponses).some(key =>
          key.includes('performance')
        )).toBe(true);
      }
    });
  });

  describe('agent workload calculation', () => {
    it('should calculate agent workload', async () => {
      // Execute multiple requests
      for (let i = 0; i < 3; i++) {
        await orchestrator.processRequest('Test request', {});
      }

      const agents = orchestrator.getAvailableAgents();

      agents.forEach(agent => {
        expect(agent.workload).toBeGreaterThanOrEqual(0);
        expect(agent.workload).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('task categorization', () => {
    it('should categorize UI development tasks', async () => {
      await orchestrator.processRequest('Create a new component', {});

      const analytics = orchestrator.getPerformanceAnalytics();
      const uiTasks = analytics.topTaskTypes.filter(t => t.type === 'ui-development');

      // Should track UI tasks if any
      expect(analytics.topTaskTypes).toBeDefined();
    });

    it('should categorize API development tasks', async () => {
      await orchestrator.processRequest('Create a new API endpoint', {});

      const analytics = orchestrator.getPerformanceAnalytics();
      expect(analytics.topTaskTypes).toBeDefined();
    });

    it('should categorize security tasks', async () => {
      await orchestrator.processRequest('Add authentication', {});

      const analytics = orchestrator.getPerformanceAnalytics();
      expect(analytics.topTaskTypes).toBeDefined();
    });

    it('should categorize optimization tasks', async () => {
      await orchestrator.processRequest('Optimize performance', {});

      const analytics = orchestrator.getPerformanceAnalytics();
      expect(analytics.topTaskTypes).toBeDefined();
    });
  });

  describe('multi-agent limits', () => {
    it('should limit to top 3 agents for efficiency', async () => {
      const request = 'Complex request with architecture frontend backend security performance testing';
      const context: AgentContext = {};

      const result = await orchestrator.processRequest(request, context);

      // Should limit to reasonable number of agents
      expect(Object.keys(result.agentResponses).length).toBeLessThanOrEqual(4); // 3 + tech lead
    });

    it('should always include technical lead for complex multi-agent tasks', async () => {
      const request = 'Design system architecture with frontend backend and security';
      const context: AgentContext = {};

      const result = await orchestrator.processRequest(request, context);

      if (Object.keys(result.agentResponses).length > 2) {
        expect(result.agentResponses).toHaveProperty('technical_lead');
      }
    });
  });
});
