import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Copy, Send, ThumbsDown, ThumbsUp, User, X, Zap } from 'lucide-react';
import styled, { keyframes } from 'styled-components';

import { vibeTheme } from '../styles/theme';
import { AIMessage } from '../types';
import SecureMessageContent from './SecureMessageContent';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const ChatContainer = styled.div`
  width: 380px;
  background: ${vibeTheme.colors.secondary};
  border-left: 2px solid rgba(139, 92, 246, 0.2);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 2px;
    height: 100%;
    background: ${vibeTheme.gradients.border};
    opacity: 0.6;
  }
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  padding: ${vibeTheme.spacing.md};
  background: linear-gradient(
    135deg,
    ${vibeTheme.colors.primary} 0%,
    ${vibeTheme.colors.secondary} 100%
  );
  border-bottom: 2px solid rgba(139, 92, 246, 0.2);
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.bold};
  color: ${vibeTheme.colors.text};
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${vibeTheme.gradients.border};
    opacity: 0.6;
  }

  svg {
    margin-right: ${vibeTheme.spacing.sm};
    color: ${vibeTheme.colors.cyan};
    filter: drop-shadow(0 0 4px ${vibeTheme.colors.cyan}50);
  }
`;

const CloseButton = styled(motion.button)`
  background: transparent;
  border: none;
  color: ${vibeTheme.colors.textSecondary};
  cursor: pointer;
  padding: ${vibeTheme.spacing.sm};
  margin-left: auto;
  border-radius: ${vibeTheme.borderRadius.small};
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    color: ${vibeTheme.colors.error};
    transform: scale(1.05);
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${vibeTheme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${vibeTheme.spacing.md};

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${vibeTheme.colors.primary};
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: ${vibeTheme.borderRadius.small};

    &:hover {
      background: rgba(139, 92, 246, 0.5);
    }
  }
`;

const Message = styled(motion.div)<{ role: 'user' | 'assistant' }>`
  display: flex;
  align-items: flex-start;
  gap: ${vibeTheme.spacing.sm};
  max-width: 100%;
  padding: ${vibeTheme.spacing.sm};
  border-radius: ${vibeTheme.borderRadius.medium};
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    background: rgba(139, 92, 246, 0.05);
  }
`;

const MessageIcon = styled.div<{ role: 'user' | 'assistant' }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${(props) =>
    props.role === 'user' ? vibeTheme.gradients.primary : vibeTheme.gradients.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  box-shadow: ${vibeTheme.shadows.small};
  border: 2px solid
    ${(props) => (props.role === 'user' ? vibeTheme.colors.cyan : vibeTheme.colors.purple)};

  svg {
    color: ${vibeTheme.colors.text};
    filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.3));
  }
`;

const MessageContent = styled.div`
  flex: 1;
  min-width: 0;
`;

// Removed MessageText styled component - now using SecureMessageContent

const MessageActions = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 4px;
  opacity: 0;
  transition: opacity 0.2s;

  ${Message}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled(motion.button)`
  background: transparent;
  border: none;
  color: ${vibeTheme.colors.textMuted};
  cursor: pointer;
  padding: ${vibeTheme.spacing.xs};
  border-radius: ${vibeTheme.borderRadius.small};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    background: rgba(139, 92, 246, 0.2);
    color: ${vibeTheme.colors.cyan};
    transform: scale(1.1);
  }
`;

const MessageTime = styled.div`
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${vibeTheme.colors.textMuted};
  margin-top: ${vibeTheme.spacing.xs};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
`;

const ReasoningContent = styled.details`
  margin-top: ${vibeTheme.spacing.sm};
  padding: ${vibeTheme.spacing.sm};
  background: rgba(139, 92, 246, 0.1);
  border-radius: ${vibeTheme.borderRadius.small};
  border: 1px solid rgba(139, 92, 246, 0.2);

  summary {
    cursor: pointer;
    color: ${vibeTheme.colors.purple};
    font-size: ${vibeTheme.typography.fontSize.sm};
    font-weight: ${vibeTheme.typography.fontWeight.medium};
    margin-bottom: ${vibeTheme.spacing.xs};

    &:hover {
      color: ${vibeTheme.colors.cyan};
    }
  }

  pre {
    margin: 0;
    padding: ${vibeTheme.spacing.sm};
    background: rgba(26, 26, 46, 0.5);
    border-radius: ${vibeTheme.borderRadius.small};
    overflow-x: auto;
    font-size: ${vibeTheme.typography.fontSize.xs};
    line-height: 1.5;
  }
`;

const InputContainer = styled.div`
  padding: ${vibeTheme.spacing.md};
  border-top: 2px solid rgba(139, 92, 246, 0.2);
  background: linear-gradient(
    135deg,
    ${vibeTheme.colors.primary} 0%,
    ${vibeTheme.colors.secondary} 100%
  );
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${vibeTheme.gradients.border};
    opacity: 0.6;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  gap: ${vibeTheme.spacing.sm};
  align-items: flex-end;
`;

const TextInput = styled.textarea`
  flex: 1;
  background: rgba(26, 26, 46, 0.8);
  border: 2px solid rgba(139, 92, 246, 0.2);
  color: ${vibeTheme.colors.text};
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  border-radius: ${vibeTheme.borderRadius.medium};
  font-size: ${vibeTheme.typography.fontSize.sm};
  resize: none;
  min-height: 40px;
  max-height: 120px;
  font-family: ${vibeTheme.typography.fontFamily.primary};
  backdrop-filter: blur(10px);
  transition: all ${vibeTheme.animation.duration.normal} ease;

  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.cyan};
    background: rgba(26, 26, 46, 1);
    box-shadow: 0 0 12px rgba(0, 212, 255, 0.3);
    transform: scale(1.02);
  }

  &::placeholder {
    color: ${vibeTheme.colors.textMuted};
  }
`;

const SendButton = styled(motion.button)<{ disabled: boolean }>`
  background: ${(props) =>
    props.disabled ? 'rgba(139, 92, 246, 0.2)' : vibeTheme.gradients.primary};
  border: 2px solid ${(props) => (props.disabled ? 'rgba(139, 92, 246, 0.1)' : 'transparent')};
  color: ${(props) => (props.disabled ? vibeTheme.colors.textMuted : vibeTheme.colors.text)};
  padding: ${vibeTheme.spacing.sm};
  border-radius: ${vibeTheme.borderRadius.medium};
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  transition: all ${vibeTheme.animation.duration.normal} ease;
  box-shadow: ${(props) => (props.disabled ? 'none' : vibeTheme.shadows.small)};

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow:
      ${vibeTheme.shadows.medium},
      0 0 16px rgba(139, 92, 246, 0.4);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
  padding: ${vibeTheme.spacing.sm} 0;
  color: ${vibeTheme.colors.cyan};
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-style: italic;

  &::after {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${vibeTheme.colors.cyan};
    animation: ${pulse} 1.4s infinite;
    box-shadow: 0 0 8px ${vibeTheme.colors.cyan};
  }
`;

const QuickActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${vibeTheme.spacing.xs};
  margin-bottom: ${vibeTheme.spacing.sm};
`;

const QuickActionButton = styled(motion.button)`
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: ${vibeTheme.colors.textSecondary};
  padding: ${vibeTheme.spacing.xs} ${vibeTheme.spacing.sm};
  border-radius: ${vibeTheme.borderRadius.small};
  cursor: pointer;
  font-size: ${vibeTheme.typography.fontSize.xs};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  transition: all ${vibeTheme.animation.duration.fast} ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(139, 92, 246, 0.2);
    border-color: ${vibeTheme.colors.cyan};
    color: ${vibeTheme.colors.text};
    transform: translateY(-1px);
    box-shadow: ${vibeTheme.shadows.small};
  }
`;

interface AIChatProps {
  messages: AIMessage[];
  onSendMessage: (message: string) => void;
  onClose: () => void;
  showReasoningProcess?: boolean | undefined;
  currentModel?: string | undefined;
}

const AIChat: React.FC<AIChatProps> = ({
  messages,
  onSendMessage,
  onClose,
  showReasoningProcess = false,
  currentModel = 'deepseek-chat',
}) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const getQuickActions = () => {
    switch (currentModel) {
      case 'deepseek-coder':
        return [
          'Generate REST API',
          'Create React component',
          'Implement algorithm',
          'Design pattern example',
          'Refactor to TypeScript',
          'Add error handling',
        ];
      case 'deepseek-reasoner':
        return [
          'Debug this issue',
          'Analyze complexity',
          'Compare approaches',
          'Design system architecture',
          'Explain the logic',
          'Find edge cases',
        ];
      default: // deepseek-chat
        return [
          'Explain this code',
          'Generate function',
          'Add comments',
          'Fix bugs',
          'Optimize code',
          'Write tests',
        ];
    }
  };

  const quickActions = getQuickActions();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input when chat opens
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

    const messageText = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      await onSendMessage(messageText);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    inputRef.current?.focus();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could show a toast notification here
  };

  // Removed formatMessage function - now using SecureMessageContent component

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ChatContainer>
      <ChatHeader>
        <Zap size={16} />
        AI Assistant
        <CloseButton
          onClick={onClose}
          title="Close AI Chat"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <X size={16} />
        </CloseButton>
      </ChatHeader>

      <MessagesContainer>
        {messages.map((message) => (
          <Message
            key={message.id}
            role={message.role}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MessageIcon role={message.role}>
              {message.role === 'user' ? <User size={12} /> : <Bot size={12} />}
            </MessageIcon>
            <MessageContent>
              <SecureMessageContent 
                content={message.content} 
                role={message.role} 
              />
              {showReasoningProcess &&
                message.reasoning_content &&
                message.role === 'assistant' && (
                  <ReasoningContent>
                    <summary>🧠 View Reasoning Process</summary>
                    <SecureMessageContent 
                      content={message.reasoning_content} 
                      role="assistant" 
                    />
                  </ReasoningContent>
                )}
              <MessageActions>
                <ActionButton
                  onClick={() => copyToClipboard(message.content)}
                  title="Copy message"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Copy size={12} />
                </ActionButton>
                {message.role === 'assistant' && (
                  <>
                    <ActionButton
                      title="Good response"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ThumbsUp size={12} />
                    </ActionButton>
                    <ActionButton
                      title="Poor response"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ThumbsDown size={12} />
                    </ActionButton>
                  </>
                )}
              </MessageActions>
              <MessageTime>{formatTime(message.timestamp)}</MessageTime>
            </MessageContent>
          </Message>
        ))}

        {isTyping && (
          <Message role="assistant">
            <MessageIcon role="assistant">
              <Bot size={12} />
            </MessageIcon>
            <MessageContent>
              <TypingIndicator>AI is thinking...</TypingIndicator>
            </MessageContent>
          </Message>
        )}

        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer>
        <QuickActions>
          {quickActions.map((action) => (
            <QuickActionButton
              key={action}
              onClick={() => handleQuickAction(action)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {action}
            </QuickActionButton>
          ))}
        </QuickActions>

        <InputWrapper>
          <TextInput
            ref={inputRef}
            id="ai-chat-input"
            name="aiChatMessage"
            aria-label="AI chat message input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask AI about your code..."
            disabled={isTyping}
          />
          <SendButton
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            title="Send message (Enter)"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send size={16} />
          </SendButton>
        </InputWrapper>
      </InputContainer>
    </ChatContainer>
  );
};

export default AIChat;
