/**
 * useAgentTask Hook
 * State and logic for multi-agent task execution
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { PerformanceProfile } from '../../services/AgentPerformanceOptimizer';
import type { AgentOrchestrator, OrchestratorResponse } from '../../services/specialized-agents/AgentOrchestrator';
import type { AgentContext } from '../../services/specialized-agents/BaseSpecializedAgent';
import type { LogEntry, LogEntryType, LogMetrics, TaskStatus, WorkspaceContextInfo } from './types';

interface UseAgentTaskOptions {
  orchestrator: AgentOrchestrator;
  performanceOptimizer: {
    getAgentProfile: (name: string) => PerformanceProfile | undefined;
    getPerformanceReport: () => {
      avgResponseTime: number;
      cacheEfficiency: number;
      activeAlerts: number;
      memoryUsage: number;
    };
  };
  workspaceContext?: WorkspaceContextInfo;
  onComplete: (result: OrchestratorResponse) => void;
}

export function useAgentTask(options: UseAgentTaskOptions) {
  const { orchestrator, performanceOptimizer, workspaceContext, onComplete } = options;

  const [task, setTask] = useState('');
  const [status, setStatus] = useState<TaskStatus>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [agentProfiles, setAgentProfiles] = useState<Map<string, PerformanceProfile>>(new Map());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['agents', 'performance']));
  const [currentProgress, setCurrentProgress] = useState<string>('');
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Performance monitoring
  useEffect(() => {
    const updateProfiles = () => {
      const agents = orchestrator.getAvailableAgents();
      const profiles = new Map<string, PerformanceProfile>();
      
      agents.forEach(agent => {
        const profile = performanceOptimizer.getAgentProfile(agent.name);
        if (profile) {
          profiles.set(agent.name, profile);
        }
      });
      
      setAgentProfiles(profiles);
    };

    const interval = setInterval(updateProfiles, 2000);
    updateProfiles(); // Initial load

    return () => clearInterval(interval);
  }, [orchestrator, performanceOptimizer]);

  const addLog = useCallback((type: LogEntryType, content: string, agentName?: string, metrics?: LogMetrics) => {
    setLogs(prev => [...prev, {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date(),
      content,
      agentName,
      metrics,
    }]);
  }, []);

  const formatTimestamp = useCallback((date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, []);

  const executeTask = useCallback(async () => {
    if (!task.trim()) return;

    setStatus('analyzing');
    setLogs([]);
    setActiveAgents([]);
    setCurrentProgress('Initializing task analysis...');

    addLog('info', `Starting enhanced multi-agent task: "${task}"`);
    addLog('info', `Workspace: ${workspaceContext?.workspaceFolder || 'No workspace'}`);

    try {
      // Phase 1: Analysis
      setStatus('analyzing');
      setCurrentProgress('Analyzing task requirements and selecting optimal agents...');
      addLog('info', 'Analyzing task requirements...');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Phase 2: Coordination
      setStatus('coordinating');
      setCurrentProgress('Coordinating multi-agent response strategy...');
      addLog('coordination', 'Coordinating multi-agent strategy...');
      
      const context: AgentContext = {};
      if (workspaceContext?.workspaceFolder) {
        context.workspaceRoot = workspaceContext.workspaceFolder;
      }
      if (workspaceContext?.currentFile) {
        context.currentFile = workspaceContext.currentFile;
      }
      if (workspaceContext?.openFiles) {
        context.files = workspaceContext.openFiles;
      }

      // Phase 3: Execution
      setStatus('executing');
      setCurrentProgress('Executing coordinated multi-agent analysis...');
      addLog('agent', 'Executing multi-agent coordination...');

      const result = await orchestrator.processRequest(task, context);
      
      // Log individual agent responses
      Object.entries(result.agentResponses).forEach(([agentKey, response]) => {
        const agentInfo = orchestrator.getAvailableAgents().find(a => a.name.toLowerCase().includes(agentKey));
        const agentName = agentInfo?.name || agentKey;
        
        addLog('agent', `Response received`, agentName, {
          confidence: response.confidence,
          processingTime: response.performance?.processingTime || 0,
          suggestions: response.suggestions?.length || 0
        });
        
        setActiveAgents(prev => [...prev, agentName]);
      });

      // Log coordination results
      if (result.coordination) {
        addLog('coordination', `Strategy: ${result.coordination.strategy} (${Math.round(result.coordination.confidence * 100)}% confidence)`);
        addLog('coordination', `Reasoning: ${result.coordination.reasoning}`);
      }

      // Log performance metrics
      if (result.performance) {
        addLog('performance', `Total time: ${result.performance.totalTime}ms, Parallelism: ${result.performance.parallelism}x`);
        
        Object.entries(result.performance.agentTimes).forEach(([agent, time]) => {
          addLog('performance', `${agent}: ${time}ms`);
        });
      }

      setStatus('completed');
      setCurrentProgress('Task completed successfully!');
      addLog('success', 'Multi-agent coordination completed successfully!');
      
      // Auto-complete after showing results
      setTimeout(() => {
        onComplete(result);
      }, 2000);

    } catch (error) {
      setStatus('error');
      setCurrentProgress('Task execution failed');
      addLog('error', `Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [task, workspaceContext, orchestrator, addLog, onComplete]);

  const handleStop = useCallback(() => {
    setStatus('idle');
    setCurrentProgress('');
    addLog('info', 'Task execution stopped by user');
  }, [addLog]);

  const resetTask = useCallback(() => {
    setStatus('idle');
    setLogs([]);
    setActiveAgents([]);
    setCurrentProgress('');
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  return {
    // State
    task,
    setTask,
    status,
    logs,
    activeAgents,
    agentProfiles,
    expandedSections,
    currentProgress,
    logEndRef,

    // Actions
    executeTask,
    handleStop,
    resetTask,
    toggleSection,
    formatTimestamp,

    // Data
    availableAgents: orchestrator.getAvailableAgents(),
    performanceReport: performanceOptimizer.getPerformanceReport(),
  };
}
