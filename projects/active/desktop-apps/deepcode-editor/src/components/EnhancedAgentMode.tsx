/**
 * Enhanced Agent Mode with improved UX, real-time feedback, and performance monitoring
 */
import React, { useCallback,useEffect, useRef, useState } from 'react';
import { AnimatePresence,motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  FileText,
  Loader2,
  Play,
  Square,
  TrendingUp,
  Users,
  Zap} from 'lucide-react';
import styled from 'styled-components';

import { AgentPerformanceOptimizer, PerformanceProfile } from '../services/AgentPerformanceOptimizer';
import { AgentOrchestrator, OrchestratorResponse } from '../services/specialized-agents/AgentOrchestrator';
import { AgentContext } from '../services/specialized-agents/BaseSpecializedAgent';
import { vibeTheme } from '../styles/theme';

interface EnhancedAgentModeProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: OrchestratorResponse) => void;
  orchestrator: AgentOrchestrator;
  performanceOptimizer: AgentPerformanceOptimizer;
  workspaceContext?: {
    workspaceFolder: string;
    currentFile?: string;
    openFiles?: string[];
  };
}

const Backdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Container = styled(motion.div)`
  width: 95%;
  max-width: 1200px;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  background: ${vibeTheme.colors.primary};
  color: ${vibeTheme.colors.text};
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
  border: 2px solid rgba(139, 92, 246, 0.4);
  overflow: hidden;
  position: relative;
`;

const Header = styled.div`
  padding: 20px 24px;
  border-bottom: ${vibeTheme.borders.thin};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1));
`;

const Title = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  
  svg {
    color: ${vibeTheme.colors.purple};
  }
`;

const StatusSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const StatusIndicator = styled.div<{ $status: 'idle' | 'analyzing' | 'coordinating' | 'executing' | 'completed' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  background: ${props => {
    switch (props.$status) {
      case 'analyzing': return `${vibeTheme.colors.cyan}20`;
      case 'coordinating': return `${vibeTheme.colors.purple}20`;
      case 'executing': return 'rgba(251, 191, 36, 0.2)';
      case 'completed': return `${vibeTheme.colors.success}20`;
      case 'error': return `${vibeTheme.colors.error}20`;
      default: return vibeTheme.colors.surface;
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'analyzing': return vibeTheme.colors.cyan;
      case 'coordinating': return vibeTheme.colors.purple;
      case 'executing': return '#fbbf24';
      case 'completed': return vibeTheme.colors.success;
      case 'error': return vibeTheme.colors.error;
      default: return vibeTheme.colors.text;
    }
  }};
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const TaskSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: ${vibeTheme.borders.thin};
`;

const TaskInput = styled.div`
  padding: 24px;
  border-bottom: ${vibeTheme.borders.thin};
`;

const TaskTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 16px 20px;
  background: ${vibeTheme.colors.surface};
  color: ${vibeTheme.colors.text};
  border: 2px solid transparent;
  border-radius: 12px;
  font-size: 15px;
  resize: vertical;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.purple};
  }
  
  &::placeholder {
    color: ${vibeTheme.colors.textSecondary};
  }
`;

const ExecutionLog = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.7;
`;

const LogEntry = styled(motion.div)<{ $type: 'info' | 'agent' | 'coordination' | 'success' | 'error' | 'performance' }>`
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid ${props => {
    switch (props.$type) {
      case 'agent': return vibeTheme.colors.purple;
      case 'coordination': return vibeTheme.colors.cyan;
      case 'success': return vibeTheme.colors.success;
      case 'error': return vibeTheme.colors.error;
      case 'performance': return '#fbbf24';
      default: return 'transparent';
    }
  }};
  background: ${props => {
    switch (props.$type) {
      case 'agent': return `${vibeTheme.colors.purple}08`;
      case 'coordination': return `${vibeTheme.colors.cyan}08`;
      case 'success': return `${vibeTheme.colors.success}08`;
      case 'error': return `${vibeTheme.colors.error}08`;
      case 'performance': return 'rgba(251, 191, 36, 0.08)';
      default: return 'transparent';
    }
  }};
  
  .timestamp {
    font-size: 11px;
    color: ${vibeTheme.colors.textSecondary};
    margin-right: 12px;
  }
  
  .content {
    color: ${vibeTheme.colors.text};
    
    .agent-name {
      font-weight: 600;
      color: ${props => {
        switch (props.$type) {
          case 'agent': return vibeTheme.colors.purple;
          case 'coordination': return vibeTheme.colors.cyan;
          default: return 'inherit';
        }
      }};
    }
    
    .performance-metric {
      font-size: 12px;
      color: ${vibeTheme.colors.textSecondary};
      margin-left: 8px;
    }
  }
`;

const Sidebar = styled.div`
  width: 320px;
  display: flex;
  flex-direction: column;
  background: rgba(139, 92, 246, 0.05);
  border-left: ${vibeTheme.borders.thin};
`;

const SidebarSection = styled.div`
  border-bottom: ${vibeTheme.borders.thin};
`;

const SidebarHeader = styled.div`
  padding: 16px 20px;
  font-weight: 600;
  font-size: 14px;
  color: ${vibeTheme.colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  svg {
    width: 16px;
    height: 16px;
    color: ${vibeTheme.colors.purple};
  }
`;

const SidebarContent = styled(motion.div)`
  padding: 0 20px 16px;
  font-size: 13px;
`;

const AgentCard = styled.div<{ $active: boolean }>`
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: ${props => props.$active ? `${vibeTheme.colors.purple}15` : vibeTheme.colors.surface};
  border: 2px solid ${props => props.$active ? vibeTheme.colors.purple : 'transparent'};
  transition: all 0.2s;
  
  .agent-name {
    font-weight: 600;
    font-size: 14px;
    color: ${vibeTheme.colors.text};
    margin-bottom: 4px;
  }
  
  .agent-role {
    font-size: 12px;
    color: ${vibeTheme.colors.textSecondary};
    margin-bottom: 8px;
  }
  
  .agent-metrics {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: ${vibeTheme.colors.textSecondary};
  }
`;

const PerformanceMetric = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 12px;
  
  .metric-label {
    color: ${vibeTheme.colors.textSecondary};
  }
  
  .metric-value {
    color: ${vibeTheme.colors.text};
    font-weight: 600;
  }
`;

const Footer = styled.div`
  padding: 20px 24px;
  border-top: ${vibeTheme.borders.thin};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(139, 92, 246, 0.05);
`;

const ActionButton = styled(motion.button)<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return vibeTheme.colors.purple;
      case 'danger': return vibeTheme.colors.error;
      default: return vibeTheme.colors.surface;
    }
  }};
  
  color: ${props => {
    switch (props.$variant) {
      case 'primary':
      case 'danger': 
        return 'white';
      default: 
        return vibeTheme.colors.text;
    }
  }};
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ProgressIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  
  .progress-text {
    font-size: 14px;
    color: ${vibeTheme.colors.text};
  }
  
  .progress-detail {
    font-size: 12px;
    color: ${vibeTheme.colors.textSecondary};
  }
`;

interface LogEntry {
  id: string;
  type: 'info' | 'agent' | 'coordination' | 'success' | 'error' | 'performance';
  timestamp: Date;
  content: string;
  agentName?: string | undefined;
  metrics?: any;
}

type TaskStatus = 'idle' | 'analyzing' | 'coordinating' | 'executing' | 'completed' | 'error';

const EnhancedAgentMode: React.FC<EnhancedAgentModeProps> = ({
  isOpen,
  onClose,
  onComplete,
  orchestrator,
  performanceOptimizer,
  workspaceContext,
}) => {
  const [task, setTask] = useState('');
  const [status, setStatus] = useState<TaskStatus>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [agentProfiles, setAgentProfiles] = useState<Map<string, PerformanceProfile>>(new Map());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['agents', 'performance']));
  const [currentProgress, setCurrentProgress] = useState<string>('');
  const logEndRef = useRef<HTMLDivElement>(null);

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

  const addLog = useCallback((type: LogEntry['type'], content: string, agentName?: string, metrics?: any) => {
    setLogs(prev => [...prev, {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date(),
      content,
      agentName,
      metrics,
    }]);
  }, []);

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const executeTask = async () => {
    if (!task.trim()) {return;}

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
      addLog('info', '🔍 Analyzing task requirements...');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Phase 2: Coordination
      setStatus('coordinating');
      setCurrentProgress('Coordinating multi-agent response strategy...');
      addLog('coordination', '🎯 Coordinating multi-agent strategy...');
      
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
      addLog('agent', '🚀 Executing multi-agent coordination...');

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
      addLog('success', '✅ Multi-agent coordination completed successfully!');
      
      // Auto-complete after showing results
      setTimeout(() => {
        onComplete(result);
      }, 2000);

    } catch (error) {
      setStatus('error');
      setCurrentProgress('Task execution failed');
      addLog('error', `❌ Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStop = () => {
    setStatus('idle');
    setCurrentProgress('');
    addLog('info', 'Task execution stopped by user');
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'analyzing':
        return <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}><Brain size={16} /></motion.div>;
      case 'coordinating':
        return <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}><Users size={16} /></motion.div>;
      case 'executing':
        return <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Loader2 size={16} /></motion.div>;
      case 'completed':
        return <CheckCircle size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      default:
        return null;
    }
  };

  const availableAgents = orchestrator.getAvailableAgents();
  const performanceReport = performanceOptimizer.getPerformanceReport();

  return (
    <AnimatePresence>
      {isOpen && (
        <Backdrop
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <Container
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Header>
              <Title>
                <Zap />
                Enhanced Multi-Agent Mode
              </Title>
              <StatusSection>
                <StatusIndicator $status={status}>
                  {getStatusIcon()}
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </StatusIndicator>
                <div style={{ fontSize: '12px', color: vibeTheme.colors.textSecondary }}>
                  {availableAgents.length} agents available
                </div>
              </StatusSection>
            </Header>

            <MainContent>
              <TaskSection>
                <TaskInput>
                  <TaskTextarea
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    placeholder="Describe what you want the multi-agent system to analyze, build, or optimize... The system will automatically coordinate the best agents for your task."
                    disabled={status !== 'idle'}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        executeTask();
                      }
                    }}
                  />
                  {currentProgress && (
                    <ProgressIndicator>
                      <Activity size={16} style={{ color: vibeTheme.colors.purple }} />
                      <div>
                        <div className="progress-text">{currentProgress}</div>
                        <div className="progress-detail">Multi-agent coordination in progress</div>
                      </div>
                    </ProgressIndicator>
                  )}
                </TaskInput>

                <ExecutionLog>
                  {logs.map((log) => (
                    <LogEntry
                      key={log.id}
                      $type={log.type}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="timestamp">{formatTimestamp(log.timestamp)}</span>
                      <span className="content">
                        {log.agentName && <span className="agent-name">👤 {log.agentName}: </span>}
                        {log.content}
                        {log.metrics && (
                          <span className="performance-metric">
                            ({log.metrics.confidence ? `${Math.round(log.metrics.confidence * 100)}% confidence` : ''}
                            {log.metrics.processingTime ? `, ${log.metrics.processingTime}ms` : ''}
                            {log.metrics.suggestions ? `, ${log.metrics.suggestions} suggestions` : ''})
                          </span>
                        )}
                      </span>
                    </LogEntry>
                  ))}
                  <div ref={logEndRef} />
                </ExecutionLog>
              </TaskSection>

              <Sidebar>
                <SidebarSection>
                  <SidebarHeader onClick={() => toggleSection('agents')}>
                    <Users />
                    Active Agents
                    {expandedSections.has('agents') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </SidebarHeader>
                  <AnimatePresence>
                    {expandedSections.has('agents') && (
                      <SidebarContent
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {availableAgents.map((agent) => {
                          const isActive = activeAgents.includes(agent.name);
                          const profile = agentProfiles.get(agent.name);
                          
                          return (
                            <AgentCard key={agent.name} $active={isActive}>
                              <div className="agent-name">{agent.name}</div>
                              <div className="agent-role">{agent.role}</div>
                              <div className="agent-metrics">
                                <span>
                                  <Activity size={10} /> 
                                  {profile ? Math.round(profile.workloadScore * 100) : 0}%
                                </span>
                                <span>
                                  <Clock size={10} /> 
                                  {profile ? Math.round(profile.avgResponseTime) : 0}ms
                                </span>
                                <span>
                                  <TrendingUp size={10} /> 
                                  {profile ? Math.round(profile.cacheHitRate * 100) : 0}%
                                </span>
                              </div>
                            </AgentCard>
                          );
                        })}
                      </SidebarContent>
                    )}
                  </AnimatePresence>
                </SidebarSection>

                <SidebarSection>
                  <SidebarHeader onClick={() => toggleSection('performance')}>
                    <BarChart3 />
                    Performance
                    {expandedSections.has('performance') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </SidebarHeader>
                  <AnimatePresence>
                    {expandedSections.has('performance') && (
                      <SidebarContent
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <PerformanceMetric>
                          <Clock size={12} />
                          <span className="metric-label">Avg Response:</span>
                          <span className="metric-value">{Math.round(performanceReport.avgResponseTime)}ms</span>
                        </PerformanceMetric>
                        <PerformanceMetric>
                          <TrendingUp size={12} />
                          <span className="metric-label">Cache Hit Rate:</span>
                          <span className="metric-value">{Math.round(performanceReport.cacheEfficiency * 100)}%</span>
                        </PerformanceMetric>
                        <PerformanceMetric>
                          <Eye size={12} />
                          <span className="metric-label">Active Alerts:</span>
                          <span className="metric-value">{performanceReport.activeAlerts}</span>
                        </PerformanceMetric>
                        <PerformanceMetric>
                          <Activity size={12} />
                          <span className="metric-label">Memory Usage:</span>
                          <span className="metric-value">{Math.round(performanceReport.memoryUsage / 1024 / 1024)}MB</span>
                        </PerformanceMetric>
                      </SidebarContent>
                    )}
                  </AnimatePresence>
                </SidebarSection>

                {workspaceContext && (
                  <SidebarSection>
                    <SidebarHeader onClick={() => toggleSection('context')}>
                      <FileText />
                      Context
                      {expandedSections.has('context') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </SidebarHeader>
                    <AnimatePresence>
                      {expandedSections.has('context') && (
                        <SidebarContent
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div style={{ fontSize: '12px', lineHeight: '1.5', color: vibeTheme.colors.textSecondary }}>
                            <div><strong>Workspace:</strong> {workspaceContext.workspaceFolder}</div>
                            {workspaceContext.currentFile && (
                              <div><strong>Current File:</strong> {workspaceContext.currentFile}</div>
                            )}
                            {workspaceContext.openFiles && (
                              <div><strong>Open Files:</strong> {workspaceContext.openFiles.length}</div>
                            )}
                          </div>
                        </SidebarContent>
                      )}
                    </AnimatePresence>
                  </SidebarSection>
                )}
              </Sidebar>
            </MainContent>

            <Footer>
              <div style={{ display: 'flex', gap: '12px' }}>
                {status === 'idle' && (
                  <ActionButton
                    $variant="primary"
                    onClick={executeTask}
                    disabled={!task.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Play size={16} />
                    Execute Multi-Agent Task
                  </ActionButton>
                )}
                
                {['analyzing', 'coordinating', 'executing'].includes(status) && (
                  <ActionButton
                    $variant="danger"
                    onClick={handleStop}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Square size={16} />
                    Stop Execution
                  </ActionButton>
                )}
                
                {['completed', 'error'].includes(status) && (
                  <ActionButton
                    $variant="primary"
                    onClick={() => {
                      setStatus('idle');
                      setLogs([]);
                      setActiveAgents([]);
                      setCurrentProgress('');
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Zap size={16} />
                    New Task
                  </ActionButton>
                )}
              </div>
              
              <ActionButton
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </ActionButton>
            </Footer>
          </Container>
        </Backdrop>
      )}
    </AnimatePresence>
  );
};

export default EnhancedAgentMode;