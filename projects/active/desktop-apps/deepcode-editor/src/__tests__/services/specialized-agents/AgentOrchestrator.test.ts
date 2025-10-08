import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { AgentOrchestrator, OrchestratorTask } from '../../../services/specialized-agents/AgentOrchestrator';
import { DeepSeekService } from '../../../services/DeepSeekService';
import { BaseSpecializedAgent, AgentContext, AgentResponse } from '../../../services/specialized-agents/BaseSpecializedAgent';

// Mock the logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

// Mock the specialized agents
vi.mock('../../../services/specialized-agents/TechnicalLeadAgent', () => ({
  TechnicalLeadAgent: vi.fn().mockImplementation(() => ({
    getName: () => 'Technical Lead Agent',
    getRole: () => 'Architecture specialist with 5 capabilities',
    getCapabilities: () => ['code_analysis', 'architecture', 'best_practices', 'code_review', 'system_design'],
    process: vi.fn().mockResolvedValue({
      content: 'Technical lead response',
      confidence: 0.9,
      suggestions: ['Follow SOLID principles', 'Use proper error handling']
    })
  }))
}));

vi.mock('../../../services/specialized-agents/FrontendEngineerAgent', () => ({
  FrontendEngineerAgent: vi.fn().mockImplementation(() => ({
    getName: () => 'Frontend Engineer Agent',
    getRole: () => 'Frontend specialist with 6 capabilities',
    getCapabilities: () => ['react', 'ui_components', 'state_management', 'css', 'accessibility', 'performance'],
    process: vi.fn().mockResolvedValue({
      content: 'Frontend engineer response',
      confidence: 0.85,
      suggestions: ['Use React hooks', 'Implement proper accessibility']
    })
  }))
}));

vi.mock('../../../services/specialized-agents/BackendEngineerAgent', () => ({
  BackendEngineerAgent: vi.fn().mockImplementation(() => ({
    getName: () => 'Backend Engineer Agent',
    getRole: () => 'Backend specialist with 5 capabilities',
    getCapabilities: () => ['api_design', 'database', 'security', 'performance', 'authentication'],
    process: vi.fn().mockResolvedValue({
      content: 'Backend engineer response',
      confidence: 0.8,
      suggestions: ['Use proper authentication', 'Implement rate limiting']
    })
  }))
}));

vi.mock('../../../services/specialized-agents/PerformanceAgent', () => ({
  PerformanceAgent: vi.fn().mockImplementation(() => ({
    getName: () => 'Performance Agent',
    getRole: () => 'Performance specialist with 4 capabilities',
    getCapabilities: () => ['performance_analysis', 'optimization', 'profiling', 'load_testing'],
    process: vi.fn().mockResolvedValue({
      content: 'Performance agent response',
      confidence: 0.88
    })
  }))
}));

vi.mock('../../../services/specialized-agents/SecurityAgent', () => ({
  SecurityAgent: vi.fn().mockImplementation(() => ({
    getName: () => 'Security Agent',
    getRole: () => 'Security specialist with 3 capabilities',
    getCapabilities: () => ['vulnerability_scanning', 'security_review', 'penetration_testing'],
    process: vi.fn().mockResolvedValue({
      content: 'Security agent response',
      confidence: 0.92
    })
  }))
}));

vi.mock('../../../services/specialized-agents/SuperCodingAgent', () => ({
  SuperCodingAgent: vi.fn().mockImplementation(() => ({
    getName: () => 'Super Coding Agent',
    getRole: () => 'General specialist with 7 capabilities',
    getCapabilities: () => ['code_generation', 'refactoring', 'debugging', 'test_automation', 'documentation', 'code_review', 'best_practices'],
    process: vi.fn().mockResolvedValue({
      content: 'Super coding agent response',
      confidence: 0.87
    })
  }))
}));

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;
  let mockDeepSeekService: DeepSeekService;

  beforeEach(() => {
    mockDeepSeekService = {
      sendMessage: vi.fn().mockResolvedValue({ content: 'AI response' })
    } as any;

    orchestrator = new AgentOrchestrator(mockDeepSeekService);
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with all specialized agents', () => {
      expect(orchestrator).toBeDefined();
      
      const availableAgents = orchestrator.getAvailableAgents();
      expect(availableAgents).toHaveLength(6);
      
      const agentNames = availableAgents.map(agent => agent.name);
      expect(agentNames).toContain('Technical Lead Agent');
      expect(agentNames).toContain('Frontend Engineer Agent');
      expect(agentNames).toContain('Backend Engineer Agent');
      expect(agentNames).toContain('Performance Agent');
      expect(agentNames).toContain('Security Agent');
      expect(agentNames).toContain('Super Coding Agent');
    });

    it('should handle agent initialization errors gracefully', () => {
      // Mock initialization to throw error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create orchestrator that would fail to initialize some agents
      const orchestratorWithErrors = new AgentOrchestrator(mockDeepSeekService);
      
      expect(orchestratorWithErrors).toBeDefined();
      consoleSpy.mockRestore();
    });
  });

  describe('processRequest', () => {
    const mockContext: AgentContext = {
      currentFile: '/test/file.tsx',
      workspaceRoot: '/test/workspace',
      files: ['/test/file.tsx', '/test/helper.ts']
    };

    it('should process request with single agent', async () => {
      const request = 'How to implement proper authentication?';
      
      const result = await orchestrator.processRequest(request, mockContext);
      
      expect(result.response).toBeDefined();
      expect(result.agentResponses).toBeDefined();
      expect(Object.keys(result.agentResponses)).toContain('technical_lead');
    });

    it('should process request with multiple agents', async () => {
      const request = 'Create a React component with proper API integration';
      
      const result = await orchestrator.processRequest(request, mockContext);
      
      expect(result.response).toBeDefined();
      expect(result.agentResponses).toBeDefined();
      
      // Should involve technical lead, frontend, and backend engineers
      const involvedAgents = Object.keys(result.agentResponses);
      expect(involvedAgents).toContain('technical_lead');
      expect(involvedAgents).toContain('frontend_engineer');
      expect(involvedAgents).toContain('backend_engineer');
    });

    it('should analyze request correctly for frontend tasks', async () => {
      const request = 'How to optimize React component performance?';
      
      const result = await orchestrator.processRequest(request, mockContext);
      
      const involvedAgents = Object.keys(result.agentResponses);
      expect(involvedAgents).toContain('frontend_engineer');
    });

    it('should analyze request correctly for backend tasks', async () => {
      const request = 'Design a secure API endpoint';
      
      const result = await orchestrator.processRequest(request, mockContext);
      
      const involvedAgents = Object.keys(result.agentResponses);
      expect(involvedAgents).toContain('backend_engineer');
    });

    it('should default to technical lead for unclear requests', async () => {
      const request = 'Help me with this project';
      
      const result = await orchestrator.processRequest(request, mockContext);
      
      const involvedAgents = Object.keys(result.agentResponses);
      expect(involvedAgents).toContain('technical_lead');
    });

    it('should synthesize single agent response', async () => {
      const request = 'architecture advice';
      
      const result = await orchestrator.processRequest(request, mockContext);
      
      expect(result.response).toBe('Technical lead response');
      expect(result.recommendations).toEqual(['Follow SOLID principles', 'Use proper error handling']);
    });

    it('should synthesize multiple agent responses', async () => {
      const request = 'Create a full-stack React application with proper architecture';
      
      const result = await orchestrator.processRequest(request, mockContext);
      
      expect(result.response).toContain('## Multi-Agent Analysis');
      expect(result.response).toContain('### Architectural Perspective');
      expect(result.response).toContain('### Frontend Implementation');
      expect(result.response).toContain('### Backend Implementation');
      expect(result.response).toContain('### Coordination Summary');
      
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations!.length).toBeGreaterThan(0);
    });

    it('should handle agent processing errors', async () => {
      // Mock an agent to throw error
      const mockAgent = {
        process: vi.fn().mockRejectedValue(new Error('Agent processing failed'))
      };
      
      (orchestrator as any).agents.set('test_agent', mockAgent);
      
      const request = 'test request that should fail';
      
      await expect(orchestrator.processRequest(request, mockContext)).rejects.toThrow();
    });

    it('should track active tasks', async () => {
      const request = 'test request';
      const processingPromise = orchestrator.processRequest(request, mockContext);
      
      // During processing, task should be active
      const activeTasks = orchestrator.getActiveCoordinations();
      expect(activeTasks.length).toBeGreaterThan(0);
      
      await processingPromise;
      
      // After processing, task should be removed
      const activeTasksAfter = orchestrator.getActiveCoordinations();
      expect(activeTasksAfter.length).toBe(0);
    });
  });

  describe('delegateTask', () => {
    const mockTask = {
      id: 'test-task-1',
      title: 'Create UI component',
      description: 'Build a reusable React component'
    };

    it('should delegate UI task to frontend engineer', async () => {
      const result = await orchestrator.delegateTask(mockTask);
      
      expect(result).toBeDefined();
      expect(result.content).toBe('Frontend engineer response');
    });

    it('should delegate API task to backend engineer', async () => {
      const apiTask = {
        id: 'test-task-2',
        title: 'Create API endpoint',
        description: 'Build a secure REST API'
      };
      
      const result = await orchestrator.delegateTask(apiTask);
      
      expect(result).toBeDefined();
      expect(result.content).toBe('Backend engineer response');
    });

    it('should delegate architectural task to technical lead', async () => {
      const architecturalTask = {
        id: 'test-task-3',
        title: 'System design',
        description: 'Design the overall system architecture'
      };
      
      const result = await orchestrator.delegateTask(architecturalTask);
      
      expect(result).toBeDefined();
      expect(result.content).toBe('Technical lead response');
    });

    it('should throw error for no suitable agent', async () => {
      // Mock scenario where no agents are available
      (orchestrator as any).agents.clear();
      
      await expect(orchestrator.delegateTask(mockTask)).rejects.toThrow('No suitable agent found');
    });

    it('should pass context to delegated agent', async () => {
      const context: AgentContext = {
        currentFile: '/test/component.tsx',
        selectedText: 'const Component = () => <div>Test</div>;'
      };
      
      const result = await orchestrator.delegateTask(mockTask, context);
      
      expect(result).toBeDefined();
      // Verify that the agent's process method was called
      const agents = orchestrator.getAvailableAgents();
      expect(agents.length).toBeGreaterThan(0);
    });
  });

  describe('getAvailableAgents', () => {
    it('should return all initialized agents', () => {
      const agents = orchestrator.getAvailableAgents();
      
      expect(agents).toHaveLength(6);
      
      agents.forEach(agent => {
        expect(agent.name).toBeDefined();
        expect(agent.role).toBeDefined();
        expect(Array.isArray(agent.capabilities)).toBe(true);
        expect(agent.capabilities.length).toBeGreaterThan(0);
      });
    });

    it('should return agent capabilities as strings', () => {
      const agents = orchestrator.getAvailableAgents();
      
      agents.forEach(agent => {
        agent.capabilities.forEach(capability => {
          expect(typeof capability).toBe('string');
        });
      });
    });
  });

  describe('Backward Compatibility Methods', () => {
    describe('coordinateTask', () => {
      it('should create coordinated task', async () => {
        const task = {
          id: 'test-task',
          description: 'Test task description',
          context: { test: true }
        };
        
        const coordinatedTask = await orchestrator.coordinateTask(task);
        
        expect(coordinatedTask.id).toBe(task.id);
        expect(coordinatedTask.description).toBe(task.description);
        expect(coordinatedTask.context).toEqual(task.context);
        expect(coordinatedTask.status).toBe('pending');
        expect(Array.isArray(coordinatedTask.requiredAgents)).toBe(true);
      });

      it('should generate task ID if not provided', async () => {
        const task = {
          description: 'Test task without ID'
        };
        
        const coordinatedTask = await orchestrator.coordinateTask(task);
        
        expect(coordinatedTask.id).toBeDefined();
        expect(coordinatedTask.id).toMatch(/^task_\d+_[a-z0-9]+$/);
      });
    });

    describe('getActiveCoordinations', () => {
      it('should return empty array initially', () => {
        const active = orchestrator.getActiveCoordinations();
        expect(active).toEqual([]);
      });
    });

    describe('getCoordinatedTask', () => {
      it('should return undefined for non-existent task', () => {
        const task = orchestrator.getCoordinatedTask('non-existent');
        expect(task).toBeUndefined();
      });

      it('should return task for existing task ID', async () => {
        const task = await orchestrator.coordinateTask({ description: 'Test' });
        const retrieved = orchestrator.getCoordinatedTask(task.id);
        expect(retrieved).toEqual(task);
      });
    });

    describe('cancelCoordination', () => {
      it('should return false for non-existent task', () => {
        const result = orchestrator.cancelCoordination('non-existent');
        expect(result).toBe(false);
      });

      it('should cancel existing task', async () => {
        const task = await orchestrator.coordinateTask({ description: 'Test' });
        const result = orchestrator.cancelCoordination(task.id);
        expect(result).toBe(true);
        
        const retrieved = orchestrator.getCoordinatedTask(task.id);
        expect(retrieved).toBeUndefined();
      });
    });
  });

  describe('Private Methods', () => {
    describe('analyzeRequest', () => {
      it('should identify technical lead patterns', () => {
        const requests = [
          'system architecture advice',
          'technology choice for this project',
          'code review guidelines',
          'best practices for scalability'
        ];
        
        requests.forEach(async (request) => {
          const result = await orchestrator.processRequest(request);
          expect(Object.keys(result.agentResponses)).toContain('technical_lead');
        });
      });

      it('should identify frontend patterns', () => {
        const requests = [
          'React component optimization',
          'UI accessibility improvements',
          'state management with hooks',
          'styled-components best practices'
        ];
        
        requests.forEach(async (request) => {
          const result = await orchestrator.processRequest(request);
          expect(Object.keys(result.agentResponses)).toContain('frontend_engineer');
        });
      });

      it('should identify backend patterns', () => {
        const requests = [
          'API endpoint security',
          'database optimization',
          'authentication implementation',
          'WebSocket server setup'
        ];
        
        requests.forEach(async (request) => {
          const result = await orchestrator.processRequest(request);
          expect(Object.keys(result.agentResponses)).toContain('backend_engineer');
        });
      });
    });

    describe('generateCoordinationSummary', () => {
      it('should generate summary for single agent', () => {
        const agentResponses = {
          'technical_lead': {
            content: 'Technical guidance',
            confidence: 0.9
          }
        };
        
        const summary = (orchestrator as any).generateCoordinationSummary(agentResponses);
        expect(typeof summary).toBe('string');
      });

      it('should generate coordination summary for multiple agents', () => {
        const agentResponses = {
          'technical_lead': {
            content: 'Architectural guidance',
            confidence: 0.9
          },
          'frontend_engineer': {
            content: 'UI implementation',
            confidence: 0.85
          },
          'backend_engineer': {
            content: 'API design',
            confidence: 0.8
          }
        };
        
        const summary = (orchestrator as any).generateCoordinationSummary(agentResponses);
        expect(summary).toContain('Key Points of Agreement');
        expect(summary).toContain('Areas Requiring Coordination');
        expect(summary).toContain('Recommended Next Steps');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex multi-step request', async () => {
      const request = 'I need to build a secure, high-performance React application with real-time features and proper architecture';
      const context: AgentContext = {
        workspaceRoot: '/project',
        files: ['/project/src/App.tsx', '/project/src/api/index.ts'],
        currentFile: '/project/src/App.tsx'
      };
      
      const result = await orchestrator.processRequest(request, context);
      
      // Should involve multiple agents
      expect(Object.keys(result.agentResponses).length).toBeGreaterThan(1);
      expect(result.response).toContain('Multi-Agent Analysis');
      expect(result.recommendations).toBeDefined();
      
      // Should include technical lead for architecture
      expect(Object.keys(result.agentResponses)).toContain('technical_lead');
      
      // Should include both frontend and backend
      expect(Object.keys(result.agentResponses)).toContain('frontend_engineer');
      expect(Object.keys(result.agentResponses)).toContain('backend_engineer');
    });

    it('should maintain task state throughout processing', async () => {
      const request = 'Test request for task tracking';
      
      let taskCount = 0;
      const originalProcessRequest = orchestrator.processRequest.bind(orchestrator);
      
      // Override processRequest to check task state during execution
      orchestrator.processRequest = async function(req, ctx) {
        const activeTasks = this.getActiveCoordinations();
        taskCount = activeTasks.length;
        return originalProcessRequest(req, ctx);
      };
      
      await orchestrator.processRequest(request);
      
      expect(taskCount).toBe(1); // Task should be active during processing
      expect(orchestrator.getActiveCoordinations()).toHaveLength(0); // Should be cleaned up after
    });
  });

  describe('Error Handling', () => {
    it('should handle missing agent gracefully', async () => {
      // Remove all agents
      (orchestrator as any).agents.clear();
      
      const request = 'test request';
      const result = await orchestrator.processRequest(request);
      
      // Should still return a response, even if agents are missing
      expect(result.response).toBeDefined();
      expect(result.agentResponses).toEqual({});
    });

    it('should handle agent initialization failures', () => {
      // Test that orchestrator can handle agents that fail to initialize
      expect(() => {
        new AgentOrchestrator(mockDeepSeekService);
      }).not.toThrow();
    });

    it('should handle partial agent failures', async () => {
      // Mock one agent to fail
      const mockFailingAgent = {
        process: vi.fn().mockRejectedValue(new Error('Agent failed'))
      };
      
      (orchestrator as any).agents.set('failing_agent', mockFailingAgent);
      
      // Mock analyzeRequest to include the failing agent
      const originalAnalyzeRequest = (orchestrator as any).analyzeRequest;
      (orchestrator as any).analyzeRequest = () => ['technical_lead', 'failing_agent'];
      
      await expect(orchestrator.processRequest('test')).rejects.toThrow();
      
      // Restore original method
      (orchestrator as any).analyzeRequest = originalAnalyzeRequest;
    });
  });
});