/**
 * AIChat Component - Main AI chat interface with chat, agent, and composer modes
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FileEdit, Play, Send, X, Zap } from 'lucide-react';

import { logger } from '../../services/Logger';
import type { AgentStep, AgentTask, AIMessage, ApprovalRequest } from '../../types';
import {
  AgentStepsList, ChatContainer, ChatHeader, CloseButton, InputContainer, InputWrapper,
  MessagesContainer, ModeButton, ModeDescription, ModeSwitcher, QuickActionButton,
  QuickActions, ResizeHandle, SendButton, TaskProgressBar, TaskProgressFill, TextInput,
} from './styled';
import { MemoizedStepCard } from './StepCard';
import { MessageItem, TypingMessage } from './MessageItem';
import type { AIChatProps, ChatMode, ModeInfo } from './types';
import { DEFAULT_WIDTH, MAX_WIDTH, MIN_WIDTH } from './types';

const MODE_DESCRIPTIONS: Record<ChatMode, ModeInfo> = {
  chat: { title: 'Chat Mode', description: 'Have conversations with AI, ask questions, get code explanations.' },
  agent: { title: 'Agent Mode', description: 'Let AI autonomously plan and execute complex multi-step tasks.' },
  composer: { title: 'Composer Mode', description: 'AI-powered multi-file editing with intelligent context awareness.' },
};

const MODE_QUICK_ACTIONS: Record<ChatMode, string[]> = {
  chat: ['Explain this code', 'Generate function', 'Add comments', 'Fix bugs', 'Optimize code', 'Write tests'],
  agent: ['Create a new feature', 'Refactor this component', 'Add error handling', 'Generate test suite'],
  composer: ['Update all imports', 'Rename component', 'Move files to new structure', 'Add types across files'],
};

const AIChat: React.FC<AIChatProps> = ({
  messages, onSendMessage, onClose, showReasoningProcess = false, currentModel = 'deepseek-chat',
  mode: externalMode, onModeChange, taskPlanner, executionEngine, workspaceContext,
  onAddMessage, onUpdateMessage, onFileChanged, onTaskComplete, onTaskError, onApprovalRequired,
}) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [internalMode, setInternalMode] = useState<ChatMode>('chat');
  const mode = externalMode || internalMode;
  const [width, setWidth] = useState<number>(() => {
    const saved = localStorage.getItem('aiChatWidth');
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(width);
  const modeInfo = MODE_DESCRIPTIONS[mode];
  const quickActions = MODE_QUICK_ACTIONS[mode];

  const handleModeChange = useCallback((newMode: ChatMode) => {
    onModeChange ? onModeChange(newMode) : setInternalMode(newMode);
    if (newMode === 'agent' || newMode === 'composer') setWidth((w) => Math.max(w, 600));
  }, [onModeChange]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = width;
  }, [width]);

  useEffect(() => {
    if (!isResizing) return;
    const handleResizeMove = (e: MouseEvent) => {
      const deltaX = resizeStartX.current - e.clientX;
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeStartWidth.current + deltaX)));
    };
    const handleResizeEnd = () => {
      setIsResizing(false);
      localStorage.setItem('aiChatWidth', width.toString());
    };
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, width]);

  useEffect(() => { localStorage.setItem('aiChatWidth', width.toString()); }, [width]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleAgentTask = useCallback(async (userRequest: string) => {
    if (!taskPlanner || !executionEngine || !workspaceContext) {
      logger.error('Agent mode requires taskPlanner, executionEngine, and workspaceContext');
      return;
    }
    try {
      executionEngine.setTaskContext(userRequest, workspaceContext.workspaceRoot);
      const planResponse = await taskPlanner.planTask({
        userRequest, context: workspaceContext,
        options: { maxSteps: 10, requireApprovalForAll: false, allowDestructiveActions: true },
      });
      const agentMessageId = Date.now().toString();
      const agentMessage: AIMessage = {
        id: agentMessageId, role: 'assistant',
        content: `**Agent Task**: ${planResponse.task.title}\n\n${planResponse.task.description}`,
        timestamp: new Date(), agentTask: { task: planResponse.task },
      };
      onAddMessage?.(agentMessage);
      const callbacks = {
        onStepStart: (step: AgentStep) => {
          logger.debug('[AIChat] Step started:', step.title);
          onUpdateMessage?.(agentMessageId, (msg) => ({
            ...msg, agentTask: msg.agentTask ? { ...msg.agentTask, currentStep: step } : msg.agentTask,
          }));
        },
        onStepComplete: (step: AgentStep) => {
          logger.debug('[AIChat] Step completed:', step.title);
          onUpdateMessage?.(agentMessageId, (msg) => ({ ...msg }));
        },
        onStepError: (step: AgentStep, error: Error) => {
          logger.error('[AIChat] Step failed:', step.title, error);
          onUpdateMessage?.(agentMessageId, (msg) => ({ ...msg }));
        },
        onFileChanged: (filePath: string, action: 'created' | 'modified' | 'deleted') => {
          onFileChanged?.(filePath, action);
        },
        onStepApprovalRequired: async (step: AgentStep, request: ApprovalRequest) => {
          return onApprovalRequired ? await onApprovalRequired(step, request) : true;
        },
        onTaskComplete: (task: AgentTask) => { onTaskComplete?.(task); },
        onTaskError: (task: AgentTask, error: Error) => { onTaskError?.(task, error); },
      };
      await executionEngine.executeTask(planResponse.task, callbacks);
    } catch (error) {
      logger.error('Agent task failed:', error);
    }
  }, [taskPlanner, executionEngine, workspaceContext, onAddMessage, onUpdateMessage, onFileChanged, onApprovalRequired, onTaskComplete, onTaskError]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    const messageText = input.trim();
    setInput('');
    setIsTyping(true);
    try {
      if (mode === 'agent' && taskPlanner && executionEngine && workspaceContext) {
        await handleAgentTask(messageText);
      } else {
        await onSendMessage(messageText);
      }
    } finally {
      setIsTyping(false);
    }
  }, [input, mode, taskPlanner, executionEngine, workspaceContext, onSendMessage, handleAgentTask]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handleQuickAction = useCallback((action: string) => {
    setInput(action);
    inputRef.current?.focus();
  }, []);

  const renderAgentTask = useCallback((message: AIMessage) => {
    if (!message.agentTask) return null;
    const { task, pendingApproval } = message.agentTask;
    const completedSteps = task.steps.filter((s) => s.status === 'completed').length;
    const progress = (completedSteps / task.steps.length) * 100;
    return (
      <div data-testid="agent-task">
        <TaskProgressBar>
          <TaskProgressFill $progress={progress} initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
        </TaskProgressBar>
        <AgentStepsList>
          {task.steps.map((step) => (
            <MemoizedStepCard
              key={step.id}
              step={step}
              pendingApproval={pendingApproval ?? null}
              handleApproval={(stepId: string, approved: boolean) => {
                logger.debug(approved ? 'Approved step:' : 'Rejected step:', stepId);
              }}
            />
          ))}
        </AgentStepsList>
      </div>
    );
  }, []);

  return (
    <ChatContainer $width={width} $mode={mode}>
      <ResizeHandle $isResizing={isResizing} onMouseDown={handleResizeStart} />
      <ChatHeader>
        {mode === 'chat' && <Zap size={16} />}
        {mode === 'agent' && <Play size={16} />}
        {mode === 'composer' && <FileEdit size={16} />}
        {mode === 'chat' ? 'AI Assistant' : mode === 'agent' ? 'Agent Mode' : 'Composer Mode'}
        <ModeSwitcher>
          <ModeButton $active={mode === 'chat'} onClick={() => handleModeChange('chat')}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} data-testid="mode-chat">Chat</ModeButton>
          <ModeButton $active={mode === 'agent'} onClick={() => handleModeChange('agent')}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} data-testid="mode-agent">Agent</ModeButton>
          <ModeButton $active={mode === 'composer'} onClick={() => handleModeChange('composer')}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Composer</ModeButton>
        </ModeSwitcher>
        <CloseButton onClick={onClose} title="Close AI Chat" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <X size={16} />
        </CloseButton>
      </ChatHeader>
      <ModeDescription initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} key={mode}>
        <strong>{modeInfo.title}</strong>
        {modeInfo.description}
      </ModeDescription>
      <MessagesContainer>
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} showReasoningProcess={showReasoningProcess} renderAgentTask={renderAgentTask} />
        ))}
        {isTyping && <TypingMessage />}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <InputContainer>
        <QuickActions>
          {quickActions.map((action) => (
            <QuickActionButton key={action} onClick={() => handleQuickAction(action)}
              whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>{action}</QuickActionButton>
          ))}
        </QuickActions>
        <InputWrapper>
          <TextInput ref={inputRef} id="ai-chat-input" name="aiChatMessage" data-testid="chat-input"
            value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress}
            placeholder="Ask AI about your code..." disabled={isTyping} />
          <SendButton onClick={handleSend} disabled={!input.trim() || isTyping} title="Send message (Enter)"
            whileHover={!isTyping && input.trim() ? { scale: 1.05 } : {}}
            whileTap={!isTyping && input.trim() ? { scale: 0.95 } : {}}>
            <Send size={16} />
          </SendButton>
        </InputWrapper>
      </InputContainer>
    </ChatContainer>
  );
};

export default AIChat;
export type { AIChatProps, ChatMode } from './types';
