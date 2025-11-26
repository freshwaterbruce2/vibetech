/**
 * AIChat MessageItem Component
 * Renders individual chat messages with icons, actions, and timestamps
 */
import { Bot, Copy, ThumbsDown, ThumbsUp, User } from 'lucide-react';

import type { AIMessage } from '../../types';
import SecureMessageContent from '../SecureMessageContent';
import {
  ActionButton,
  Message,
  MessageActions,
  MessageContent,
  MessageIcon,
  MessageTime,
  ReasoningContent,
  TypingIndicator,
} from './styled';
import type { MessageItemProps } from './types';

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text);
}

export function MessageItem({ message, showReasoningProcess, renderAgentTask }: MessageItemProps) {
  const role = message.role === 'system' ? 'assistant' : message.role;

  return (
    <Message
      role={role}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <MessageIcon role={role}>
        {message.role === 'user' ? <User size={12} /> : <Bot size={12} />}
      </MessageIcon>
      <MessageContent>
        <SecureMessageContent content={message.content} role={role} />
        {message.agentTask && renderAgentTask && renderAgentTask(message)}
        {showReasoningProcess && message.reasoning_content && message.role === 'assistant' && (
          <ReasoningContent>
            <summary>View Reasoning Process</summary>
            <SecureMessageContent content={message.reasoning_content} role="assistant" />
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
              <ActionButton title="Good response" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <ThumbsUp size={12} />
              </ActionButton>
              <ActionButton title="Poor response" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <ThumbsDown size={12} />
              </ActionButton>
            </>
          )}
        </MessageActions>
        <MessageTime>{formatTime(message.timestamp)}</MessageTime>
      </MessageContent>
    </Message>
  );
}

export function TypingMessage() {
  return (
    <Message role="assistant">
      <MessageIcon role="assistant">
        <Bot size={12} />
      </MessageIcon>
      <MessageContent>
        <TypingIndicator>AI is thinking...</TypingIndicator>
      </MessageContent>
    </Message>
  );
}

export default MessageItem;
