import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionManager, Session, AgentSession, SessionCheckpoint } from '../../services/SessionManager';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  const mockProjectPath = '/test/project';

  beforeEach(() => {
    sessionManager = new SessionManager();
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default persistence path', () => {
      const manager = new SessionManager();
      expect(manager).toBeDefined();
    });

    it('should initialize with custom persistence path', () => {
      const customPath = '/custom/path';
      const manager = new SessionManager(customPath);
      expect(manager).toBeDefined();
    });
  });

  describe('createSession', () => {
    it('should create a new session with correct properties', () => {
      const session = sessionManager.createSession(mockProjectPath);

      expect(session.id).toBeDefined();
      expect(session.id).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(session.timestamp).toBeInstanceOf(Date);
      expect(session.projectPath).toBe(mockProjectPath);
      expect(session.agents).toEqual([]);
      expect(session.totalCost).toBe(0);
      expect(session.duration).toBe(0);
      expect(session.status).toBe('active');
    });

    it('should generate unique session IDs', () => {
      const session1 = sessionManager.createSession(mockProjectPath);
      const session2 = sessionManager.createSession(mockProjectPath);

      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('addAgentToSession', () => {
    let session: Session;

    beforeEach(() => {
      session = sessionManager.createSession(mockProjectPath);
    });

    it('should add agent to existing session', () => {
      const agentId = 'test-agent-1';
      const agentName = 'Test Agent';

      const agentSession = sessionManager.addAgentToSession(session.id, agentId, agentName);

      expect(agentSession.agentId).toBe(agentId);
      expect(agentSession.agentName).toBe(agentName);
      expect(agentSession.tasks).toEqual([]);
      expect(agentSession.results).toEqual([]);
      expect(agentSession.tokenUsage).toEqual({ input: 0, output: 0 });
      expect(agentSession.cost).toBe(0);
      expect(agentSession.state).toEqual({});
    });

    it('should add agent to session agents array', () => {
      const agentId = 'test-agent-1';
      const agentName = 'Test Agent';

      sessionManager.addAgentToSession(session.id, agentId, agentName);

      expect(session.agents).toHaveLength(1);
      expect(session.agents[0].agentId).toBe(agentId);
      expect(session.agents[0].agentName).toBe(agentName);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        sessionManager.addAgentToSession('non-existent', 'agent-1', 'Agent');
      }).toThrow('Session not found');
    });

    it('should allow multiple agents in same session', () => {
      sessionManager.addAgentToSession(session.id, 'agent-1', 'Agent 1');
      sessionManager.addAgentToSession(session.id, 'agent-2', 'Agent 2');

      expect(session.agents).toHaveLength(2);
      expect(session.agents[0].agentId).toBe('agent-1');
      expect(session.agents[1].agentId).toBe('agent-2');
    });
  });

  describe('updateAgentState', () => {
    let session: Session;
    let agentSession: AgentSession;

    beforeEach(() => {
      session = sessionManager.createSession(mockProjectPath);
      agentSession = sessionManager.addAgentToSession(session.id, 'test-agent', 'Test Agent');
    });

    it('should update agent state', () => {
      const newState = { progress: 50, currentTask: 'coding' };

      sessionManager.updateAgentState(session.id, 'test-agent', newState);

      expect(agentSession.state).toEqual(newState);
    });

    it('should merge state updates', () => {
      const initialState = { progress: 50, currentTask: 'coding' };
      const updateState = { progress: 75, status: 'completed' };

      sessionManager.updateAgentState(session.id, 'test-agent', initialState);
      sessionManager.updateAgentState(session.id, 'test-agent', updateState);

      expect(agentSession.state).toEqual({
        progress: 75,
        currentTask: 'coding',
        status: 'completed'
      });
    });

    it('should do nothing for non-existent session', () => {
      // Should not throw
      sessionManager.updateAgentState('non-existent', 'agent', { test: true });
    });

    it('should do nothing for non-existent agent', () => {
      // Should not throw
      sessionManager.updateAgentState(session.id, 'non-existent-agent', { test: true });
    });
  });

  describe('createCheckpoint', () => {
    let session: Session;

    beforeEach(() => {
      session = sessionManager.createSession(mockProjectPath);
      sessionManager.addAgentToSession(session.id, 'test-agent', 'Test Agent');
    });

    it('should create checkpoint with correct properties', () => {
      const description = 'Test checkpoint';
      const checkpoint = sessionManager.createCheckpoint(session.id, description);

      expect(checkpoint.sessionId).toBe(session.id);
      expect(checkpoint.checkpointId).toBeDefined();
      expect(checkpoint.checkpointId).toMatch(/^checkpoint_\d+_[a-z0-9]+$/);
      expect(checkpoint.timestamp).toBeInstanceOf(Date);
      expect(checkpoint.description).toBe(description);
      expect(checkpoint.state).toEqual(session);
    });

    it('should deep clone session state', () => {
      const description = 'Test checkpoint';
      const checkpoint = sessionManager.createCheckpoint(session.id, description);

      // Modify original session
      session.totalCost = 100;

      // Checkpoint should not be affected
      expect(checkpoint.state.totalCost).toBe(0);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        sessionManager.createCheckpoint('non-existent', 'Test');
      }).toThrow('Session not found');
    });

    it('should generate unique checkpoint IDs', () => {
      const checkpoint1 = sessionManager.createCheckpoint(session.id, 'Checkpoint 1');
      const checkpoint2 = sessionManager.createCheckpoint(session.id, 'Checkpoint 2');

      expect(checkpoint1.checkpointId).not.toBe(checkpoint2.checkpointId);
    });
  });

  describe('restoreFromCheckpoint', () => {
    let session: Session;
    let checkpoint: SessionCheckpoint;

    beforeEach(() => {
      session = sessionManager.createSession(mockProjectPath);
      sessionManager.addAgentToSession(session.id, 'test-agent', 'Test Agent');
      checkpoint = sessionManager.createCheckpoint(session.id, 'Test checkpoint');
    });

    it('should restore session from checkpoint', () => {
      const restoredSession = sessionManager.restoreFromCheckpoint(checkpoint.checkpointId);

      expect(restoredSession).not.toBeNull();
      expect(restoredSession!.id).not.toBe(session.id); // Should have new ID
      expect(restoredSession!.projectPath).toBe(session.projectPath);
      expect(restoredSession!.agents).toHaveLength(session.agents.length);
      expect(restoredSession!.status).toBe('active');
      expect(restoredSession!.timestamp).toBeInstanceOf(Date);
    });

    it('should return null for non-existent checkpoint', () => {
      const result = sessionManager.restoreFromCheckpoint('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getSessionHistory', () => {
    it('should return empty array when no sessions', () => {
      const history = sessionManager.getSessionHistory();
      expect(history).toEqual([]);
    });

    it('should return sessions sorted by timestamp (newest first)', () => {
      const session1 = sessionManager.createSession('/project1');
      // Wait a bit to ensure different timestamps
      const session2 = sessionManager.createSession('/project2');
      const session3 = sessionManager.createSession('/project3');

      const history = sessionManager.getSessionHistory();

      expect(history).toHaveLength(3);
      expect(history[0].timestamp.getTime()).toBeGreaterThanOrEqual(history[1].timestamp.getTime());
      expect(history[1].timestamp.getTime()).toBeGreaterThanOrEqual(history[2].timestamp.getTime());
    });

    it('should respect limit parameter', () => {
      sessionManager.createSession('/project1');
      sessionManager.createSession('/project2');
      sessionManager.createSession('/project3');

      const history = sessionManager.getSessionHistory(2);
      expect(history).toHaveLength(2);
    });

    it('should default to limit of 10', () => {
      // Create more than 10 sessions
      for (let i = 0; i < 15; i++) {
        sessionManager.createSession(`/project${i}`);
      }

      const history = sessionManager.getSessionHistory();
      expect(history).toHaveLength(10);
    });
  });

  describe('calculateSessionMetrics', () => {
    let session: Session;

    beforeEach(() => {
      session = sessionManager.createSession(mockProjectPath);
    });

    it('should return null for non-existent session', () => {
      const metrics = sessionManager.calculateSessionMetrics('non-existent');
      expect(metrics).toBeNull();
    });

    it('should calculate metrics for session with no agents', () => {
      const metrics = sessionManager.calculateSessionMetrics(session.id);

      expect(metrics).not.toBeNull();
      expect(metrics!.totalTokens).toBe(0);
      expect(metrics!.totalTasks).toBe(0);
      expect(metrics!.successRate).toBe(0);
      expect(metrics!.avgCostPerTask).toBe(0);
      expect(metrics!.duration).toBe(0);
    });

    it('should calculate metrics for session with agents', () => {
      const agentSession = sessionManager.addAgentToSession(session.id, 'test-agent', 'Test Agent');
      
      // Mock some data
      agentSession.tokenUsage = { input: 100, output: 50 };
      agentSession.tasks = [
        { id: '1', title: 'Task 1', description: 'Test task 1', status: 'completed' },
        { id: '2', title: 'Task 2', description: 'Test task 2', status: 'completed' }
      ] as any[];
      agentSession.results = [
        { success: true, output: 'Result 1' } as any,
        { success: false, output: 'Result 2' } as any
      ];
      session.totalCost = 10;
      session.duration = 3600;

      const metrics = sessionManager.calculateSessionMetrics(session.id);

      expect(metrics).not.toBeNull();
      expect(metrics!.totalTokens).toBe(150);
      expect(metrics!.totalTasks).toBe(2);
      expect(metrics!.successRate).toBe(0.5); // 1 success out of 2 tasks
      expect(metrics!.avgCostPerTask).toBe(5); // 10 / 2
      expect(metrics!.duration).toBe(3600);
    });
  });

  describe('exportSession', () => {
    let session: Session;

    beforeEach(() => {
      session = sessionManager.createSession(mockProjectPath);
      sessionManager.addAgentToSession(session.id, 'test-agent', 'Test Agent');
    });

    it('should export session as JSON string', () => {
      const exported = sessionManager.exportSession(session.id);
      const parsed = JSON.parse(exported);

      expect(parsed.id).toBe(session.id);
      expect(parsed.projectPath).toBe(session.projectPath);
      expect(parsed.agents).toHaveLength(1);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        sessionManager.exportSession('non-existent');
      }).toThrow('Session not found');
    });
  });

  describe('importSession', () => {
    it('should import session from JSON string', () => {
      const sessionData = {
        id: 'old-id',
        timestamp: new Date('2023-01-01'),
        projectPath: '/imported/project',
        agents: [],
        totalCost: 0,
        duration: 0,
        status: 'completed' as const
      };

      const imported = sessionManager.importSession(JSON.stringify(sessionData));

      expect(imported.id).not.toBe(sessionData.id); // Should have new ID
      expect(imported.projectPath).toBe(sessionData.projectPath);
      expect(imported.timestamp).toBeInstanceOf(Date);
      expect(imported.timestamp.getTime()).toBeGreaterThan(sessionData.timestamp.getTime());
    });

    it('should throw error for invalid JSON', () => {
      expect(() => {
        sessionManager.importSession('invalid json');
      }).toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow', () => {
      // Create session
      const session = sessionManager.createSession(mockProjectPath);
      expect(session.status).toBe('active');

      // Add agents
      const agent1 = sessionManager.addAgentToSession(session.id, 'frontend', 'Frontend Agent');
      const agent2 = sessionManager.addAgentToSession(session.id, 'backend', 'Backend Agent');

      expect(session.agents).toHaveLength(2);

      // Update agent states
      sessionManager.updateAgentState(session.id, 'frontend', { progress: 50 });
      sessionManager.updateAgentState(session.id, 'backend', { progress: 75 });

      expect(agent1.state.progress).toBe(50);
      expect(agent2.state.progress).toBe(75);

      // Create checkpoint
      const checkpoint = sessionManager.createCheckpoint(session.id, 'Mid-progress checkpoint');
      expect(checkpoint.state.agents).toHaveLength(2);

      // Continue work
      sessionManager.updateAgentState(session.id, 'frontend', { progress: 100, status: 'completed' });
      
      // Restore from checkpoint
      const restored = sessionManager.restoreFromCheckpoint(checkpoint.checkpointId);
      expect(restored).not.toBeNull();
      expect(restored!.agents[0].state.progress).toBe(50); // Original checkpoint state

      // Check history
      const history = sessionManager.getSessionHistory();
      expect(history.length).toBeGreaterThanOrEqual(2); // Original + restored
    });

    it('should handle multiple sessions concurrently', () => {
      const sessions = [];
      for (let i = 0; i < 5; i++) {
        const session = sessionManager.createSession(`/project${i}`);
        sessionManager.addAgentToSession(session.id, 'agent', `Agent ${i}`);
        sessions.push(session);
      }

      const history = sessionManager.getSessionHistory();
      expect(history).toHaveLength(5);

      // Each session should be independent
      sessions.forEach((session, index) => {
        sessionManager.updateAgentState(session.id, 'agent', { projectIndex: index });
        expect(session.agents[0].state.projectIndex).toBe(index);
      });
    });
  });
});